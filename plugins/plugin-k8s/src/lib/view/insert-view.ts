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

import Presentation from '@kui-shell/core/webapp/views/presentation'
import { removeAllDomChildren } from '@kui-shell/core/webapp/util/dom'
import { Tab } from '@kui-shell/core/models/tab'
import { getActiveView, presentAs } from '@kui-shell/core/webapp/views/sidecar'
const debug = Debug('k8s/view/insert-view')

/**
 * Update the current view into the sidecar; this is helpful for tab
 * mode switching.
 *
 */
export default (tab: Tab) => (view: HTMLElement) => {
  debug('insertView', view)

  const container = getActiveView(tab)
  debug('insertView.container', container)

  removeAllDomChildren(container)
  container.appendChild(view)

  presentAs(tab, Presentation.Default)
}
