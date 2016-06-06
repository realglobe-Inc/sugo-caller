/**
 * @class SugoTerminal
 */
'use strict'

const sgSocketClient = require('sg-socket-client')
const { EventEmitter } = require('events')
const { RemoteEvents } = require('sg-socket-constants')
const { JOIN, LEAVE } = RemoteEvents

const SpotAccess = require('./accessing/spot_access')
const co = require('co')
class SugoTerminal extends EventEmitter {
  constructor (url, config = {}) {
    super()
    const s = this
    s.url = url
    s.socket = null

    s.accesses = {}
  }

  /**
   * Connect to spot
   * @param {string} key - Key of spot
   * @returns {Promise.<Object>} - Spot accessor
   */
  connect (key) {
    const s = this
    return co(function * () {
      let { $spec } = yield s.call(JOIN, { key })
      if (s.accesses[ key ]) {
        throw new Error(`Already connected to: ${key}`)
      }

      let access = new SpotAccess($spec, {
        
      })
      let invokeMethod = (data) => {
        let { name, args } = data
        console.log('name', name, args)
      }

      access.on('method', invokeMethod)

      Object.assign(access, {
        disconnect () {
          return co(function * () {
            yield s.call(LEAVE, { key })
            access.off('method', invokeMethod)
            delete s.accesses[ key ]
          })
        }
      })

      s.accesses[ key ] = access

      return access
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
    })
  }
}

module.exports = SugoTerminal
