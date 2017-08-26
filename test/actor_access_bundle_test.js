/**
 * Test case for actorAccessBundle.
 * Runs with mocha.
 */
'use strict'

const ActorAccessBundle = require('../lib/accessing/actor_access_bundle.js')
const assert = require('assert')


describe('actor-access-bundle', function () {
  this.timeout(3000)

  before(async () => {

  })

  after(async () => {

  })

  it('Actor access bundle', async () => {
    let bundle = new ActorAccessBundle({
      specs: {}
    })
    assert.ok(bundle)
    bundle.set('foo', {
      sayFoo () { }
    })
    assert.ok(bundle.get('foo').sayFoo)
  })
})

/* global describe, before, after, it */
