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

import { Common, CLI, ReplExpect } from '@kui-shell/test'

describe(`echo command ${process.env.MOCHA_RUN_TARGET || ''}`, function(this: Common.ISuite) {
  before(Common.before(this))
  after(Common.after(this))

  Common.pit('should echo nothing variant 1', () =>
    CLI.command('echo', this.app)
      .then(ReplExpect.justOK)
      .catch(Common.oops(this))
  )

  Common.pit('should echo nothing variant 2', () =>
    CLI.command('echo ', this.app)
      .then(ReplExpect.justOK)
      .catch(Common.oops(this))
  )

  Common.pit('should echo nothing variant 3', () =>
    CLI.command('echo                  ', this.app)
      .then(ReplExpect.justOK)
      .catch(Common.oops(this))
  )

  Common.pit('should echo hi', () =>
    CLI.command('echo hi', this.app)
      .then(ReplExpect.okWithString('hi'))
      .catch(Common.oops(this))
  )

  Common.pit('should echo hi with surrounding whitespace', () =>
    CLI.command('echo   hi               ', this.app)
      .then(ReplExpect.okWithString('hi'))
      .catch(Common.oops(this))
  )

  Common.pit('should echo hi hi with surrounding whitespace', () =>
    CLI.command('echo   hi hi               ', this.app)
      .then(ReplExpect.okWithString('hi hi'))
      .catch(Common.oops(this))
  )

  Common.pit('should echo hi hi with intra-whitespaces', () =>
    CLI.command('echo   hi  hi               ', this.app)
      .then(ReplExpect.okWithString('hi hi'))
      .catch(Common.oops(this))
  )

  Common.pit('should echo "hi  hi"', () =>
    CLI.command('echo "hi  hi"', this.app)
      .then(ReplExpect.okWithString('hi  hi'))
      .catch(Common.oops(this))
  )

  Common.pit('should echo "hi  hi" with surrounding whitespace', () =>
    CLI.command('echo   "hi  hi"               ', this.app)
      .then(ReplExpect.okWithString('hi  hi'))
      .catch(Common.oops(this))
  )

  Common.pit('should echo multi', () =>
    CLI.command('echo   "hi  hi" hi        "hi   hi"               ', this.app)
      .then(ReplExpect.okWithString('hi  hi hi hi   hi'))
      .catch(Common.oops(this))
  )
})
