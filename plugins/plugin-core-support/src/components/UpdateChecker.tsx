/*
 * Copyright 2020 IBM Corporation
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

import * as React from 'react'
import * as needle from 'needle'

import { eventChannelUnsafe, getCurrentTab, i18n } from '@kui-shell/core'
import { Icons, TextWithIconWidget } from '@kui-shell/plugin-client-common'

const strings = i18n('plugin-core-support')

/** Releases page */
const RELEASE = (tag: string) => `https://github.com/IBM/kui/releases/tag/${tag}`

/** Releases feed */
const FEED = 'https://github.com/IBM/kui/releases.atom'

/** By default, check for updates once a day */
const DEFAULT_INTERVAL = 24 * 60 * 60 * 1000

/** By default, wait 5 minutes after statup for the first check */
const DEFAULT_LAG = 0 // 5 * 60 * 1000

/** Remember that the version "duly noted" the availability of particular version in localStorage, using this key */
const DULY_NOTED_KEY = 'kui-shell.org/UpdateChecker/DulyNoted'

interface Props {
  /** wait this long (millis) before the first update check */
  lag?: number

  /** periodically check for updates with this interval (millis) */
  interval?: number
}

interface State {
  /** timer that periodically checks for updates */
  pinger: ReturnType<typeof setInterval>

  /** version we are running */
  currentVersion: string

  /** latest version on the release FEED */
  latestVersion: string

  /** user has acknowledged the given version */
  dulyNoted: string
}

export default class UpdateChecker extends React.PureComponent<Props, State> {
  public constructor(props: Props) {
    super(props)

    setTimeout(() => this.checkForUpdates(), this.props.lag || DEFAULT_LAG)

    this.state = {
      pinger: this.initPinger(),
      currentVersion: undefined,
      latestVersion: undefined,
      dulyNoted: localStorage.getItem(DULY_NOTED_KEY)
    }
  }

  /** Initialize a timer that periodically checks for updates */
  private initPinger() {
    return setInterval(() => {
      this.checkForUpdates()
    }, this.props.interval || DEFAULT_INTERVAL)
  }

  /** Ping the release feed to check for the latest release */
  private checkForUpdates() {
    needle('get', FEED, { json: true })
      .then(res => {
        return res.body.children.filter(_ => _.name === 'entry')[0].children.find(_ => _.name === 'title').value
      })
      .then(latestVersion =>
        this.setState(curState => ({
          latestVersion,
          dulyNoted: curState.dulyNoted && curState.dulyNoted !== latestVersion ? undefined : curState.dulyNoted
        }))
      )
      .catch(err => {
        console.error('error checking for updates', err)
      })
  }

  /** What version are we running? */
  private async getCurrentVersion() {
    if (!this.state.currentVersion) {
      const tab = getCurrentTab()
      if (!tab || !tab.REPL) {
        if (tab && !tab.REPL) {
          eventChannelUnsafe.once(`/tab/new/${tab.uuid}`, () => this.getCurrentVersion())
        }
        return
      }

      const currentVersion = await tab.REPL.qexec<string>('version')
      this.setState({ currentVersion })
    }
  }

  public componentDidMount() {
    this.getCurrentVersion()
  }

  /** Bye! */
  public componentWillUnmount() {
    if (this.state.pinger) {
      clearInterval(this.state.pinger)
    }
  }

  /** Given current state, is an update available? */
  private isUpdateAvailable() {
    return (
      this.state.latestVersion &&
      this.state.currentVersion !== this.state.latestVersion &&
      this.state.latestVersion !== this.state.dulyNoted
    )
  }

  /** Text for update available notification */
  private text() {
    return this.isUpdateAvailable() ? strings('versionX available', this.state.latestVersion) : ''
  }

  /** Icon decoration for update available notification */
  private viewLevel() {
    return this.isUpdateAvailable() ? 'ok' : 'hidden'
  }

  /** Icon for update available notification */
  private icon() {
    return this.isUpdateAvailable() && <Icons icon="Notification" />
  }

  /** User has acknoledged the notification  */
  private async dulyNoted() {
    try {
      localStorage.setItem(DULY_NOTED_KEY, this.state.latestVersion)
      const { shell } = await import(/* webpackMode: "lazy" */ 'electron')
      shell.openExternal(RELEASE(this.state.latestVersion))
    } catch (err) {
      console.error('Error opening releases page')
    }

    this.setState({
      dulyNoted: this.state.latestVersion
    })
  }

  public render() {
    return (
      <TextWithIconWidget
        text={this.text()}
        viewLevel={this.viewLevel()}
        id="kui--plugin-core-support--update-checker"
        title="Click to see the changelog and download the new release"
        iconOnclick={() => this.dulyNoted()}
        textOnclick={() => this.dulyNoted()}
      >
        {this.icon()}
      </TextWithIconWidget>
    )
  }
}
