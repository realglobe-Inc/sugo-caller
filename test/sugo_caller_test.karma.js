/**
 * Test case for sugoCaller.
 * Runs with karma.
 */
'use strict'

const SugoCaller = require('../shim/browser/sugo_caller.js')
const assert = require('assert')
const asleep = require('asleep')
const co = require('co')

describe('sugo-caller', function () {
  this.timeout(16000)
  let port = 8888
  before(() => co(function * () {

  }))

  after(() => co(function * () {

  }))

  it('Sugo Caller', () => co(function * () {
    let url = `http://localhost:${port}/callers`

    let caller = new SugoCaller(url, {})
    let actor01 = yield caller.connect('hoge')

    assert.ok(actor01.has('bash'))
    let bash = actor01.get('bash')
    yield bash.spawn('ls', [ '-la' ])
    let print = (data) => console.log(data)
    bash.on('stdout', print)
    yield new Promise((resolve, reject) => {
      bash.on('stdout', (data) => {
        assert.deepEqual(data, {
          'hoge': 'hogehoge'
        })
        resolve()
      })
    })

    bash.off('stdout', print)
    bash.emit('stdin', { foo: 'bar' })

    yield bash() // Call default

    yield asleep(20)

    yield caller.disconnect('hoge')

    // Try call after disconnected
    {
      let caught
      try {
        yield bash() // Call default
      } catch (err) {
        caught = err
      }
      assert.ok(caught)
    }
    // Validate the connecting module
    {
      let caught
      try {
        yield actor01.get('bash', {
          expect: {
            type: 'object',
            properties: {
              name: {
                enum: [ 'super-bash', 'ultra-bash' ]
              }
            }
          }
        })
      } catch (err) {
        caught = err
      }
      assert.ok(caught)
    }
  }))

  it('Bunch of instances', () => co(function * () {
    let startAt = new Date()
    let callers = Array.apply(null, new Array(10)).map(() => new SugoCaller({
      port,
      protocol: 'http'
    }))
    let actors = yield Promise.all(callers.map((caller) => caller.connect('hoge')))
    for (let actor of actors) {
      yield actor.disconnect()
    }

    for (let caller of callers) {
      yield caller.disconnect()
    }
    console.log('took', new Date() - startAt)
  }))
})

/* global describe, before, after, it */
