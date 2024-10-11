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

const test = require('brittle')
const WalletStoreHyperbee = require('../src/wallet-store-hyperbee')

test('WalletStoreHyperbee - Basic operations', async (t) => {
  const store = new WalletStoreHyperbee()
  await store.init()

  t.teardown(async () => {
    await store.close()
  })

  // Test put and get
  await store.put('key1', 'value1')
  const value = await store.get('key1')
  t.is(value, 'value1', 'Get should return the correct value')

  // Test delete
  await store.delete('key1')
  const deletedValue = await store.get('key1')
  t.is(deletedValue, null, 'Deleted key should return null')

  // Test put with object
  const objValue = { name: 'John', age: 30 }
  await store.put('key2', objValue)
  const retrievedObj = await store.get('key2')
  t.alike(retrievedObj, objValue, 'Retrieved object should match the original')

  // Test has
  const hasKey2 = await store.has('key2')
  t.ok(hasKey2, 'Has should return true for existing key')
  const hasNonExistent = await store.has('nonexistent')
  t.is(hasNonExistent, null, 'Has should return null for non-existent key')

  // Test some
  let foundValue = false
  await store.some((key, value) => {
    if (key === 'key2') {
      foundValue = true
      return true
    }
    return false
  })
  t.ok(foundValue, 'Some should find the existing key')

  // Test entries
  const entries = []
  await store.entries((key, value) => {
    entries.push({ key, value })
  })
  t.is(entries.length, 1, 'Entries should return the correct number of items')
  t.alike(entries[0], { key: 'key2', value: objValue }, 'Entry should match the stored data')

  // Test clear
  await store.clear()
  const clearedValue = await store.get('key2')
  t.is(clearedValue, null, 'Clear should remove all entries')
})

test('WalletStoreHyperbee - New instance', async (t) => {
  const mainStore = new WalletStoreHyperbee()
  await mainStore.init()

  t.teardown(async () => {
    await mainStore.close()
  })

  const instance1 = mainStore.newInstance({ name: 'instance1' })
  await instance1.init()
  const instance2 = mainStore.newInstance({ name: 'instance2' })
  await instance2.init()

  t.not(instance1, instance2, 'Instances should be different')
  t.is(instance1.name, 'instance1', 'Instance name should be correctly set')
  t.is(instance2.name, 'instance2', 'Instance name should be correctly set')

  await instance1.put('key', 'value1')
  await instance2.put('key', 'value2')

  const value1 = await instance1.get('key')
  const value2 = await instance2.get('key')

  t.is(value1, 'value1', 'Instance 1 should have correct value')
  t.is(value2, 'value2', 'Instance 2 should have correct value')
})
