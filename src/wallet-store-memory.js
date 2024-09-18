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
'use strict'

const WalletStore = require('./wallet-store')

const cache = new Map()
class WalletStoreMemory extends WalletStore {
  constructor (config) {
    super(config)
    this.name = config?.name || 'default_' + Date.now()
    this.db = new Map()
    this._stop = false
  }

  async init () {
    this.ready = true
  }

  close () {
    this._stop = true
  }

  newInstance (opts) {
    const n = `${this.name}-${opts.name || 'default'}`
    if (cache.has(n)) {
      return cache.get(n)
    }
    const instance = new WalletStoreMemory(opts)
    cache.set(n, instance)
    return instance
  }

  get (key) {
    return this.db.get(key)
  }

  async put (key, val) {
    this.db.set(key, val)
    return val
  }

  async delete (key) {
    return this.db.delete(key)
  }

  export () {
    const obj = Object.fromEntries(this.db)
    return JSON.stringify(obj, null, 2)
  }

  clear () {
    this.db.clear()
  }

  import (snapshot) {
    this.db = new Map(Object.entries(snapshot))
  }

  async some (cb) {
    for (const [key, value] of this.db.entries()) {
      if (await cb(key, value)) {
        return true
      }
      if (this._stop) return
    }
    return false
  }

  async entries (cb) {
    for await (const [key, value] of this.db.entries()) {
      await cb(key, value)
      if (this._stop) return
    }
  }
}

module.exports = WalletStoreMemory
