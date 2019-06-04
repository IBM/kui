/*
 * Copyright 2018 IBM Corporation
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

import { IExecOptions, DefaultExecOptions } from '@kui-shell/core/models/execOptions'
const debug = require('debug')('k8s/util/retry')

import repl = require('@kui-shell/core/core/repl')

export const withRetryOnCode = (code: number) => (fn, cmd: string) => new Promise((resolve, reject) => {
  const iter = async () => {
    try {
      resolve(await fn())

    } catch (err) {
      if (err.code === code) {
        debug('retrying', cmd)
        setTimeout(iter, 5000)
      } else {
        debug('rejecting', err.code, err)
        reject(err)
      }
    }
  }

  iter()
})

export const withRetryOn404 = withRetryOnCode(404)

/**
 * Swallow 404s
 *
 */
export const okIf404 = async (command: string, execOptions: IExecOptions = new DefaultExecOptions()) => {
  try {
    await repl.qexec(command, undefined, undefined, execOptions)
  } catch (err) {
    if (err.code === 404) {
      // no worries!
    } else {
      debug('not okIf404', err.code, err)
      throw err
    }
  }
}
