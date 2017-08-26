/**
 * Test case for validators.
 * Runs with mocha.
 */
'use strict'

const validators = require('../lib/validators.js')
const assert = require('assert')


describe('validators', function () {
  this.timeout(3000)

  before(async () => {

  })

  after(async () => {

  })

  it('Validators', async () => {
    assert.ok(validators)
  })
})

/* global describe, before, after, it */
