/**
 * Test case for actorAccessModule.
 * Runs with mocha.
 */
'use strict'

const actorAccessModule = require('../lib/accessing/actor_access_module.js')
const { deepEqual } = require('assert')
const co = require('co')

describe('actor-access-module', function () {
  this.timeout(3000)

  before(() => co(function * () {

  }))

  after(() => co(function * () {

  }))

  it('Actor access module', () => co(function * () {
    let module = actorAccessModule({
      foo () {
        return Promise.resolve([ 'foo', ...arguments ].join(':'))
      }
    }, {
      $invoke: (name, params) => ({ name, params })
    })

    deepEqual(yield module.foo('hoge'), { name: 'foo', params: [ 'hoge' ] })

    let module02 = module.with({ session: 12345 })
    deepEqual(yield module02.foo('hoge'), { name: 'foo', params: [ { session: 12345 }, 'hoge' ] })
  }))
})

/* global describe, before, after, it */
