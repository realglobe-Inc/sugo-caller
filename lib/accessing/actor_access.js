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
   * @param {Object} specs - Spec data of actor
   * @param {Object} validator - A caller validator
   * @returns {Object}
   */
  newBundle (specs, validator) {
    const s = this

    function getModule (moduleName, options = {}) {
      let module = s.modules[ moduleName ]
      let $spec = specs[ moduleName ]
      let { expect } = options
      if (expect) {
        let vError = validator.validateInterfaceSpecWithExpected($spec, expect)
        if (vError) {
          throw vError
        }
      }
      if (!moduleName) {
        throw new Error(`Unknown module: "${moduleName}`)
      }
      return module
    }

    function hasModule (moduleName) {
      return s.modules.hasOwnProperty(moduleName)
    }

    let bundle = { module: getModule, has: hasModule }
    for (let moduleName of Object.keys(s.modules || {})) {
      bundle[ moduleName ] = function accessToModule (options = {}) {
        console.warn(`[SUGO-Caller] Dynamic module access is now deprecated. Use ${'`'}.module('${moduleName}')${'`'} instead.`)
        return getModule(moduleName, options)
      }
    }
    return bundle
  }

  /**
   * Register module specs.
   * @param {Object} specs - Spec data of actor
   * @param {Object} connector - Connector functions
   */
  registerSpecs (specs, connector) {
    const s = this
    for (let moduleName of Object.keys(specs)) {
      let { methods } = specs[ moduleName ]
      let $invoke = (name, params) => connector.invoke(moduleName, name, params)
      let $fire = (event, data) => connector.fire(moduleName, event, data)
      let $listen = (event, callback) => connector.listen(moduleName, event, callback)
      s.modules[ moduleName ] = new ActorAccessModule(methods, {
        $invoke, $fire, $listen
      })
    }
  }
}

/**
 * Interface of actor access
 */
class ActorAccessModule extends EventEmitter {
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
   * Invoke a command for module.
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
