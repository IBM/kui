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

import { dirname, join } from 'path'
import { exec } from 'child_process'

import { inBrowser } from '@kui-shell/core/core/capabilities'
import { injectCSS as inject } from '@kui-shell/core/webapp/util/inject'

/**
 * Load the CSS for diff2html
 *
 */
export const injectCSS = async () => {
  if (inBrowser()) {
    await Promise.all([
      inject({
        css: require('diff2html/dist/diff2html.min.css'),
        key: 'diff2html.css'
      }),
      inject({
        css: require('@kui-shell/plugin-bash-like/web/css/my-diff2html.css'),
        key: 'mydiff2html.css'
      })
    ])
  } else {
    const root = dirname(require.resolve('diff2html/package.json'))
    const ourRoot = dirname(
      require.resolve('@kui-shell/plugin-bash-like/package.json')
    )
    await Promise.all([
      inject(join(root, 'dist/diff2html.min.css')),
      inject(join(ourRoot, 'web/css/my-diff2html.css'))
    ])
  }
}

/**
 * @return the current branch
 *
 */
export const branch = (): Promise<string> =>
  new Promise((resolve, reject) => {
    exec('git rev-parse --abbrev-ref HEAD', (err, branch, stderr) => {
      if (err) {
        console.error(stderr)
        reject(err)
      } else {
        resolve(branch.trim())
      }
    })
  })

/**
 * @return "On branch <branch>"
 *
 */
export const onbranch = (): Promise<Element> => {
  const currentBranch = branch()

  return new Promise<Element>(async resolve => {
    const span = document.createElement('span')
    span.appendChild(document.createTextNode('On branch '))

    const strong = document.createElement('strong')
    strong.innerText = await currentBranch
    span.appendChild(strong)

    resolve(span)
  })
}
