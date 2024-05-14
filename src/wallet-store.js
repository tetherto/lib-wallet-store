



class WalletStore {
  constructor(config) {
    this.config = config
    this.ready = false
  }
  async init() {}
  get (key) {}
  put (key, val) {}
  export() {}
  import() {}
  
}

const cache = new Map()


class WalletStoreMemory extends WalletStore {
  constructor(config) {
    super(config)
    this.name = config?.name
    this.db = new Map()
  }

  async init() {
    this.ready = true
  }

  newInstance(opts) {
    if(cache.has(opts.name)) {
      return cache.get(opts.name)
    }
    const instance =  new WalletStoreMemory(opts)
    cache.set(opts.name, instance)
    return instance
  }

  get (key) {
    return this.db.get(key)
  }

  async put (key, val) {
    this.db.set(key, val)
  }

  export() {
    const obj = Object.fromEntries(obj);
    return JSON.stringify(obj, null, 2)
  }

  keys(query) {
    const keys = this.db.keys()
    let res = []
    for(let key of keys) {
      if(key.includes(query)) {
        res.push(this.db.get(key))
      }
    }
    return res
  }

  import(snapshot) {
    this.db = new Map(Object.entries(snapshot));
  }
}

module.exports = {
  WalletStore,
  WalletStoreMemory
}
