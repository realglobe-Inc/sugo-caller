/**
 * Test case for parseCallerUrl.
 * Runs with mocha.
 */
'use strict'

const parseCallerUrl = require('../lib/parsing/parse_caller_url.js')
const assert = require('assert')


describe('parse-caller-url', function () {
  this.timeout(3000)

  before(async () => {

  })

  after(async () => {

  })

  it('Parse caller url', async () => {
    assert.equal(
      parseCallerUrl('http://localhost:3000/callers'),
      'http://localhost:3000/callers'
    )

    assert.equal(
      parseCallerUrl('http://localhost:3000'),
      'http://localhost:3000'
    )

    assert.equal(
      parseCallerUrl({
        port: 3001,
        hostname: 'example.com'
      }),
      'http://example.com:3001/callers'
    )

  })
})

/* global describe, before, after, it */
