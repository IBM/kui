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

import { isHeadless } from '@kui-shell/core/core/capabilities'
import { ITab, ViewHandler, registerListView, registerEntityView as registerCLIEntityView } from '@kui-shell/core/webapp/cli'
import { ISidecarViewHandler, registerEntityView as registerSidecarEntityView } from '@kui-shell/core/webapp/views/sidecar'
import { IShowOptions } from '@kui-shell/core/webapp/views/show-options'
import { Entity } from '@kui-shell/core/models/entity'

export default () => {
  if (!isHeadless()) {
    registerCLIEntityView('activations', async (tab: ITab, response: Entity, resultDom: Element, parsedOptions: Object, execOptions: Object) => {
      const showActivation = (await import('./lib/views/cli/activations/entity')).default as ViewHandler
      return showActivation(tab, response, resultDom, parsedOptions, execOptions)
    })

    const doShow = async (tab: ITab, entity: Object, sidecar: Element, options: IShowOptions) => {
      const { showEntity } = (await import('./lib/views/sidecar/entity'))
      return showEntity(tab, entity, sidecar, options)
    }
    registerSidecarEntityView('actions', doShow)
    registerSidecarEntityView('activations', doShow)
    registerSidecarEntityView('packages', doShow)
    registerSidecarEntityView('rules', doShow)
    registerSidecarEntityView('triggers', doShow)
  }
}
