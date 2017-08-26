/**
 * Test case for create.
 * Runs with mocha.
 */
'use strict'

const create = require('../lib/create.js')
const assert = require('assert')


describe('create', () => {
  before(async () => {

  })

  after(async () => {

  })

  it('Create', async () => {
    assert.ok(create('http://example.com'))
  })
})

/* global describe, before, after, it */
