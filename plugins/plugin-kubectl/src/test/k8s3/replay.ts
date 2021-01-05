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

import { Common, CLI, ReplExpect, Selectors, Util } from '@kui-shell/test'
import {
  defaultModeForGet,
  openSidecarByList,
  waitForGreen,
  waitForRed,
  createNS,
  allocateNS,
  deleteNS
} from '@kui-shell/plugin-kubectl/tests/lib/k8s/utils'

describe(`kubectl replay ${process.env.MOCHA_RUN_TARGET || ''}`, function(this: Common.ISuite) {
  before(Common.before(this))
  after(Common.after(this))

  const ns: string = createNS()
  const inNamespace = `-n ${ns}`
  const file = Util.uniqueFileForSnapshot()

  allocateNS(this, ns, 'kubectl')

  it(`should create, get and delete the sample pod from URL via kubectl, and replay`, async () => {
    // here comes the tests
    try {
      console.error('creating')
      await openSidecarByList(
        this,
        `kubectl create -f https://raw.githubusercontent.com/kubernetes/examples/master/staging/pod ${inNamespace}`,
        'nginx'
      )

      console.error('deleting')
      const deleteRes = await CLI.command(
        `kubectl delete -f https://raw.githubusercontent.com/kubernetes/examples/master/staging/pod ${inNamespace}`,
        this.app
      )

      const deleteSelector = await ReplExpect.okWithCustom<string>({ selector: Selectors.BY_NAME('nginx') })(deleteRes)
      await waitForRed(this.app, deleteSelector)

      console.error('snapshoting')
      await CLI.command(`snapshot ${file}`, this.app).then(ReplExpect.justOK)

      console.error('replaying')
      await Common.refresh(this)

      await CLI.command(`replay ${file}`, this.app)

      await waitForRed(this.app, `${Selectors.OUTPUT_LAST} ${Selectors.BY_NAME('nginx')}`)
    } catch (err) {
      await Common.oops(this, true)(err)
    }
  })

  deleteNS(this, ns, 'kubectl')
})

describe(`kubectl replay with re-execution ${process.env.MOCHA_RUN_TARGET || ''}`, async function(this: Common.ISuite) {
  before(Common.before(this))
  after(Common.after(this))

  const ns: string = createNS()
  const inNamespace = `-n ${ns}`
  const file = Util.uniqueFileForSnapshot()

  allocateNS(this, ns, 'kubectl')

  it('should replay a kubectl get pods table with re-execution ', async () => {
    try {
      const selector = await CLI.command(
        `kubectl create -f https://raw.githubusercontent.com/kubernetes/examples/master/staging/pod ${inNamespace}`,
        this.app
      ).then(
        ReplExpect.okWithCustom<string>({ selector: Selectors.BY_NAME('nginx') })
      )

      await waitForGreen(this.app, selector)

      await CLI.command(`snapshot ${file} --exec`, this.app).then(ReplExpect.justOK)

      await CLI.command(`replay ${file}`, this.app)

      await this.app.client.waitUntil(
        async () => {
          const errorMessage = await this.app.client
            .$(`${Selectors.OUTPUT_LAST}.oops[data-status-code="409"]`)
            .then(_ => _.getText())
          return errorMessage.includes('pods "nginx"')
        },
        { timeout: CLI.waitTimeout }
      )
    } catch (err) {
      await Common.oops(this, true)(err)
    }
  })

  deleteNS(this, ns, 'kubectl')
})

describe(`kubectl replay with clicks ${process.env.MOCHA_RUN_TARGET || ''}`, async function(this: Common.ISuite) {
  before(Common.before(this))
  after(Common.after(this))

  const ns: string = createNS()
  const inNamespace = `-n ${ns}`
  const file = Util.uniqueFileForSnapshot()

  allocateNS(this, ns, 'kubectl')

  it(`should replay a kubectl get pods table with re-execution using snapshot file ${file}`, async () => {
    try {
      const res = await CLI.command(
        `kubectl create -f https://raw.githubusercontent.com/kubernetes/examples/master/staging/pod ${inNamespace}`,
        this.app
      )

      const selector = await ReplExpect.okWithCustom<string>({ selector: Selectors.BY_NAME('nginx') })(res)

      await waitForGreen(this.app, selector)

      await CLI.command(`snapshot ${file}`, this.app).then(ReplExpect.justOK)

      await CLI.command(`replay ${file}`, this.app)

      await this.app.client.$(`${Selectors.OUTPUT_LAST} ${Selectors.BY_NAME('nginx')}`).then(_ => _.waitForDisplayed())
      await Util.openSidecarByClick(
        this,
        `${Selectors.OUTPUT_LAST} ${Selectors.BY_NAME('nginx')} .clickable`,
        'nginx',
        defaultModeForGet
      )
    } catch (err) {
      await Common.oops(this, true)(err)
    }
  })

  deleteNS(this, ns, 'kubectl')
})
