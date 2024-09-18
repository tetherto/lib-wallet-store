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
const Hyperbee = require('hyperbee')
const Hypercore = require('hypercore')
const RAM = require('random-access-memory')

class WalletStoreHyperbee extends WalletStore {
  constructor (config = {}) {
    super(config)
    let store
    if (!config._cache) {
      this._cache = new Map()
    }
    if (config.store_path) {
      store = config.store_path
      this.store_path = config.store_path
    } else {
      store = RAM
      this.store_path = null
    }
    if (config.hyperbee) {
      this.db = config.hyperbee
    } else {
      const core = new Hypercore(store)
      this.db = new Hyperbee(core, { keyEncoding: 'utf-8', valueEncoding: 'utf-8' })
    }
  }

  async init () {
    await this.db.ready()
    this.ready = true
  }

  async close () {
    await this.db.close()
    if (this.config._cache) {
      this.config._cache.delete(this.config._cache_name)
    }
  }

  newInstance (opts) {
    if (!opts.name) throw new Error('instance needs a name')

    const n = `${this.name}-${opts.name || 'default'}`

    if (this.store_path) {
      opts.store_path = this.store_path + '/' + n
    }
    const exists = this._cache.get(n)
    if (exists) return exists

    opts._cache = this._cache
    opts._cache_name = n
    const instance = new WalletStoreHyperbee(opts)
    this._cache.set(n, instance)
    return instance
  }

  async has (k) {
    if (!this.db.readable) return
    const v = await this.db.get(k)
    if (!v) return null
    return true
  }

  async get (key) {
    if (!this.db.readable) return
    const d = await this.db.get(key)
    if (!d) return null
    return this._parseValue(d.value)
  }

  _parseValue (v) {
    let res
    try {
      res = JSON.parse(v)
    } catch (err) {
      return v
    }
    return res
  }

  async put (key, val, opts) {
    if (!this.ready) throw new Error('store not read')
    if (!this.db.writable) return
    let res = val
    if (typeof val === 'object') {
      try {
        res = JSON.stringify(val)
      } catch (err) {
        console.log(err)
        throw new Error('Value could not be turned into string ' + err.message)
      }
    }
    return this.db.put(key, res ? res.toString() : null, opts)
  }

  async delete (key, opts) {
    if (!this.db.writable) return
    return this.db.del(key, opts)
  }

  async dump (opts = {}, dir) {
    const obj = {}
    return this.entries((k, v) => {
      obj[k] = v
    })
  }

  clear () {
    if (!this.db.writable) return
    return this.entries((k) => {
      return this.db.put(k, null)
    })
  }

  import (snapshot) {
    this.db = new Map(Object.entries(snapshot))
  }

  async some (cb, opts) {
    if (!this.db.readable) return
    const read = this.db.createReadStream(opts)
    for await (const data of read) {
      if (!this.db.readable) return
      if (await cb(data.key, this._parseValue(data.value))) {
        return true
      }
    }
    return false
  }

  async entries (cb, opts) {
    if (!this.db.readable) return
    const read = this.db.createReadStream(opts)
    for await (const data of read) {
      if (!this.db.readable) return
      await cb(data.key, this._parseValue(data.value))
    }
  }
}

module.exports = WalletStoreHyperbee
