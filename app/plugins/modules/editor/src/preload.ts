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

import * as Debug from 'debug'
const debug = Debug('plugins/editor/preload')
debug('loading')

import { inBrowser, isHeadless } from '../../../../build/core/capabilities'
import { PluginRequire, PreloadRegistration } from '../../../../build/models/plugin'

import { addActionMode } from '../../openwhisk/plugin/lib/models/modes'

debug('done loading prereqs')

/**
 * A preloaded plugin that enhances the view modes for actions
 *
 */
const registration: PreloadRegistration = async (commandTree, prequire: PluginRequire) => {
  debug('initializing')

  // prefetch editor; it's kinda pokey
  if (inBrowser()) {
    // note: no await; we're just prefetching it
    prequire('editor')
  }

  if (!isHeadless()) {
    const { lockIcon, edit } = require('./lib/readonly')
    const { currentSelection } = require('../../../../build/webapp/views/sidecar')
    const getAction = currentSelection

    addActionMode(lockIcon({
      getAction,
      mode: 'unlock',
      icon: 'fas fa-lock',
      tooltip: 'You are in read-only mode.\u000aClick to edit.', // TODO externalize string
      direct: edit({ getAction })
    }), 'unshift')
  }
}

export default registration

debug('finished loading')
