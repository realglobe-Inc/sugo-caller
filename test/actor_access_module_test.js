/**
 * Test case for actorAccessModule.
 * Runs with mocha.
 */
'use strict'

const actorAccessModule = require('../lib/accessing/actor_access_module.js')
const { deepEqual } = require('assert')


describe('actor-access-module', function () {
  this.timeout(3000)

  before(async () => {

  })

  after(async () => {

  })

  it('Actor access module', async () => {
    let module = actorAccessModule({
      foo () {
        return Promise.resolve([ 'foo', ...arguments ].join(':'))
      }
    }, {
      $invoke: (name, params) => ({ name, params })
    })

    deepEqual(await module.foo('hoge'), { name: 'foo', params: [ 'hoge' ] })

    let module02 = module.with({ session: 12345 })
    deepEqual(await module02.foo('hoge'), { name: 'foo', params: [ { session: 12345 }, 'hoge' ] })
  })
})

/* global describe, before, after, it */
