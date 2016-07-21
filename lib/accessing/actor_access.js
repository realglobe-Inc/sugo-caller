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

    let bundle = {
      get: getModule,
      has: hasModule,
      // TODO remove
      module (...args) {
        console.warn('[SUGO-Caller] `.module(name)` is now deprecated. Use `.get(name)` instead')
        return getModule(...args)
      }
    }
    for (let moduleName of Object.keys(s.modules || {})) {
      // TODO remove 
      bundle[ moduleName ] = function accessToModule (options = {}) {
        console.warn(`[SUGO-Caller] Dynamic module access is now deprecated. Use ${'`'}.get('${moduleName}')${'`'} instead.`)
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
      let $delisten = (event, callback) => connector.delisten(moduleName, event, callback)
      s.modules[ moduleName ] = new ActorAccessModule(methods, {
        $invoke, $fire, $listen, $delisten
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
    let { emit, addListener, removeListener, removeAllListeners } = s
    Object.assign(s, props, {
      emit (event, data) {
        s.$fire(event, data)
        return emit.call(s, ...arguments)
      },
      on (event, listener) {
        return s.addListener(...arguments)
      },
      off (event, listener) {
        return s.removeListener(...arguments)
      },
      addListener (event, listener) {
        s.$listen(event, listener)
        return addListener.call(s, ...arguments)
      },
      removeListener (event, listener) {
        s.$delisten(event, listener)
        return removeListener.call(s, ...arguments)
      },
      removeAllListeners (event) {
        for (let listener of s.listeners(event)) {
          s.$delisten(event, listener)
        }
        return removeAllListeners.call(s, ...arguments)
      },
      once (event, listener) {
        let listenerWrap = (...args) => {
          listener(...args)
          s.off(event, listenerWrap())
        }
        return s.on(event, listenerWrap)
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

  /**
   * De listen to an event.
   * Should be overridden.
   * @abstract
   */
  $delisten (event, callback) {
    throw new Error('Not implemented!')
  }
}

module.exports = ActorAccess
