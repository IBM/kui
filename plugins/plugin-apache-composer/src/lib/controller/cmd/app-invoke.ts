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

import { invoke, async } from '../../utility/usage'
import * as repl from '@kui-shell/core/core/repl'
import { CommandRegistrar } from '@kui-shell/core/models/command'

import * as view from '../../view/entity-view'

export default async (commandTree: CommandRegistrar) => {
  /* command handler for app invoke */
  commandTree.listen(
    `/wsk/app/invoke`,
    ({ command, parsedOptions: options }) => {
      return repl.qfexec(command.replace('app', 'action')).then(result => view.formatCompositionResult(result, options))
    },
    { usage: invoke }
  )

  /* command handler for app async */
  commandTree.listen(
    `/wsk/app/async`,
    ({ command }) => {
      return repl.qfexec(command.replace('app', 'action')) // asynchronous composition invocation is the same with asynchronous action invocation
    },
    { usage: async }
  )
}
