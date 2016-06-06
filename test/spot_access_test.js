/**
 * Test case for spotAccess.
 * Runs with mocha.
 */
'use strict'

const SpotAccess = require('../lib/accessing/spot_access.js')
const assert = require('assert')
const apemansleep = require('apemansleep')
const co = require('co')

describe('spot-access', () => {
  let sleep = apemansleep.create()
  before(() => co(function * () {

  }))

  after(() => co(function * () {

  }))

  it('Spot access', () => co(function * () {
    let access = new SpotAccess({
      bash: {
        $methods: {
          spawn: {
            $desc: 'Spawn a command',
            $params: [
              { $name: 'cmd', $type: 'string', $desc: 'Command to spawn' },
              { $name: 'args', $type: 'array', $desc: 'Command arguments' },
              { $name: 'options', $type: 'Object', $desc: 'Optional settings' }
            ]
          }
        }
      }
    }, {
      invokeMethod: () => Promise.resolve(true)
    })
    let { bundle } = access
    let bash = bundle.bash()
    yield bash.spawn('ls', [ '-la' ])

    yield sleep.sleep(200)
  }))
})

/* global describe, before, after, it */
