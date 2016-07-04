/**
 * Test case for create.
 * Runs with mocha.
 */
'use strict'

const create = require('../lib/create.js')
const assert = require('assert')
const co = require('co')

describe('create', () => {
  before(() => co(function * () {

  }))

  after(() => co(function * () {

  }))

  it('Create', () => co(function * () {
    assert.ok(create('http://example.com'))
  }))
})

/* global describe, before, after, it */
