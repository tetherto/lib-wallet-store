

class WalletStore {
  constructor(config) {
    this.config = config
    this.ready = false
  }
  async init() {}
  // @desc: create a new instance of the store. equivalent to creating table, or Leveldb db
  newInstance(opts) {}
  // @desc: get value from store
  get (key) {}
  // @desc: put value in store
  put (key, val) {}
  // @desc: delete value from store
  delete(key) {}
  // @desc: export store
  export() {}
  // @dec clear db 
  clear() {}
  // @desc: import store
  import() {}
  // @desc: iterate over some values. If callback is true, stop iteration
  some(cb) {}
  // @desc: iterate over all values
  entries(cb) {}
}

module.exports = WalletStore
