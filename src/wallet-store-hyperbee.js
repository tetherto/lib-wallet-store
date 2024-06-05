
const WalletStore = require('./wallet-store')
const Hyperbee = require('hyperbee')
const Hypercore = require('hypercore')
const RAM = require('random-access-memory')

const cache = new Map()
class WalletStoreHyperbee extends WalletStore {
  constructor(config = {}) {
    super(config)
    this.name = config?.name || 'default_'+Date.now()
    let store;
    if(config.store_path) {
      store = config.store_path
      this.store_path = config.store_path
    } else {
      store = RAM
    }
    if(config.hyperbee) {
      this.db = config.hyperbee
    } else {
      console.log(store)
      const core = new Hypercore(store)
      this.db = new Hyperbee(core, { keyEncoding: 'utf-8', valueEncoding: 'utf-8' })
    }
  }

  async init() {
    await this.db.ready()
    this.ready = true
  }

  async close() {
    return this.db.close()
  }

  newInstance(opts) {
    const n = `${this.name}-${opts.name || 'default'}`
    if(this.store_path) {
      opts.store_path = this.store_path+'/'+n
    }
    if(cache.has(n)) {
      return cache.get(n)
    }
    const instance =  new WalletStoreHyperbee(opts)
    cache.set(n, instance)
    return instance
  }

  async has (k) {
    const v = await this.db.get(k)
    if(!v) return null
    return true
  }

  async get (key) {
    const d = await this.db.get(key)
    if(!d) return null
    return this._parseValue(d.value)
  }

  _parseValue(v) {
    let res 
    try {
      res = JSON.parse(v)
    } catch(err) {
      return v
    }
    return res
  }

  async put (key, val, opts) {
    let res = val
    if(typeof val === 'object') {
      try {
        res = JSON.stringify(val)
      } catch(err) {
        console.log(err)
        throw new Error('Value could not be turned into string '+err.message)
      }
    }
    return this.db.put(key, res ? res.toString() : null, opts)
  }

  async delete(key, opts) {
    return this.db.del(key, opts)
  }

  export() {
    const obj = Object.fromEntries(obj);
    return JSON.stringify(obj, null, 2)
  }

  clear() {
    this.db.clear()
  }
 
  import(snapshot) {
    this.db = new Map(Object.entries(snapshot));
  }

  async some(cb, opts) {
    const read = this.db.createReadStream(opts)
    for await (let data of read) {
      if(!this.db.readable) return 
      if(await cb(data.key, this._parseValue(data.value))) {
        return true
      }
    }
    return false 
  }

  async entries(cb, opts) {
    const read = this.db.createReadStream(opts)
    for await (let data of read) {
      if(!this.db.readable) return 
      await cb(data.key, this._parseValue(data.value))
    }
  }
}

module.exports = WalletStoreHyperbee
