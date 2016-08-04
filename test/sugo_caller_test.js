/**
 * Test case for sugoCaller.
 * Runs with mocha.
 */
'use strict'

const SugoCaller = require('../lib/sugo_caller.js')
const assert = require('assert')
const sgSocket = require('sg-socket')
const asleep = require('asleep')
const aport = require('aport')
const co = require('co')

const { RemoteEvents, AcknowledgeStatus } = require('sg-socket-constants')

const { OK, NG } = AcknowledgeStatus
const { PERFORM, PIPE, JOIN, LEAVE } = RemoteEvents

describe('sugo-caller', function () {
  this.timeout(16000)

  let port, server
  let sockets = {}
  before(() => co(function * () {
    port = yield aport()
    server = sgSocket(port)
    server.of('callers').on('connection', (socket) => {
      sockets[ socket.id ] = socket
      socket
        .on(JOIN, (data, callback) => {
          callback({
            status: OK,
            payload: {
              specs: {
                bash: {
                  name: 'bash',
                  desc: 'Bash module',
                  version: '1.0.0',
                  methods: {
                    default: {},
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
              }
            }
          })
        })
        .on(PERFORM, (data, callback) => {
          callback({
            status: OK
          })
        })
      socket.on(LEAVE, (data, callback) => {
        callback({ status: OK })
      })
    })
  }))

  after(() => co(function * () {
    yield asleep(200)
    server.close()
  }))

  it('Sugo caller', () => co(function * () {
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
      for (let id of Object.keys(sockets)) {
        let socket = sockets[ id ]
        socket.emit(PIPE, {
          module: 'bash',
          event: 'stdout',
          data: {
            'hoge': 'hogehoge'
          }
        })
      }
    })
    assert.deepEqual(bash.eventNames(), [ 'stdout' ])
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
    let url = `http://localhost:${port}/callers`
    let callers = Array.apply(null, new Array(10)).map(() => new SugoCaller(url, {}))
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
