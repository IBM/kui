/*
 * Copyright 2018-19 IBM Corporation
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

import * as Debug from 'debug'

import { IEvaluatorArgs } from '@kui-shell/core/models/command'

import { getCreds } from './openwhisk'
const debug = Debug('wrk/scriptgen')

import fs = require('fs')
import tmp = require('tmp')
import url = require('url')
import path = require('path')

/**
 * User has requested to test an openwhisk action
 *
 */
export const generateScriptForAction = ({ options }) => action => new Promise((resolve, reject) => {
  fs.readFile(path.join(__dirname, '../scripts/echo.lua'), (err, data) => {
    if (err) {
      reject(err)
    } else {
      tmp.file((err, path, fd, cleanupCallback) => {
        if (err) {
          reject(err)
        } else {
          // fs.write(fd, `wrk.method = "${method}"\n`)
          // fs.write(fd, 'wrk.body   = \'{ "name": "nick" }\'\n')
          // fs.write(fd, 'wrk.headers["Content-Type"] = "application/json"\n')
          // fs.write(fd, `wrk.headers["Authorization"] = "Basic ${Buffer.from(wsk.auth.get()).toString('base64')}"\n`)

          // openwhisk auth key; either a command line
          // argument, or the global one previously chosen
          // by the user
          Promise.resolve().then(() => getCreds(options).then(({ apiHost, auth }) => {
            fs.write(fd, data.toString().replace('${AUTH}', Buffer.from(auth).toString('base64')), err => {
              if (err) {
                reject(err)
              } else {
                const apiHostParse = url.parse(apiHost)
                if (options.direct) {
                  // talk directly to the openwhisk controller
                  apiHostParse.protocol = 'http:'
                  apiHostParse.port = '10001'
                  delete apiHostParse.host
                }

                const theURL = `${url.format(apiHostParse)}api/v1/namespaces/${encodeURIComponent(action.namespace)}/actions/${encodeURIComponent(action.name)}?blocking=true&result=true`
                console.error(path, theURL)

                resolve({
                  script: path, cleanupCallback, url: theURL
                })
              }
            })
          })).catch(reject)
        }
      })
    }
  })
})

/**
 * User has requested to test some random URL
 *
 */
export const generateScriptForURL = ({ method = 'GET' }) => () => new Promise((resolve, reject) => {
  debug('generateScriptForURL', method)

  /*
    wrk.method = "POST"
    wrk.body   = '{ "name": "nick" }'
    wrk.headers["Content-Type"] = "application/json"
  */
  tmp.file((err, path, fd, cleanupCallback) => {
    if (err) {
      reject(err)
    } else {
      fs.writeSync(fd, `wrk.method = "${method}"\n`)
      fs.writeSync(fd, 'wrk.body   = \'{ "name": "nick" }\'\n')
      fs.writeSync(fd, 'wrk.headers["Content-Type"] = "application/json"\n')
      resolve({ script: path, cleanupCallback })
    }
  })
})

/**
 * Command handler to generate a lua script to run load against a given action
 *
 */
export const script = async ({ argvNoOptions: argv, parsedOptions: options }: IEvaluatorArgs) => {
  const namespace = await import('@kui-shell/plugin-openwhisk/lib/models/namespace')

  const rootDir = path.join(__dirname, '..')
  const nameFull = argv[argv.indexOf('script') + 1]
  const nameSplit = nameFull.split(/\//)
  const ns = nameSplit.length > 2 ? nameSplit[1] : namespace.current()
  const name = nameSplit[nameSplit.length - 1]
  const action = { namespace: ns, name }

  let cliOptions = ''

  const addOption = option => {
    if (options[option]) {
      cliOptions += ` --${option} ${options[option]}`
    }
  }

  addOption('duration')
  addOption('threads')
  addOption('timeout')
  addOption('connections')

  return generateScriptForAction({ options })(action)
    .then(({ url, script }) => `${rootDir.replace(/ /g, '\\ ')}/wrk/wrk -s '${script}' '${url}'${cliOptions}`)
    .then(require('electron').clipboard.writeText)
    .then(() => 'Command copied to clipboard')
}
