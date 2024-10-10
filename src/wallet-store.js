'use strict'
// Copyright 2024 Tether Operations Limited
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

class WalletStore {
  constructor (config) {
    this.config = config
    this.ready = false
    this.name = config?.name || 'default'
    if (!config._cache) {
      this._cache = new Map()
    }
  }

  init () {}
  // @desc: create a new instance of the store. equivalent to creating table, or Leveldb db
  newInstance (opts) {}
  // @desc: get value from store
  get (key) {}
  // @desc: put value in store
  put (key, val) {}
  // @desc: delete value from store
  delete (key) {}
  // @desc: export store
  export () {}
  // @dec clear db
  clear () {}
  // @desc: import store
  import () {}
  // @desc: iterate over some values. If callback is true, stop iteration
  some (cb) {}
  // @desc: iterate over all values
  entries (cb) {}
  close () {}
}

module.exports = WalletStore
