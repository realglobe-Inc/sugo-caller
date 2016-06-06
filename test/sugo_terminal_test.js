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

  before(() => co(function * () {
    server = sgSocket(port)
    server.of('terminals').on('connection', (socket) => {
      socket.on(JOIN, (data, callback) => {
        callback({ status: OK })
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
    yield terminal.connect('hoge')

    yield terminal.disconnect('hoge')
  }))
})

/* global describe, before, after, it */
