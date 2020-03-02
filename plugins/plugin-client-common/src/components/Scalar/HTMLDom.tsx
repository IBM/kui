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

interface Props {
  content: Node | Node[]
  className?: string
}

interface State {
  isRendered: boolean
  dom: HTMLDivElement
}

/** for html pre-rendered dom content */
export default class HTMLDom extends React.PureComponent<Props> {
  public constructor(props: Props) {
    super(props)

    this.state = {
      isRendered: false,
      dom: undefined
    }
  }

  public static getDerivedStateFromProps(props: Props, state: State) {
    if (state.dom && !state.isRendered) {
      if (Array.isArray(props.content)) {
        props.content.forEach(_ => state.dom.appendChild(_))
      } else {
        state.dom.appendChild(props.content)
      }
      return {
        isRendered: true
      }
    } else {
      return state
    }
  }

  public render() {
    return (
      <div
        className={
          'padding-content scrollable scrollable-auto page-content' +
          (this.props.className ? ` ${this.props.className}` : '')
        }
        style={{ display: 'flex', flex: 1 }}
      >
        <div style={{ display: 'flex', flex: 1 }} ref={dom => this.setState({ dom })} />
      </div>
    )
  }
}
