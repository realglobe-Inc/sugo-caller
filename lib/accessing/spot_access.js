/**
 * Spot client
 * @class SpotAccess
 */
'use strict'

const co = require('co')
const { EventEmitter } = require('events')

/** @lends SpotAccess */
class SpotAccess {
  constructor (config) {
    let { $specs, $connector } = config
    const s = this
    s.interfaces = {}
    s.methods = {}
    s.registerSpecs($specs, $connector)
    s.bundle = s.newBundle()
  }

  /**
   * Create a new bundle.
   * @returns {Object}
   */
  newBundle () {
    const s = this
    let bundle = {}
    for (let interfaceName of Object.keys(s.interfaces || {})) {
      bundle[ interfaceName ] = () => {
        return s.interfaces[ interfaceName ]
      }
    }
    return bundle
  }

  /**
   * Register interface specs.
   * @param {Object} $specs - Spec data of spot
   * @param {Object} $connector - Connector functions
   */
  registerSpecs ($specs, $connector) {
    const s = this
    for (let interfaceName of Object.keys($specs)) {
      let { $methods } = $specs[ interfaceName ]
      let $invoke = (name, params) => $connector.invoke(interfaceName, name, params)
      let $fire = (event, data) => $connector.fire(interfaceName, event, data)
      let $listen = (event, callback) => $connector.listen(interfaceName, event, callback)
      s.interfaces[ interfaceName ] = new SpotAccessInterface($methods, {
        $invoke, $fire, $listen
      })
    }
  }
}

/**
 * Interface of spot access
 */
class SpotAccessInterface extends EventEmitter {
  constructor ($methods, props = {}) {
    super()
    const s = this
    for (let name of Object.keys($methods || {})) {
      s[ name ] = co.wrap(function * methodRedirect (...params) {
        return yield s.$invoke(name, params)
      })
    }
    let emit = s.emit.bind(s)
    let on = s.on.bind(s)
    Object.assign(s, props, {
      emit (event, data) {
        s.$fire(event, data)
        return emit.call(s, ...arguments)
      },
      on (event, handler) {
        s.$listen(event, handler)
        return on.call(s, ...arguments)
      }
    })
  }

  /**
   * Invoke a command for interface.
   * Should be overridden.
   * @abstract
   */
  $invoke (name, params) {
    throw new Error('Not implemented!')
  }

  /**
   * Fire an event
   * Should be overridden.
   * @abstract
   */
  $fire (event, data) {
    throw new Error('Not implemented!')
  }

  /**
   * Listen to a event.
   * Should be overridden.
   * @abstract
   */
  $listen (event, callback) {
    throw new Error('Not implemented!')
  }
}

module.exports = SpotAccess
