/*
 * Copyright 2017-2018 IBM Corporation
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
 * Maybe add a header row for tables. If this is a nested call,
 * i.e. some other plugin is calling us for the data rather than the
 * model, make sure not to add a header --- unless that other plugin
 * actually wants us to add the header (showHeader).
 *
 */
export default (rows, execOptions) => {
  if (
    rows.length === 0 ||
    (!execOptions.showHeader &&
      (execOptions.nested || rows[0].type === 'activations'))
  ) {
    return rows
  } else {
    const cell = (value, outerCSS = '') => [
      { value, outerCSS: `header-cell ${outerCSS}` }
    ]
    const maybeCell = (field: string, value: string, outerCSS?: string) =>
      rows[0][field] ? cell(value, outerCSS) : []

    const type = rows[0].type
    const kind =
      type === 'actions' ? maybeCell('type', 'KIND', 'entity-kind') : []
    const active = type === 'rules' ? cell('STATUS') : []
    const version =
      type === 'rules'
        ? cell('RULE', 'hide-with-sidecar')
        : maybeCell('version', 'VERSION', 'hide-with-sidecar')

    return [
      [
        {
          title: rows[0].prettyType || type,
          type,
          name: 'NAME',
          noSort: true,
          onclick: false,
          header: true,
          outerCSS: 'header-cell',
          annotations: [],
          attributes: kind.concat(active).concat(version)
        }
      ].concat(rows)
    ]
  }
}
