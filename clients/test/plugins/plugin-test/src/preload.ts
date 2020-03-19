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

import { CapabilityRegistration, PreloadRegistrar, isHeadless } from '@kui-shell/core'

import {
  mode1,
  mode2,
  mode3,
  mode5,
  drilldownButtonWithString,
  drilldownButtonWithFunction,
  badge1,
  badge2
} from './lib/modes'
import testContext from './lib/status-stripe'

export const registerCapability: CapabilityRegistration = (registrar: PreloadRegistrar) => {
  if (!isHeadless()) {
    // intentionally placing the same widget as both a meter and context
    registrar.registerMeter(testContext(0))
    registrar.registerContext(testContext(1))
  }
}

export default async (registrar: PreloadRegistrar) => {
  if (!isHeadless()) {
    registrar.registerModes(mode1, mode2, mode3, mode5, drilldownButtonWithString, drilldownButtonWithFunction)
    registrar.registerBadges(badge1, badge2)
  }
}
