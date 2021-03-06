/**
 * Test case for actorAccess.
 * Runs with mocha.
 */
'use strict'

const ActorAccess = require('../lib/accessing/actor_access.js')
const assert = require('assert')
const asleep = require('asleep')


describe('actor-access', () => {
  before(async () => {

  })

  after(async () => {

  })

  it('Actor access', async () => {
    let access = new ActorAccess({
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
        },
        'bash.subFoo': {
          methods: {
            bar: {
              desc: 'Spawn of sub method'
            }
          }
        }
      },
      connector: {
        invoke: () => Promise.resolve(true),
        fire: () => Promise.resolve(true),
        listen: () => Promise.resolve(true),
        delisten: () => Promise.resolve(true)
      }
    })
    assert.ok(access)
    let { bundle } = access
    let bash = bundle.get('bash')
    await bash.spawn('ls', [ '-la' ])
    bash.emit('stdin', 'hoge')
    await asleep(200)

    try {
      bundle.get('__invalid_module_name__')
    } catch (e) {
      assert.ok(e)
      console.error(e)
    }

    assert.ok(bash.subFoo)
    assert.ok(bash.subFoo.bar)
  })
})

/* global describe, before, after, it */
