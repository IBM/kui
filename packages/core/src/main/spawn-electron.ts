/*
 * Copyright 2017-18 IBM Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import Debug from 'debug'
const debug = Debug('main/spawn-electron')
debug('loading')

import { IpcMainEvent, Rectangle } from 'electron'

import windowDefaults from '../webapp/defaults'
import ISubwindowPrefs from '../models/SubwindowPrefs'

/**
 * Keep a global reference of the window object, if you don't, the window will
 * be closed automatically when the JavaScript object is garbage collected.
 *
 */
let nWindows = 0

interface EventEmitter {
  on(event: string, listener: Function): void
  once(event: string, listener: Function): void
}
interface App extends EventEmitter {
  hide(): void
  quit(): void
  exit(exitCode?: number): void
  requestSingleInstanceLock(): boolean
}

/**
 * Keep refs to the electron app around
 *
 */
let app: App

export function createWindow(
  noHeadless = false,
  executeThisArgvPlease?: string[],
  subwindowPlease?: boolean,
  subwindowPrefs?: ISubwindowPrefs
) {
  debug('createWindow', executeThisArgvPlease)

  if (subwindowPrefs && subwindowPrefs.bringYourOwnWindow) {
    subwindowPrefs.bringYourOwnWindow()
    return
  }

  // Create the browser window.
  let width = (subwindowPrefs && subwindowPrefs.width) || 1280
  let height = (subwindowPrefs && subwindowPrefs.height) || 960
  if (process.env.WINDOW_WIDTH) {
    width = parseInt(process.env.WINDOW_WIDTH, 10)
    if (isNaN(width)) {
      console.error('Cannot parse WINDOW_WIDTH ' + process.env.WINDOW_WIDTH)
      width = 1280
    }
  }
  if (process.env.WINDOW_HEIGHT) {
    height = parseInt(process.env.WINDOW_HEIGHT, 10)
    if (isNaN(height)) {
      console.error('Cannot parse WINDOW_HEIGHT ' + process.env.WINDOW_HEIGHT)
      height = 960
    }
  }

  let promise = Promise.resolve()
  if (!app) {
    debug('we need to spawn electron', subwindowPlease, subwindowPrefs)
    delete subwindowPrefs.synonymFor // circular JSON
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    promise = initElectron(['--'].concat(executeThisArgvPlease), {}, subwindowPlease, subwindowPrefs)
      .then(async () => {
        app = (await import('electron')).app as App
      })
      .catch((err: Error) => {
        // headless
        debug('not ready for graphics', err)
      })
  }

  // note: titleBarStyle on macOS needs to be customButtonsOnHover if we want to support cursor:pointer
  // but this doesn't render the inset window buttons
  // see https://github.com/electron/electron/issues/10243
  promise.then(async () => {
    const { imageHome }: { imageHome: string } = await import('@kui-shell/client/config.d/client.json')
    const { productName }: { productName: string } = await import('@kui-shell/client/config.d/name.json')
    const { filesystem }: { filesystem: { linux: string; win32: string } } = await import(
      '@kui-shell/client/config.d/icons.json'
    )

    const Electron = await import('electron')
    const opts: Electron.BrowserWindowConstructorOptions = Object.assign(
      {
        title: productName,
        width,
        height,
        webPreferences: {
          backgroundThrottling: false,
          nodeIntegration: true // prior to electron 5, this was the default
        }
        // titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default'
      },
      subwindowPrefs && subwindowPrefs.position
    )

    // if user ups zoom level, reloads, we're stuck at a higher zoom
    // see https://github.com/electron/electron/issues/10572
    // note that this requires show: false above
    opts.webPreferences.zoomFactor = 1

    const { dirname, join } = await import('path')
    const root = dirname(require.resolve('@kui-shell/prescan.json'))
    if (process.platform === 'linux') {
      const icon = join(root, 'build', imageHome, filesystem.linux)
      opts.icon = icon
    } else if (process.platform === 'win32') {
      const icon = join(root, 'build', imageHome, filesystem.win32)
      opts.icon = icon
    }
    if (process.platform === 'linux' || process.platform === 'win32') {
      opts.autoHideMenuBar = true
    }

    if (subwindowPlease) {
      // this tells electron to size content to the given width and height,
      // (i.e. NOT vice versa, to size the window to the content!)
      opts.useContentSize = true
    }

    if (process.env.KUI_POSITION_X) {
      opts.x = parseInt(process.env.KUI_POSITION_X, 10)
    }
    if (process.env.KUI_POSITION_Y) {
      opts.y = parseInt(process.env.KUI_POSITION_Y, 10)
    }
    debug('createWindow::new BrowserWindow')
    interface KuiBrowserWindow extends Electron.BrowserWindow {
      executeThisArgvPlease?: string[]
      subwindow?: ISubwindowPrefs
    }
    const mainWindow = new Electron.BrowserWindow(opts) as KuiBrowserWindow
    nWindows++
    debug('createWindow::new BrowserWindow success')

    mainWindow.once('ready-to-show', () => {
      mainWindow.setVisibleOnAllWorkspaces(true)
      mainWindow.show()
      mainWindow.setVisibleOnAllWorkspaces(false)
    })

    // remember certain classes of windows, so we don't have multiple
    // open; e.g. one for docs, one for videos...
    interface Win {
      window?: Electron.BrowserWindow
      url?: string
    }
    const fixedWindows: Record<string, Win> = {}
    const openFixedWindow = (opts: {
      type: string
      event: Event
      url: string
      size?: { width: number; height: number }
      position?: { x: number; y: number }
      options?: any // eslint-disable-line @typescript-eslint/no-explicit-any
    }) => {
      const { type, event, url, size = mainWindow.getBounds(), position = mainWindow.getBounds() } = opts

      const existing = fixedWindows[type] || ({} as Win)
      const { window: existingWindow, url: currentURL } = existing

      if (!existingWindow || existingWindow.isDestroyed()) {
        const window = new Electron.BrowserWindow({
          width: size.width,
          height: size.height,
          frame: true
        })
        fixedWindows[type] = { window, url }
        window.setPosition(position.x + 62, position.y + 62)
        // window.on('closed', () => { docsWindow = null })
        window.loadURL(url)
      } else {
        if (currentURL !== url) {
          existingWindow.loadURL(url)
          existing.url = url
        }
        existingWindow.focus()
      }

      event.preventDefault()
    }

    /** this event handler will be called when the window's content finishes loading */
    mainWindow.webContents.on('did-finish-load', async () => {
      if (mainWindow) {
        try {
          // const { switchToPersistedThemeChoice } = await import('../webapp/themes/persistence')
          // await switchToPersistedThemeChoice(mainWindow.webContents /*, Electron.nativeTheme.shouldUseDarkColors */)
        } catch (err) {
          console.error('error initializing themes', err)
        }
      }
    })

    /** jump in and manage the way popups create new windows */
    mainWindow.webContents.on(
      'new-window',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (event: Event, url: string, frameName: string, disposition: string, options: any) => {
        if (url.startsWith('https://youtu.be')) {
          // special handling of youtube links
          openFixedWindow({
            type: 'videos',
            event,
            url,
            options,
            size: { width: 800, height: 600 }
          })
        } else {
          event.preventDefault()
          Electron.shell.openExternal(url)
        }
      }
    )

    let commandContext = executeThisArgvPlease && executeThisArgvPlease.find(_ => /--command-context/.test(_))
    if (commandContext) {
      executeThisArgvPlease = executeThisArgvPlease.filter(_ => !_.match(/--command-context/))

      // strip off the leading --, to help with URL window.location.search
      commandContext = commandContext.replace(/^--/, '')
    }

    if (noHeadless === true && executeThisArgvPlease) {
      debug('setting argv', executeThisArgvPlease)
      mainWindow.executeThisArgvPlease = executeThisArgvPlease
    }
    debug('subwindowPrefs', subwindowPrefs)
    if (subwindowPrefs && Object.keys(subwindowPrefs).length > 0) {
      mainWindow.subwindow = subwindowPrefs
    }

    // and load the index.html of the app.
    const urlSpec = {
      pathname: join(
        root,
        `build/index${process.env.KUI_TEST_PARALLEL && process.env.PORT_OFFSET ? process.env.PORT_OFFSET : ''}.html`
      ),
      protocol: 'file:',
      search: commandContext ? `?${commandContext}` : '',
      slashes: true
    }
    debug('mainWindow::loadURL', urlSpec)
    try {
      mainWindow.loadURL(require('url').format(urlSpec))
    } catch (err) {
      const errorIsNavigatedError: boolean =
        err.message.includes('Inspected target navigated or closed') ||
        err.message.includes('cannot determine loading status') ||
        err.message.includes('Inspected target navigated or closed')

      if (!process.env.TRAVIS_JOB_ID || !errorIsNavigatedError) {
        throw err
      }
    }

    debug('install menus')
    require('./menu').install(createWindow)

    // Open the DevTools.
    // mainWindow.webContents.openDevTools()

    // Emitted when the window is closed.
    mainWindow.once('closed', function() {
      // Dereference the window object, usually you would store windows
      // in an array if your app supports multi windows, this is the time
      // when you should delete the corresponding element.
      nWindows--
    })

    //
    // set up ipc from renderer
    //
    const { ipcMain } = Electron

    //
    // take a screenshot; note that this has to be done in the main
    // process, due to the way clipboard.writeImage is implemented on
    // Linux. on macOS, this could be done entirely in the renderer
    // process. on Linux, however, the nativeImages aren't
    // translatable between the renderer and main processes as fluidly
    // as they are on macOS. oh well! this is why the screenshot
    // plugin has to pollute main.js
    //
    debug('ipc registration')
    ipcMain.on('capture-page-to-clipboard', async (event: IpcMainEvent, contentsId: string, rect: Rectangle) => {
      try {
        const { clipboard, nativeImage, webContents } = Electron
        const image = await webContents.fromId(parseInt(contentsId, 10)).capturePage(rect)
        try {
          const buf = image.toPNG()
          clipboard.writeImage(nativeImage.createFromBuffer(buf))
          event.sender.send('capture-page-to-clipboard-done', buf)
        } catch (err) {
          console.log(err)
          event.sender.send('capture-page-to-clipboard-done')
        }
      } catch (err) {
        console.log(err)
        event.sender.send('capture-page-to-clipboard-done')
      }
    })
    // end of screenshot logic

    ipcMain.on('synchronous-message', (event, arg: string) => {
      const message = JSON.parse(arg)
      switch (message.operation) {
        case 'quit':
          app.quit()
          break
        case 'open-graphical-shell':
          createWindow(true)
          break
        case 'enlarge-window':
          mainWindow.setContentSize(1400, 1050, true)
          break
        case 'reduce-window':
          mainWindow.setContentSize(1024, 768, true)
          break
        case 'maximize-window':
          mainWindow.maximize()
          break
        case 'unmaximize-window':
          mainWindow.unmaximize()
          break
      }
      event.returnValue = 'ok'
    })
    ipcMain.on('/exec/invoke', async (event, arg: string) => {
      const message = JSON.parse(arg)
      const channel = `/exec/response/${message.hash}`
      debug('invoke', message)

      try {
        const mod = await import(message.module)
        debug('invoke got module')

        const returnValue = await mod[message.main || 'main'](message.args)
        debug('invoke got returnValue', returnValue)

        event.sender.send(
          channel,
          JSON.stringify({
            success: true,
            returnValue
          })
        )
      } catch (error) {
        debug('error in exec', error)
        event.sender.send(
          channel,
          JSON.stringify({
            success: false,
            error
          })
        )
      }
    })

    debug('createWindow done')
  })
}

/**
 * Strip off the command to be executed from the given argv
 *
 */
interface Command {
  argv: string[]
  subwindowPlease: boolean
  subwindowPrefs: ISubwindowPrefs
}
export const getCommand = (argv: string[]): Command => {
  debug('getCommand', argv)
  const dashDash = argv.lastIndexOf('--')
  argv = dashDash === -1 ? argv.slice(1) : argv.slice(dashDash + 1)

  // re: the -psn bit, opening Kui from macOS Finder adds additional argv -psn; see: https://github.com/IBM/kui/issues/382
  argv = argv.filter(_ => _ !== '--ui' && _ !== '--no-color' && !_.match(/^-psn/))

  // re: argv.length === 0, this should happen for double-click launches
  const isShell =
    !process.env.KUI_POPUP &&
    (argv.length === 0 ||
      argv.find(_ => _ === 'shell') ||
      (process.env.RUNNING_SHELL_TEST && !process.env.KUI_TEE_TO_FILE))

  debug('isShell', argv, isShell)

  let subwindowPlease = true
  let subwindowPrefs: ISubwindowPrefs = {
    fullscreen: true,
    width: windowDefaults.width,
    height: windowDefaults.height
  }

  if (isShell) {
    // use a full window for 'shell'
    argv = ['shell']
    subwindowPlease = false
    subwindowPrefs = {}
  } else if (process.env.KUI_POPUP) {
    argv = JSON.parse(process.env.KUI_POPUP)
  }

  debug('using args', argv, subwindowPrefs)
  return { argv, subwindowPlease, subwindowPrefs }
}

/**
 * Spawn electron
 *
 */
export async function initElectron(
  command: string[] = [],
  { isRunningHeadless = false } = {},
  subwindowPlease?: boolean,
  subwindowPrefs?: ISubwindowPrefs
) {
  debug('initElectron', command, subwindowPlease, subwindowPrefs)

  if (!app) {
    debug('loading electron')
    const Electron = await import('electron')
    app = Electron.app

    if (!app) {
      // then we're still in pure headless mode; we'll need to fork ourselves to spawn electron
      const path = await import('path')
      const { spawn } = await import('child_process')
      const appHome = path.resolve(path.join(__dirname, 'main'))

      const args = [appHome, '--', ...command]
      debug('spawning electron', appHome, args)

      // pass through any window options, originating from the command's usage model, on to the subprocess
      const windowOptions: Record<string, string> = {}
      if (subwindowPlease) {
        debug('passing through subwindowPlease', subwindowPlease)
        windowOptions['subwindowPlease'] = subwindowPlease.toString()
      }
      if (subwindowPrefs && Object.keys(subwindowPrefs).length > 0) {
        debug('passing through subwindowPrefs', subwindowPrefs)
        windowOptions['subwindowPrefs'] = JSON.stringify(subwindowPrefs)
      }

      // note how we ignore the subprocess's stdio if debug mode
      // is not enabled this allows you (as a developer) to
      // debug issues with spawning the subprocess by passing
      // DEBUG=* or DEBUG=main
      const env = Object.assign({}, process.env, windowOptions)
      delete env.KUI_HEADLESS
      const child = spawn(Electron.toString(), args, {
        stdio: debug.enabled ? 'inherit' : 'ignore',
        env,
        detached: true // needed on windows to separate this process into its own process group
      })

      if (!debug.enabled) {
        // as with the "ignore stdio" comment immediately
        // above: unless we're in DEBUG mode, let's disown
        // ("unref" in nodejs terms) the subprocess
        child.unref()
      }

      debug('spawning electron done, this process will soon exit')
      process.exit(0)
    } else {
      debug('loading electron done')
    }
  }

  // deal with multiple processes
  if (!process.env.RUNNING_SHELL_TEST) {
    app.on('second-instance', (event: Electron.Event, commandLine: string[]) => {
      // Someone tried to run a second instance, open a new window
      // to handle it
      const { argv, subwindowPlease, subwindowPrefs } = getCommand(commandLine)
      debug('opening window for second instance', commandLine, subwindowPlease, subwindowPrefs)
      createWindow(true, argv, subwindowPlease, subwindowPrefs)
    })
    if (!app.requestSingleInstanceLock()) {
      // The primary instance of app failed to optain the lock, which means another instance of app is already running with the lock
      debug('exiting, since we are not the first instance')
      return app.exit(0)
    }
  }

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.once('ready', () => {
    debug('opening primary window', command)
    createWindow(true, command.length > 0 && command, subwindowPlease, subwindowPrefs)
  })

  // Quit when all windows are closed.
  app.on('window-all-closed', function() {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin' || isRunningHeadless) {
      // if we're running headless, then quit on window closed, no matter which platform we're on
      app.quit()
    } else {
      app.hide()
    }
  })

  app.on('activate', function() {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (nWindows === 0) {
      createWindow()
    }
  })
} /* initElectron */
