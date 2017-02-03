#!/usr/bin/env node

/**
 * Run browser tests.
 */

'use strict'

process.chdir(`${__dirname}/..`)
process.env.DEBUG = 'sg:*'

const apeTasking = require('ape-tasking')
const co = require('co')
const sgSocket = require('sg-socket')
const {exec} = require('child_process')

const { RemoteEvents, AcknowledgeStatus } = require('sg-socket-constants')

const { OK, NG } = AcknowledgeStatus
const { PERFORM, PIPE, JOIN, LEAVE } = RemoteEvents

let server
let port = 8888

apeTasking.runTasks('browser test', [
  () => new Promise((resolve, reject) => {
    exec('./ci/shim.js', (err, stdout) => {
      if (err) {
        reject(err)
      }
      console.log(stdout)
      resolve()
    })
  }),
  () => co(function * () {
    server = sgSocket(port)
    server.of('callers').on('connection', (socket) => {
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
      setTimeout(() => {
        socket.emit(PIPE, {
          module: 'bash',
          event: 'stdout',
          data: {
            'hoge': 'hogehoge'
          }
        })
      }, 100)
    })
  }),
  () => new Promise((resolve, reject) => {
    exec('./node_modules/.bin/karma start', (err, stdout, stderr) => {
      if (err) {
        reject(err)
      }
      console.log(stdout)
      console.error(stderr)
      resolve()
    })
  }),
  () => co(function * () {
    server.close()
  })
], true)
