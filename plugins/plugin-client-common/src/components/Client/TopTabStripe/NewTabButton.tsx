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

import * as React from 'react'
import { i18n } from '@kui-shell/core'

import Icons from '../../spi/Icons'

const strings = i18n('plugin-client-common')

interface Props {
  onNewTab: () => void
}

export default class NewTabButton extends React.PureComponent<Props> {
  public render() {
    return (
      <a
        href="#"
        className="kui--tab-navigatable kui--top-tab-button kui-new-tab"
        id="new-tab-button"
        aria-label="Open a new tab"
        tabIndex={0}
        title={strings('New Tab')}
        onClick={() => this.props.onNewTab()}
      >
        <Icons icon="Add" className="kui-new-tab__plus" />
      </a>
    )
  }
}
