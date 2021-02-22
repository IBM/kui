/*
 * Copyright 2019 The Kubernetes Authors
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

import { Arguments, Registrar, SymbolTable, eventBus } from '@kui-shell/core'

/**
 * export command
 *
 */
const exportCommand = ({ tab, parsedOptions }: Arguments) => {
  const curDic = SymbolTable.read(tab)

  const toBeParsed = parsedOptions._[1]
  const arr = toBeParsed.split('=')
  const key = arr[0]
  const value = arr[1]

  curDic[key] = value

  SymbolTable.write(tab, curDic)
  eventBus.emitEnvUpdate(key, value)

  return true
}

const usage = {
  command: 'export',
  strict: 'export',
  docs: 'Export a variable or function to the environment of all the child processes running in the current shell',
  required: [{ name: 'key=value', docs: 'an assignment of key to value' }]
}

/**
 * Register command handlers
 *
 */
export default (commandTree: Registrar) => {
  commandTree.listen('/export', exportCommand, { usage })
}
