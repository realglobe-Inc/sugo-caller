/**
 * Spot client
 * @class SpotAccess
 */
'use strict'

const { EventEmitter } = require('events')
const co = require('co')

/** @lends SpotAccess */
class SpotAccess extends EventEmitter {
  constructor ($spec = {}, props) {
    super()
    const s = this
    s.bundle = s.newBundle()
    s.methods = {}
    s.registerSpec($spec)
    Object.assign(s, props)
  }

  invokeMethod () {
    // Should be override
    throw new Error('Not implemented!')
  }

  newBundle () {
    const s = this
    let bundle = {}
    return new Proxy(bundle, {
      get (target, propKey, receiver) {
        return s.getMethod(propKey)
      }
    })
  }

  registerSpec ($spec) {
    const s = this
    let { $methods } = $spec
    for (let name of Object.keys($methods || {})) {
      let { $params } = $methods[ name ]
      s.methods[ name ] = co.wrap(function * methodRedirect (...args) {
        s.emit('method', { name, args })
      })
    }
  }

  getMethod (name) {
    const s = this
    let { $spec } = s
    let method = s.methods[ name ]
    if (!method) {
      throw new Error(`Unknown method: ${name}`)
    }
    return method
  }

  off (event, handler) {
    const s = this
    return s.removeListener(...arguments)
  }

}

module.exports = SpotAccess
