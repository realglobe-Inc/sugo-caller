/**
 * Test case for sugoTerminal.
 * Runs with mocha.
 */
'use strict'

const SugoTerminal = require('../lib/sugo_terminal.js')
const assert = require('assert')
const sgSocket = require('sg-socket')
const apemansleep = require('apemansleep')
const co = require('co')

const { RemoteEvents, AcknowledgeStatus } = require('sg-socket-constants')

const { OK, NG } = AcknowledgeStatus
const { PERFORM, PIPE, JOIN, LEAVE } = RemoteEvents

describe('sugo-terminal', function () {
  this.timeout(4000)
  
  let sleep = apemansleep.create({})
  let port = 9854
  let server
  let sockets = {}
  before(() => co(function * () {
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
                  name: '',
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
    yield sleep.sleep(200)
    server.close()
  }))

  it('Sugo terminal', () => co(function * () {
    let url = `http://localhost:${port}/terminals`

    let terminal = new SugoTerminal(url, {})
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
    yield sleep.sleep(20)

    yield terminal.disconnect('hoge')
  }))
})

/* global describe, before, after, it */
