/*
 * Copyright 2017 IBM Corporation
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

import * as common from '@kui-shell/core/tests/lib/common'
import * as ui from '@kui-shell/core/tests/lib/ui'
import * as openwhisk from '@kui-shell/plugin-openwhisk/tests/lib/openwhisk/openwhisk'
const { cli, sidecar } = ui

const actionName = 'foo'

describe('Check error handling for invoking a non-existent action', function(this: common.ISuite) {
  before(openwhisk.before(this))
  after(common.after(this))

  it('invoke a non-existent action', () =>
    cli
      .do(`wsk action invoke xxxxxx`, this.app)
      .then(cli.expectError(404))
      .catch(common.oops(this)))

  it('async a non-existent action', () =>
    cli
      .do(`wsk action async xxxxxx`, this.app)
      .then(cli.expectError(404))
      .catch(common.oops(this)))

  it('create an action', () =>
    cli
      .do(`let ${actionName} = x=>x`, this.app)
      .then(cli.expectOK)
      .then(sidecar.expectOpen)
      .then(sidecar.expectShowing(actionName))
      .catch(common.oops(this)))

  it('invoke with a non-existent package, but existing action name', () =>
    cli
      .do(`wsk action invoke xxxxxx/${actionName}`, this.app)
      .then(cli.expectError(404))
      .catch(common.oops(this)))

  it('invoke with a non-existent package, but existing action name, via kui action invoke', () =>
    cli
      .do(`kui action invoke xxxxxx/${actionName}`, this.app)
      .then(cli.expectError(404))
      .catch(common.oops(this)))

  it('invoke with a non-existent package, but existing action name, via wsk action invoke', () =>
    cli
      .do(`wsk action invoke xxxxxx/${actionName}`, this.app)
      .then(cli.expectError(404))
      .catch(common.oops(this)))

  it('async with a non-existent package, but existing action name', () =>
    cli
      .do(`wsk action async xxxxxx/${actionName}`, this.app)
      .then(cli.expectError(404))
      .catch(common.oops(this)))
})
