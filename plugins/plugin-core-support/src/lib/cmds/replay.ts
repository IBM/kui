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

import { eventBus, Snapshot, SnapshotSplit, Registrar, UsageModel } from '@kui-shell/core'

/**
 * Schema for a serialized snapshot of the Inputs and Outputs of
 * command executions.
 */
interface SerializedSnapshot {
  apiVersion: 'kui-shell/v1'
  kind: 'Snapshot'
  spec: Snapshot
}

/** @return wether or not the given `raw` json is an instance of SerializedSnapshot */
function isSerializedSnapshot(raw: Record<string, any>): raw is SerializedSnapshot {
  const model = raw as SerializedSnapshot
  return model.apiVersion === 'kui-shell/v1' && model.kind === 'Snapshot' && Array.isArray(model.spec.windows)
}

/** For the Kui command registration: enforce one mandatory positional parameter */
function usage(cmd: string): { usage: UsageModel } {
  return { usage: { strict: cmd, required: [{ name: '<filepath>', docs: 'path to saved snapshot' }] } }
}

let nSnapshotable = 0
export function preload() {
  eventBus.onAddSnapshotable(() => nSnapshotable++)
  eventBus.onRemoveSnapshotable(() => nSnapshotable--)
}

/** Command registration */
export default function(registrar: Registrar) {
  // register the `replay` command
  registrar.listen(
    '/replay',
    async ({ argvNoOptions, REPL, tab }) => {
      const filepath = argvNoOptions[argvNoOptions.indexOf('replay') + 1]
      const model = JSON.parse(
        (await REPL.rexec<{ data: string }>(`fstat ${REPL.encodeComponent(filepath)} --with-data`)).content.data
      )

      if (!isSerializedSnapshot(model)) {
        console.error('invalid snapshot', model)
        throw new Error('Invalid snapshot')
      } else {
        // TODO only replaying the first split
        model.spec.windows[0].tabs[0].splits[0].blocks.forEach(({ startEvent, completeEvent }) => {
          eventBus.emitCommandStart(Object.assign(startEvent, { tab }))
          eventBus.emitCommandComplete(Object.assign(completeEvent, { tab }))
        })

        return true
      }
    },
    usage('replay')
  )

  // register the `snapshot` command
  registrar.listen(
    '/snapshot',
    ({ argvNoOptions, REPL }) =>
      new Promise((resolve, reject) => {
        const splits: SnapshotSplit[] = []

        eventBus.emitSnapshotRequest(async (split: SnapshotSplit) => {
          splits.push(split)
          console.error('!!!!', splits.length, nSnapshotable)

          if (splits.length === nSnapshotable) {
            try {
              const filepath = argvNoOptions[argvNoOptions.indexOf('snapshot') + 1]
              const snapshot: SerializedSnapshot = {
                apiVersion: 'kui-shell/v1',
                kind: 'Snapshot',
                spec: {
                  windows: [
                    {
                      uuid: '0',
                      tabs: [
                        {
                          uuid: '0',
                          splits
                        }
                      ]
                    }
                  ]
                }
              }
              const data = JSON.stringify(snapshot)
              await REPL.rexec<{ data: string }>(`fwrite ${REPL.encodeComponent(filepath)}`, { data })

              resolve(true)
            } catch (err) {
              reject(err)
            }
          }
        })
      }),
    usage('snapshot')
  )
}
