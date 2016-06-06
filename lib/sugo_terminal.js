/**
 * @class SugoTerminal
 */
'use strict'

const sgSocketClient = require('sg-socket-client')
const { EventEmitter } = require('events')
const { RemoteEvents } = require('sg-socket-constants')
const { JOIN, LEAVE, PERFORM, PIPE } = RemoteEvents

const SpotAccess = require('./accessing/spot_access')
const co = require('co')
class SugoTerminal extends EventEmitter {
  constructor (url, config = {}) {
    super()
    const s = this
    s.url = url
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
      yield socket.waitToConnect()
      let { payload } = yield socket.call(JOIN, { key })
      let { $specs } = payload
      if (s.accesses[ key ]) {
        throw new Error(`Already connected to: ${key}`)
      }

      let access = new SpotAccess($specs, {
        invokeMethod: co.wrap(function * invokeMethod (interfaceName, name, params) {
          return yield socket.call(PERFORM, {
            name, params, interface: interfaceName
          })
        })
      })

      Object.assign(access, {
        disconnect () {
          return co(function * () {
            yield socket.call(LEAVE, { key })
            delete s.accesses[ key ]
          })
        }
      })

      s.accesses[ key ] = access
      s.socket = socket
      let { bundle } = access
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
      let access = s.accesses[ key ]
      if (!access) {
        throw new Error(`Not connected to: ${key}`)
      }
      yield access.disconnect()
      delete s.accesses[ key ]
    })
  }
}

module.exports = SugoTerminal
