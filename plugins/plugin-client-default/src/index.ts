/*
 * Copyright 2020 IBM Corporation
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

/**
 * Here we arrange the CSS for base functionality of Kui. Order is
 * preserved in the resulting <link> tags.
 *
 */
import '../web/css/static/carbon-overrides.css'
import '../web/css/static/kui-ui.css'
import '@kui-shell/plugin-client-common'

import { render as ReactDomRender } from 'react-dom'
import renderBody from './Body'

/**
 * Format the body view
 *
 */
export function render() {
  // Note: the wrapper is needed to get React events to work; it seems
  // not to work with a DocumentFragment
  const wrapper = document.createElement('div') // <-- temporarily wrap for React
  ReactDomRender(renderBody(), wrapper)

  const content = document.createDocumentFragment()
  content.appendChild(wrapper.firstElementChild) // <-- then unwrap
  return content
}
