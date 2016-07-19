/**
 * Test case for ActorValidator.
 * Runs with mocha.
 */
'use strict'

const ActorValidator = require('../lib/validating/caller_validator.js')
const assert = require('assert')
const co = require('co')

describe('caller-validator', () => {
  before(() => co(function * () {

  }))

  after(() => co(function * () {

  }))

  it('Terminal validator', () => co(function * () {
    assert.ok(new ActorValidator())
  }))
})

/* global describe, before, after, it */
