/**
 * Test case for sugoCaller.
 * Runs with mocha.
 */
'use strict'

const SugoCaller = require('../lib/sugo_caller.js')
const { ok, equal, deepEqual } = require('assert')
const sgSocket = require('sg-socket')
const asleep = require('asleep')
const aport = require('aport')
const uuid = require('uuid')

const sugoHub = require('sugo-hub')
const sugoActor = require('sugo-actor')
const socketIOAuth = require('socketio-auth')
const { CallerEvents } = require('sugo-constants')
const { RemoteEvents, AcknowledgeStatus } = require('sg-socket-constants')

const { OK, NG } = AcknowledgeStatus
const { PERFORM, PIPE, JOIN, LEAVE, RESULT } = RemoteEvents

describe('sugo-caller', function () {
  this.timeout(16000)

  let port, server
  let sockets = {}
  before(async () => {
    port = await aport()
    server = sgSocket(port)
    let handle = (socket) => {
      sockets[ socket.id ] = socket
      socket
        .on(JOIN, (data, callback) => {
          if (data.messages) {
            console.log('JOIN messages', data.messages)
          }
          // console.log(data.messages)
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
                    },
                    get$state: {
                      desc: 'Dynamic getter for state'
                    },
                    set$state: {
                      desc: 'Dynamic setter for state'
                    }
                  }
                }
              }
            }
          })
        })
        .on(PERFORM, (data, callback) => {
          let pid = uuid.v4()
          callback({
            status: OK,
            payload: {
              pid
            }
          })
          setTimeout(() => {
            socket.emit(RESULT, {
              status: OK,
              pid,
              payload: {}
            })
          }, 10)
        })
      socket.on(LEAVE, (data, callback) => {
        callback({ status: OK })
      })
    }
    let callerIO = server.of('/callers')
    callerIO.on('connection', handle)
    let callerAuthIO = server.of('/auth/callers')
    socketIOAuth(callerAuthIO, {
      timeout: 'none',
      authenticate (socket, data, callback) {
        let valid = data.token === 'mytoken'
        callback(null, valid)
      }
    })
    callerAuthIO.on('connection', handle)
  })

  after(async () => {
    await asleep(200)
    server.close()
  })

  it('Sugo caller', async () => {
    let url = `http://localhost:${port}/callers`

    let caller = new SugoCaller(url, {
      multiplex: true
    })
    ok(caller.clientType)
    let actor01 = await caller.connect('hoge', { messages: { 'foo': 'bar' } })

    ok(actor01.has('bash'))
    let bash = actor01.get('bash')
    await bash.spawn('ls', [ '-la' ])
    let print = (data) => console.log(data)
    bash.on('stdout', print)
    await new Promise((resolve, reject) => {
      bash.on('stdout', (data) => {
        deepEqual(data, {
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
    deepEqual(bash.eventNames(), [ 'stdout' ])
    bash.off('stdout', print)
    bash.emit('stdin', { foo: 'bar' })

    await bash() // Call default

    await asleep(20)

    await caller.disconnect('hoge')
    // Describe module
    {
      let description = actor01.describe('bash')
      equal(description.name, 'bash')
      equal(description.desc, 'Bash module')
    }
    // Try call after disconnected
    {
      let caught
      try {
        await bash() // Call default
      } catch (err) {
        caught = err
      }
      ok(caught)
    }
    // Validate the connecting module
    {
      let caught
      try {
        await actor01.get('bash', {
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
      ok(caught)
    }
  })

  it('Bunch of instances', async () => {
    let startAt = new Date()
    let callers = Array.apply(null, new Array(10)).map(() => new SugoCaller({
      port,
      protocol: 'http'
    }))
    let actors = await Promise.all(callers.map((caller) => caller.connect('hoge')))
    for (let actor of actors) {
      await actor.disconnect()
    }

    for (let caller of callers) {
      await caller.disconnect()
    }
  })

  it('With auth', async () => {
    let url = `http://localhost:${port}/auth/callers`

    // Success
    {
      let caller = new SugoCaller(url, {
        auth: { token: 'mytoken' }
      })
      let actor01 = await caller.connect('hoge')
      ok(actor01.has('bash'))
    }
    // Failed
    {
      let caller = new SugoCaller(url, {
        auth: { token: '__invalid_token__' }
      })
      let caught
      try {
        await caller.connect('hoge')

      } catch (e) {
        caught = e
      }
    }
    // Success
    {
      let caller = new SugoCaller(url, {
        auth: { token: 'mytoken' }
      })
      let actor01 = await caller.connect('hoge')
      ok(actor01)
    }
  })

  it('Format url', async () => {
    equal(
      SugoCaller.parseCallerUrl({
        protocol: 'https',
        host: 'example.com'
      }),
      'https://example.com/callers'
    )
    equal(
      SugoCaller.parseCallerUrl({
        protocol: 'http',
        hostname: 'example.com',
        port: 3000,
        pathname: 'hoge'
      }),
      'http://example.com:3000/hoge'
    )
  })

  it('Connect to actual SUGO-Hub', async () => {
    const { Module } = sugoActor
    let port = await aport()
    let hub = await sugoHub({
      storage: `${__dirname}/var/sugos/testing-03`
    }).listen(port)
    let actor = sugoActor({
      port,
      key: 'actor01',
      modules: {
        foo: new Module({
          sayHi: (name, date) => `Hi!, ${name}`,
          handleDate (date) {
            return {
              given: date,
              is: date instanceof Date,
              new: new Date()
            }
          },
          handleFunc () {

          },
          doWrong () {
            let err = new Error('something is wrong')
            Object.assign(err, { name: 'SOMETHING_IS_WRONG' })
            throw err
          },

          returnsArray () {
            return [ { d: new Date() }, { n: 1 } ]
          }
        })
      }
    })
    await actor.connect()
    let caller = new SugoCaller({ port })
    let actor01 = await caller.connect('actor01')
    ok(actor01)
    equal(actor01.key, 'actor01')
    // TODO after this PR accepted:
    //  https://github.com/realglobe-Inc/sugo-hub/pull/38
    // ok(actor01.as)
    let description = actor01.describe('foo')
    ok(description)
    let foo = actor01.get('foo')
    let hi = await foo.sayHi('Bess', new Date())
    equal(hi, 'Hi!, Bess')

    let date = await foo.handleDate(new Date())
    ok(date)
    await foo.handleFunc(() => 'year!')

    {
      let caught = await foo.doWrong().catch((e) => e)
      equal(caught.name, 'SOMETHING_IS_WRONG')
    }

    // Handling array
    {
      let a = await foo.returnsArray()
      ok(a[ 0 ].d instanceof Date)
    }

    await actor01.disconnect()
    await asleep(10)
    await actor.disconnect()
    await hub.close()
  })

  it('Actor level event emitting', async () => {
    const { Module } = sugoActor
    let port = await aport()
    let hub = await sugoHub({
      storage: `${__dirname}/var/sugos/testing-05`
    }).listen(port)
    let actor = sugoActor({
      port,
      key: 'actor01',
      modules: {
        foo: new Module({})
      }
    })
    let received
    actor.on(CallerEvents.JOIN, ({ caller, messages }) => {
      let { token } = messages
      setTimeout(() => {
        caller.emit('token:received', { token })
      }, 10)
    })
    await actor.connect()
    await asleep(100)
    let caller = new SugoCaller({ port })
    let actor01 = await caller.connect('actor01', {
      messages: { token: '1234qwer' }
    })
    actor01.on('token:received', (data) => {
      received = data
    })
    await asleep(300)
    await actor01.disconnect()
    await actor.disconnect()
    await hub.close()
    ok(received)
    equal(received.token, '1234qwer')
  })
})

/* global describe, before, after, it */
