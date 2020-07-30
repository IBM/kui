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

/**
 * This file tests "test table" command that expects a table response
 *
 * See the command implementation in: plugin-test/src/lib/cmds/table.ts
 *
 */

import * as assert from 'assert'
import { TestTable } from '@kui-shell/test'
import { firstSeen } from '../../lib/cmds/content/table-with-drilldown'

const expectHeaderText = { name: 'NAME', attributes: [{ value: 'FOO' }, { value: firstSeen.toUpperCase() }] }

const firstCol = ['TestString', 'TestTable', 'TestMMRName', 'TestMMRModeSilence']
const expectRow = [
  { name: firstCol[0], onclick: `test string`, attributes: [{ value: 'foo' }, { value: '5' }] },
  { name: firstCol[1], onclick: `test table`, attributes: [{ value: 'foo' }, { value: '5' }] },
  { name: firstCol[2], onclick: `test mmr name`, attributes: [{ value: 'foo' }, { value: '5' }] },
  {
    name: firstCol[3],
    onclick: `test mmr mode`,
    onclickSilence: true,
    attributes: [{ value: 'foo' }, { value: '5' }]
  }
]

/** test table, validate its cells and drilldown from the rows */
new TestTable('should test table with dilldown', {
  exec: {
    command: 'test table',
    expectTable: {
      header: expectHeaderText,
      body: expectRow
    },
    validation: {
      hasGridButton: true,
      cells: [
        (value: string, rowIdx: number) => {
          assert.strictEqual(value, firstCol[rowIdx])
        },
        (value: string) => {
          assert.strictEqual(value, expectRow[0].attributes[0].value)
        },
        (value: string) => {
          assert.strictEqual(value, expectRow[0].attributes[1].value)
        }
      ]
    }
  },
  drilldown: {
    expectTable: {
      header: expectHeaderText,
      body: expectRow
    }
  }
}).run()

/** test duration table */
new TestTable('should test duration table', {
  exec: {
    command: 'test durationTable',
    expectTable: {
      header: { name: 'Name', attributes: [{ value: 'Foo' }, { value: 'Duration' }] },
      body: [
        { name: 'test 1', attributes: [{ value: 'foo' }, { value: '1s' }] },
        { name: 'test 2', attributes: [{ value: 'foo' }, { value: '2s' }] },
        { name: 'test 3', attributes: [{ value: 'foo' }, { value: '3s' }] },
        { name: 'test 4', attributes: [{ value: 'foo' }, { value: '4s' }] },
        { name: 'test 5', attributes: [{ value: 'foo' }, { value: '5s' }] },
        { name: 'test 6', attributes: [{ value: 'foo' }, { value: '6s' }] },
        { name: 'test 7', attributes: [{ value: 'foo' }, { value: '7s' }] },
        { name: 'test 8', attributes: [{ value: 'foo' }, { value: '8s' }] },
        { name: 'test 9', attributes: [{ value: 'foo' }, { value: '9s' }] },
        { name: 'test 10', attributes: [{ value: 'foo' }, { value: '10s' }] },
        { name: 'test 11', attributes: [{ value: 'foo' }, { value: '11s' }] },
        { name: 'test 12', attributes: [{ value: 'foo' }, { value: '12s' }] },
        { name: 'test 13', attributes: [{ value: 'foo' }, { value: '13s' }] },
        { name: 'test 14', attributes: [{ value: 'foo' }, { value: '14s' }] },
        { name: 'test 15', attributes: [{ value: 'foo' }, { value: '15s' }] },
        { name: 'test 16', attributes: [{ value: 'foo' }, { value: '16s' }] },
        { name: 'test 17', attributes: [{ value: 'foo' }, { value: '17s' }] },
        { name: 'test 18', attributes: [{ value: 'foo' }, { value: '18s' }] },
        { name: 'test 19', attributes: [{ value: 'foo' }, { value: '19s' }] },
        { name: 'test 20', attributes: [{ value: 'foo' }, { value: '20s' }] },
        { name: 'test 21', attributes: [{ value: 'foo' }, { value: '21s' }] }
      ]
    },
    validation: {
      hasGridButton: true,
      asGrid: true,
      switchToList: true,
      cells: [
        (value: string, rowIdx: number) => {
          assert.strictEqual(value, `test ${rowIdx + 1}`)
        },
        (value: string) => {
          assert.strictEqual(value, 'foo')
        },
        (value: string, rowIdx: number) => {
          assert.strictEqual(value, `${rowIdx + 1}s`)
        }
      ]
    }
  }
}).run()

/** test table with push watcher, and the final status badge and message are correct */
new TestTable('should test table with status and pusher', {
  status: {
    statusDescription: 'should create a new row',
    command: 'test table --watch=push --sequence=createRow1',
    expectRow: [
      { name: 'foo1', badgeCss: 'green-background', badgeText: 'Running', message: 'should create a new row' }
    ]
  }
}).run()

/** test table with push watcher, and the final status badge and message are correct */
new TestTable('should test table with status and pusher', {
  status: {
    statusDescription: 'should terminate the row',
    command: 'test table --watch=push --sequence=terminateRow1',
    expectRow: [
      { name: 'foo1', badgeCss: 'yellow-background', badgeText: 'Terminating', message: 'should terminate the row' }
    ]
  }
}).run()

/** test table with push watcher, and the final status badge and message are correct */
new TestTable('should test table with status and pusher', {
  status: {
    statusDescription: 'should delete the row',
    command: 'test table --watch=push --sequence=deleteRow1',
    expectRow: [{ name: 'foo1', badgeCss: 'red-background', badgeText: 'Offline', message: 'should terminate the row' }]
  }
}).run()

/** test table with push watcher, and the final status badge and message are correct */
new TestTable('should test table with status and pusher', {
  status: {
    statusDescription: 'should delete the row',
    command: 'test table --watch=push --sequence=deleteRow1',
    expectRow: [{ name: 'foo1', badgeCss: 'red-background', badgeText: 'Offline', message: 'should terminate the row' }]
  }
}).run()

/** test table with push watcher, and the final status badge and message are correct */
new TestTable('should test table with status and pusher', {
  status: {
    statusDescription: 'should activate the deleted row',
    command: 'test table --watch=push --sequence=activateRow1',
    expectRow: [
      { name: 'foo1', badgeCss: 'green-background', badgeText: 'Running', message: 'should activate the deleted row' }
    ]
  }
}).run()

/** test table with push watcher, and the final status badge and message are correct */
new TestTable('should test table with status and pusher', {
  status: {
    statusDescription: 'should terminate the row again',
    command: 'test table --watch=push --sequence=terminateRow1Again',
    expectRow: [
      {
        name: 'foo1',
        badgeCss: 'yellow-background',
        badgeText: 'Terminating',
        message: 'should terminate the row again'
      }
    ]
  }
}).run()

/** test table with push watcher, and the final status badge and message are correct */
new TestTable('should test table with status and pusher', {
  status: {
    statusDescription: 'should delete the row again',
    command: 'test table --watch=push --sequence=deleteRow1Again',
    expectRow: [
      { name: 'foo1', badgeCss: 'red-background', badgeText: 'Offline', message: 'should terminate the row again' }
    ]
  }
}).run()

/** test table with push watcher, and the final status badge and message are correct */
new TestTable('should test table with status and pusher', {
  status: {
    statusDescription: 'should create the second row',
    command: 'test table --watch=push --sequence=createRow2',
    expectRow: [
      { name: 'foo2', badgeCss: 'green-background', badgeText: 'Running', message: 'should create the second row' }
    ]
  }
}).run()

/** test table with push watcher, and the final status badge and message are correct */
new TestTable('should test table with status and pusher', {
  status: {
    statusDescription: 'should activate the first row again',
    command: 'test table --watch=push --sequence=activeRow1Again',
    expectRow: [
      {
        name: 'foo1',
        badgeCss: 'green-background',
        badgeText: 'Running',
        message: 'should activate the first row again'
      }
    ]
  }
}).run()
