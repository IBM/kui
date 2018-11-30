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

import * as path from 'path'
import { actions, activations, skipAndLimit } from '../../../../openwhisk/plugin/lib/cmds/openwhisk-usage'
// import * as sampleInputs from './sample-inputs'

const activationsUsage = {
      get: activations('').available.find(({command}) => command === 'get')
}
const actionsUsage = {
    create: actions.available.find(({command}) => command === 'create'),
    update: actions.available.find(({command}) => command === 'update'),
    invoke: actions.available.find(({command}) => command === 'invoke')
}

const strings = {
    create: 'Use this command to create a new composition from a given source file.',
    update: 'Use this command to update an existing composition.',
    session_get: `Display the full details of a session`,
    session_result: `Display the return value of a session. (Hint: use session get to see the full details)`
}

/**
 * Usage message for app create
 *
 */
export const create = command => ({
    strict: command,
    command,
    title: 'Deploy composition',
    header: strings[command],
    example: `app ${command} <name> <sourceFile>`,
    required: [{ name: 'name', docs: 'the name of your new app', implicitOK: ['actions', 'preview'] },
               { name: 'sourceFile', docs: 'source file or pre-compiled composition', file: true, notNeededIfImplicit: true }],
    optional: actionsUsage[command].optional.concat([
        { name: '--recursive', alias: '-r', boolean: true, docs: 'also deploy any referenced actions' },
        /*{ name: '--dry-run', consumesPositional: 1, alias: '-n', boolean: true, advanced: true, docs: 'only check the given input for validity' },
        { name: '--log-input', boolean: true, advanced: true, docs: 'log initial input' },
        { name: '--log-inline', boolean: true, advanced: true, docs: 'log inline function output' },
        { name: '--log-all', boolean: true, advanced: true, docs: 'log initial input and inline function output' }*/]),
    // sampleInputs: sampleInputs(sampleName => `app ${command} -r ${sampleName}`), TODO
    parents: ['composer', { command: 'composer app' }],
    related: ['app get', 'app invoke', 'app list']
})

/**
 * Usage message for app invoke
 *
 */
export const invoke = {
    command: 'invoke',
    strict: 'invoke',
    title: 'Invoke composition',
    header: 'Invoke a given app and wait for its completion',
    example: 'app invoke <name> [-p key value]*',
    required: [{ name: 'name', docs: 'a deployed composition', entity: 'action', implicitOK: ['actions', 'activations'] }],
    optional: actionsUsage.invoke.optional,
    parents: ['composer', { command: 'composer app' }],
    related: ['app async', 'app create', 'app get', 'app list']
}

/**
 * Usage message for app async
 *
 */
export const async = {
    strict: 'async',
    title: 'Async an OpenWhisk composition',
    header: 'Invoke a given app asynchronously, and return a session id',
    example: 'app async <name> [-p key value]*',
    required: [{ name: 'name', docs: 'the name of your new app' }],
    optional: actionsUsage.invoke.optional,
    related: ['app create', 'app get', 'app invoke', 'app list']
}

/**
 * Usage message for app get
 *
 */

/**
 * Usage message for app get
 *
 */
export const app_get = command => ({
    strict: command,
    command,
    title: 'Show composition',
    header: 'Displays the details of a given composition',
    example: `app ${command} <appName>`,
    required: [{ name: 'appName', docs: 'the name of your composition', entity: 'action' }],
    optional: [{ name: '--cli', boolean: true, docs: 'display the results textually (headless mode only)' },
               { name: '--functions', alias: '-f', boolean: true, docs: 'show all functions directly in the view' }
              ],
    parents: ['composer', { command: 'composer app' }],
    related: ['app create', 'app invoke', 'app list']
})

/**
 * Usage message for app list
 *
 */
 export const app_list = command => ({
   strict: command,
   command,
   title: 'List compositions',
   header: 'Print a list of deployed compositions',
   example: `app ${command}`,
   optional: [{ name: 'namespace|package',
     positional: true,
     entity: 'package',
     docs: 'list all actions in a given /namespace or package' }].concat(skipAndLimit),
   parents: ['composer', { command: 'composer app' }],
   related: ['app create', 'app get', 'app invoke']
 })

/**
 * Usage message for session get
 *
 */
const related = {
    get: ['session list', 'session result'],
    result: ['session list', 'session get']
}
export const session_get = command => ({
    strict: command,
    command,
    title: 'Show composer session',
    header: strings[`session_${command}`],
    example: `session ${command} <sessionId>`,
    oneof: [{ name: 'sessionId', docs: 'show a specific session id' },
            { name: '--last', example: '[appName]', booleanOK: true, docs: 'show the last session [of the given app]' },
            { name: '--last-failed', example: '[appName]', booleanOK: true, docs: 'ibid, except show the last failed session' }],
    optional: activationsUsage.get.optional,
    parents: ['composer', { command: 'composer session' }],
    related: related[command]
})

/**
 * Usage message for session list
 *
 */
export const session_list =  {
  title: 'List Recent Sessions',
  header: 'Returns a list of recent composition activations (a.k.a. "sessions").',
  example: 'session list',
  optional: [{ name: '--name', docs: 'filter to show only a given named composition' },
    { name: '--limit', docs: 'show at most N sessions' },
    { name: '--skip', docs: 'skip over the most recent N sessions' }],
  parents: ['composer', { command: 'composer session' }],
  related: ['grid', 'summary']
}
/**
 * Usage string for app preview
 *
 */
export const preview = command => ({
    command,
    strict: command,
    title: 'Preview composition',
    header: 'Visualize a composition, without deploying it.',
    example: `${command} <sourceFile>`,
    detailedExample: {
        command: `${command} @demos/hello.js`,
        docs: 'preview a built-in hello world demo'
    },
    oneof: [{ name: 'src.js', docs: 'generate a preview of a Composer source file', file: true },
            { name: 'src.json', docs: 'ibid, but for a pre-compiled composition', file: true }],
    optional: [{ name: '--fsm', boolean: true, docs: 'validate and show raw FSM' },
               { name: '--functions', alias: '-f', boolean: true, docs: 'show all functions directly in the view' },
               { name: '--env', alias: '-e', docs: 'Assign a value to an environment variable', narg: 2 }],
    // sampleInputs: sampleInputs(command), TODO
    parents: ['composer', { command: 'composer app' }],
    related: ['app create']
})

/**
 * Usage message for app delete
 *
 */
export const app_delete = {
  command: 'delete',
  docs: 'delete a given composition',
  strict: 'delete',
  example: 'app delete <composition>',
  required: [{ name: 'name', docs: 'a deployed composition', entity: 'action'}],
  parents: ['composer', { command: 'composer app' }]
}

/**
 * Usage message for app config/props/properties
 *
 */
export const properties = cmd => ({
  title: 'Composer Configuration',
  header: 'Print out the details of your configuration',
  example: `app ${cmd}`
})
