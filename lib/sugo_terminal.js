/**
 * Terminal to control remote things.
 * @class SugoTerminal
 */
'use strict'

const sgSocketClient = require('sg-socket-client')
const TerminalValidator = require('./validating/terminal_validator')
const { EventEmitter } = require('events')
const { RemoteEvents } = require('sg-socket-constants')
const { JOIN, LEAVE, PERFORM, PIPE } = RemoteEvents

const SpotAccess = require('./accessing/spot_access')
const co = require('co')

/** @lends SugoTerminal */
class SugoTerminal extends EventEmitter {
  constructor (url, config = {}) {
    super()
    const s = this
    s.url = url

    s.validator = new TerminalValidator()
    s.socket = null
    s.accesses = {}

    s.onError = (err) => s.emit(err) || Promise.reject(err)
  }

  /**
   * Connect to spot
   * @param {string} key - Key of spot
   * @returns {Promise.<Object>} - Spot accessor
   */
  connect (key) {
    const s = this
    return co(function * () {
      let socket = sgSocketClient(s.url)
      let pipeListeners = {}
      yield socket.waitToConnect()
      let { payload } = yield socket.call(JOIN, { key })
      let { specs } = payload

      if (s.accesses[ key ]) {
        throw new Error(`Already connected to: ${key}`)
      }

      let vError = s.validator.validateInterfaceSpec(specs)
      if (vError) {
        throw vError
      }

      let access = new SpotAccess({
        specs,
        // Connection methods for access edge
        connector: {
          invoke: co.wrap(function * invokeMethod (interfaceName, method, params) {
            return yield socket.call(PERFORM, { key, method, params, interface: interfaceName })
          }),
          fire: co.wrap(function * fireEvent (interfaceName, event, data) {
            socket.emit(PIPE, { event, data, interface: interfaceName })
          }),
          listen: co.wrap(function * registerListener (interfaceName, event, listener) {
            pipeListeners[ interfaceName ] = pipeListeners[ interfaceName ] || {}
            pipeListeners[ interfaceName ][ event ] = (pipeListeners[ interfaceName ][ event ] || []).concat(listener)
          })
        }
      })

      socket.on(PIPE, (piped) => {
        let listeners = (pipeListeners[ piped.interface ] || {})[ piped.event ] || []
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
          })
        }
      })
      return bundle
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
        for (let key of s.accesses) {
          let access = s.accesses[ key ]
          yield access.bundle.disconnect()
        }
        s.accesses = {}
      }
    })
  }
}

module.exports = SugoTerminal
