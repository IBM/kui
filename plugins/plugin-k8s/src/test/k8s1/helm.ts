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

import * as common from '@kui-shell/core/tests/lib/common'
import { cli, selectors } from '@kui-shell/core/tests/lib/ui'
import * as assert from 'assert'

import { createNS, allocateNS, deleteNS } from '@kui-shell/plugin-k8s/tests/lib/k8s/utils'

describe('helm commands', function(this: common.ISuite) {
  before(common.before(this))
  after(common.after(this))

  const ns: string = createNS()
  const inNamespace = `--namespace ${ns}`
  const name = `test-release-${ns}`

  allocateNS(this, ns)

  const lists = ['list', 'ls']

  lists.forEach(list => {
    it(`should list empty releases via helm ${list}`, () => {
      return cli
        .do(`helm ${list} ${inNamespace}`, this.app)
        .then(cli.expectBlank)
        .catch(common.oops(this))
    })
  })

  it(`should create sample helm chart`, () => {
    return cli
      .do(`helm install --name ${name} stable/mysql ${inNamespace}`, this.app)
      .then(async res => {
        await cli.expectOKWithAny(res)

        const table = await this.app.client.getText(`${selectors.OUTPUT_N(res.count)} .result-table-title`)
        assert.strict.equal(table.length, 6)

        const text = await this.app.client.getText(`${selectors.OUTPUT_N(res.count)} .streaming-output`)
        assert.ok(Array.isArray(text), 'expect more than one section of streaming output')
        if (Array.isArray(text)) {
          assert.ok(text.find(x => x && x.includes('NOTES:')), 'expect a NOTES section of streaming output')
          assert.ok(
            text.find(x => x && x.includes('LAST DEPLOYED:')),
            'expect a LAST DEPLOYED section of streaming output'
          )
        }
      })
      .catch(common.oops(this))
  })

  it(`should list that new release via helm list`, () => {
    return cli
      .do(`helm list ${inNamespace}`, this.app)
      .then(cli.expectOKWith(name))
      .catch(common.oops(this))
  })

  it(`should delete sample helm chart`, () => {
    return cli
      .do(`helm delete --purge ${name}`, this.app)
      .then(cli.expectOKWithString(`release "${name}" deleted`))
      .catch(common.oops(this))
  })

  it(`should list empty releases via helm list again`, () => {
    return cli
      .do(`helm list ${inNamespace}`, this.app)
      .then(cli.expectBlank)
      .catch(common.oops(this))
  })

  deleteNS(this, ns)
})
