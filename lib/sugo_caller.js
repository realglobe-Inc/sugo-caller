/**
 * Caller to access remote actor
 * @class SugoCaller
 * @param {string} URL - Cloud url to connect
 */
'use strict'

const sgSocketClient = require('sg-socket-client')
const ActorValidator = require('./validating/caller_validator')
const { EventEmitter } = require('events')
const { RemoteEvents } = require('sg-socket-constants')
const { JOIN, LEAVE, PERFORM, PIPE } = RemoteEvents

const ActorAccess = require('./accessing/actor_access')
const co = require('co')
const assert = require('assert')

/** @lends SugoCaller */
class SugoCaller extends EventEmitter {
  constructor (url, options = {}) {
    assert.ok(url, 'URL is required.')
    super()
    const s = this
    s.url = url
    s.validator = new ActorValidator()
    s.socket = null
    s.accesses = {}

    s.onError = (err) => s.emit(err) || Promise.reject(err)
  }

  /**
   * Connect to actor
   * @param {string} key - Key of actor
   * @returns {Promise.<Object>} - Actor accessor
   */
  connect (key) {
    const s = this
    let socket
    return co(function * () {
      socket = sgSocketClient(s.url)
      let pipeListeners = {}
      yield socket.waitToConnect()
      let { payload } = yield socket.call(JOIN, { key })
      let { specs } = payload

      if (s.accesses[ key ]) {
        throw new Error(`Already connected to: ${key}`)
      }

      let vError = s.validator.validateInterfaceSpecs(specs)
      if (vError) {
        throw vError
      }

      let access = new ActorAccess({
        specs,
        validator: s.validator,
        // Connection methods for access edge
        connector: {
          invoke: co.wrap(function * invokeMethod (module, method, params) {
            s.assertConnection()
            let { payload } = yield socket.call(PERFORM, { key, method, params, module })
            return payload
          }),
          fire: co.wrap(function * fireEvent (module, event, data) {
            s.assertConnection()
            socket.emit(PIPE, { event, data, module })
          }),
          listen: co.wrap(function * registerListener (module, event, listener) {
            s.assertConnection()
            pipeListeners[ module ] = pipeListeners[ module ] || {}
            pipeListeners[ module ][ event ] = (pipeListeners[ module ][ event ] || []).concat(listener)
          }),
          delisten: co.wrap(function * deregisterListener (module, event, listener) {
            s.assertConnection()
            if (!pipeListeners[ module ][ event ]) {
              return
            }
            pipeListeners[ module ][ event ] = pipeListeners[ module ][ event ].filter((filterling) => filterling !== listener)
          })
        }
      })

      socket.on(PIPE, (piped) => {
        let listeners = (pipeListeners[ piped.module ] || {})[ piped.event ] || []
        for (let listener of listeners) {
          listener(piped.data)
        }
      })

      s.accesses[ key ] = access
      s.socket = socket
      let { bundle } = access
      Object.assign(bundle, {
        disconnect () {
          return co(function * () {
            yield socket.call(LEAVE, { key })
            delete s.accesses[ key ]
            socket.close()
            yield socket.waitToDisconnect()
            pipeListeners = {}
            delete s.socket
          })
        }
      })
      return bundle
    }).catch((err) => {
      if (socket) {
        socket.call(LEAVE, { key })
        socket.close()
      }
      return Promise.reject(err)
    })
  }

  /**
   * Disconnect from cloud server
   * @returns {Promise}
   */
  disconnect (key) {
    const s = this
    return co(function * () {
      if (key) {
        let access = s.accesses[ key ]
        if (!access) {
          throw new Error(`Not connected to: ${key}`)
        }
        yield access.bundle.disconnect()
        delete s.accesses[ key ]
      } else {
        for (let key of Object.keys(s.accesses)) {
          let access = s.accesses[ key ]
          yield access.bundle.disconnect()
        }
        s.accesses = {}
      }
    })
  }

  assertConnection () {
    const s = this
    if (!s.socket) {
      throw new Error('Not connected!!')
    }
  }
}

module.exports = SugoCaller
