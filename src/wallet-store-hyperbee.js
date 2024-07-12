
const WalletStore = require('./wallet-store')
const Hyperbee = require('hyperbee')
const Hypercore = require('hypercore')
const RAM = require('random-access-memory')

class WalletStoreHyperbee extends WalletStore {
  constructor(config = {}) {
    super(config)
    this.name = config?.name || 'default_'
    let store;
    if(!config._cache) {
      this._cache = new Map()
    }
    if(config.store_path) {
      store = config.store_path
      this.store_path = config.store_path
    } else {
      store = RAM
    }
    if(config.hyperbee) {
      this.db = config.hyperbee
    } else {
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
    if(this._cache.has(n)) {
      return this._cache.get(n)
    }

    opts._cache = this._cache
    const instance =  new WalletStoreHyperbee(opts)
    this._cache.set(n, instance)
    return instance
  }

  async has (k) {
    if(!this.db.readable) return 
    const v = await this.db.get(k)
    if(!v) return null
    return true
  }

  async get (key) {
    if(!this.db.readable) return 
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
    if(!this.db.writable) return 
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
    if(!this.db.writable) return 
    return this.db.del(key, opts)
  }

  export() {
  }

  clear() {
    if(!this.db.writable) return 
    return this.entries((k) => {
      return this.db.put(k,null)
    })
  }
 
  import(snapshot) {
    this.db = new Map(Object.entries(snapshot));
  }

  async some(cb, opts) {
    if(!this.db.readable) return 
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
    if(!this.db.readable) return 
    const read = this.db.createReadStream(opts)
    for await (let data of read) {
      if(!this.db.readable) return 
      await cb(data.key, this._parseValue(data.value))
    }
  }
}

module.exports = WalletStoreHyperbee
