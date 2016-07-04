/**
 * Test case for spotAccess.
 * Runs with mocha.
 */
'use strict'

const SpotAccess = require('../lib/accessing/spot_access.js')
const assert = require('assert')
const asleep = require('asleep')
const co = require('co')

describe('spot-access', () => {
  before(() => co(function * () {

  }))

  after(() => co(function * () {

  }))

  it('Spot access', () => co(function * () {
    let access = new SpotAccess({
      specs: {
        bash: {
          methods: {
            spawn: {
              desc: 'Spawn a command',
              params: [
                { name: 'cmd', type: 'string', desc: 'Command to spawn' },
                { name: 'args', type: 'array', desc: 'Command arguments' },
                { name: 'options', type: 'Object', desc: 'Optional settings' }
              ]
            }
          }
        }
      },
      connector: {
        invoke: () => Promise.resolve(true),
        fire: () => Promise.resolve(true),
        listen: () => Promise.resolve(true)
      }
    })
    assert.ok(access)
    let { bundle } = access
    let bash = bundle.bash()
    yield bash.spawn('ls', [ '-la' ])
    bash.emit('stdin', 'hoge')
    yield asleep(200)
  }))
})

/* global describe, before, after, it */
