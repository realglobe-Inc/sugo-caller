/**
 * Access to actor module
 * @class ActorAccess
 */
'use strict'

const co = require('co')
const { EventEmitter } = require('events')

/** @lends ActorAccess */
class ActorAccess {
  constructor (config) {
    let { specs, connector, validator } = config
    const s = this
    s.modules = {}
    s.methods = {}
    s.registerSpecs(specs, connector)
    s.bundle = s.newBundle(specs, validator)
  }

  /**
   * Create a new bundle.
   * @param {Object} specs - Spec data of spot
   * @param {Object} validator - A caller validator
   * @returns {Object}
   */
  newBundle (specs, validator) {
    const s = this
    let bundle = {}
    for (let moduleName of Object.keys(s.modules || {})) {
      bundle[ moduleName ] = function accessToModule (options = {}) {
        let interface_ = s.modules[ moduleName ]
        let $spec = specs[ moduleName ]
        let { expect } = options
        if (expect) {
          let vError = validator.validateInterfaceSpecWithExpected($spec, expect)
          if (vError) {
            throw vError
          }
        }
        return interface_
      }
    }
    return bundle
  }

  /**
   * Register interface specs.
   * @param {Object} specs - Spec data of spot
   * @param {Object} connector - Connector functions
   */
  registerSpecs (specs, connector) {
    const s = this
    for (let moduleName of Object.keys(specs)) {
      let { methods } = specs[ moduleName ]
      let $invoke = (name, params) => connector.invoke(moduleName, name, params)
      let $fire = (event, data) => connector.fire(moduleName, event, data)
      let $listen = (event, callback) => connector.listen(moduleName, event, callback)
      s.modules[ moduleName ] = new ActorAccessInterface(methods, {
        $invoke, $fire, $listen
      })
    }
  }
}

/**
 * Interface of spot access
 */
class ActorAccessInterface extends EventEmitter {
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
   * Listen to an event.
   * Should be overridden.
   * @abstract
   */
  $listen (event, callback) {
    throw new Error('Not implemented!')
  }
}

module.exports = ActorAccess
