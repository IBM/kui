/*
 * Copyright 2019 IBM Corporation
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

import { Tab } from '@kui-shell/core/webapp/cli'
import { EntitySpec } from '@kui-shell/core/models/entity'
import { currentSelection as baseSelection } from '@kui-shell/core/webapp/views/sidecar'

export interface OpenWhiskEntity extends EntitySpec {
  namespace: string
  exec?: {
    kind: string
    code?: string
    binary?: boolean
  }
}

export function currentSelection (tab: Tab) {
  return baseSelection(tab) as OpenWhiskEntity
}

export interface ActivationResponse {
  success: boolean
  // eslint-disable-next-line @typescript-eslint/ban-types
  result: Object
}

export interface Activation {
  entity?: EntitySpec
  activationId: string
  response: ActivationResponse
}

export function isActivationSpec (response: Activation | EntitySpec): response is Activation {
  const activation = response as Activation
  return activation.response !== undefined && activation.activationId !== undefined
}

export function isAsyncActivationSpec (response: Activation | EntitySpec): response is Activation {
  const activation = response as Activation
  return activation.response === undefined && activation.activationId !== undefined
}
