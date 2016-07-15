/**
 * Test case for sugoTerminal.
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
  this.timeout(4000)

  let port, server
  let sockets = {}
  before(() => co(function * () {
    port = yield aport()
    server = sgSocket(port)
    server.of('terminals').on('connection', (socket) => {
      sockets[ socket.id ] = socket
      socket
        .on(JOIN, (data, callback) => {
          callback({
            status: OK,
            payload: {
              specs: {
                bash: {
                  name: 'bash',
                  desc: 'Bash interface',
                  version: '1.0.0',
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

  it('Sugo terminal', () => co(function * () {
    let url = `http://localhost:${port}/terminals`

    let terminal = new SugoCaller(url, {})
    let spot01 = yield terminal.connect('hoge')

    let bash = spot01.bash()
    yield bash.spawn('ls', [ '-la' ])

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
          interface: 'bash',
          event: 'stdout',
          data: {
            'hoge': 'hogehoge'
          }
        })
      }
    })
    bash.emit('stdin', { foo: 'bar' })
    yield asleep(20)

    yield terminal.disconnect('hoge')

    // Validate the connecting interface
    {
      let caught
      try {
        yield spot01.bash({
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
})

/* global describe, before, after, it */
