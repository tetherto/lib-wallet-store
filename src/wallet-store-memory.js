const WalletStore = require('./wallet-store')

const cache = new Map()
class WalletStoreMemory extends WalletStore {
  constructor(config) {
    super(config)
    this.name = config?.name || 'default_'+Date.now()
    this.db = new Map()
    this._stop = false
  }

  async init() {
    this.ready = true
  }

  close() {
    this._stop = true
  }

  newInstance(opts) {
    const n = `${this.name}-${opts.name || 'default'}`
    if(cache.has(n)) {
      return cache.get(n)
    }
    const instance =  new WalletStoreMemory(opts)
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

  async delete(key) {
    return this.db.delete(key)
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

  async some(cb) {
    for (let [key, value] of this.db.entries()) {
      if(await cb(key, value)) {
        return true
      }
      if(this._stop) return
    }
    return false 
  }

  async entries(cb) {
    for await (let [key, value] of this.db.entries()) {
      await cb(key, value)
      if(this._stop) return
    }
  }
}

module.exports = WalletStoreMemory
