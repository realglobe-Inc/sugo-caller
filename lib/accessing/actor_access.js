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
      /**
       * Get a module
       * @method get
       * @param {string} name - Name of module
       * @returns {Module} - Found module
       */
      get: getModule,
      /**
       * Check if module exists
       * @method has
       * @param {string} name - Name of module
       * @returns {Boolean} - Has the module or not
       */
      has: hasModule,
      /**
       * Describe a module
       * @method describe
       * @param {string} name - Name of module
       * @returns {Object} - Module description
       */
      describe (name) {
        return specs[ name ]
      },
      /** @deprecated */
      module (...args) {
        console.warn('[SUGO-Caller] `.module(name)` is now deprecated. Use `.get(name)` instead')
        return getModule(...args)
      }
    }
    for (let moduleName of Object.keys(s.modules || {})) {
      /** @deprecated */
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
    let moduleNames = Object.keys(specs).sort((a, b) => a.length - b.length)

    // Register as top level
    for (let moduleName of moduleNames) {
      let { methods } = specs[ moduleName ] || {}
      let $invoke = (name, params) => connector.invoke(moduleName, name, params)
      let $fire = (event, data) => connector.fire(moduleName, event, data)
      let $listen = (event, callback) => connector.listen(moduleName, event, callback)
      let $delisten = (event, callback) => connector.delisten(moduleName, event, callback)
      s.modules[ moduleName ] = actorAccessModule(methods, {
        $invoke, $fire, $listen, $delisten
      })
    }
    // Register as sub
    for (let moduleName of Object.keys(s.modules || {})) {
      let subModuleNames = moduleNames.filter((name) => name.indexOf(`${moduleName}.`) === 0)
      for (let subModuleName of subModuleNames) {
        let as = subModuleName.slice(moduleName.length + 1)
        s.modules[ moduleName ] = s.modules[ moduleName ] || {}
        s.modules[ moduleName ][ as ] = s.modules[ subModuleName ]
      }
    }
  }

  /**
   * De-register module specs.
   * @param {...string} moduleNames - Spec data of actor
   */
  deregisterSpecs (...moduleNames) {
    const s = this
    // Delete modules
    for (let subModuleNames of moduleNames) {
      delete s.modules[ subModuleNames ]
    }
    // Register as sub
    for (let moduleName of Object.keys(s.modules || {})) {
      let subModuleNames = moduleNames.filter((name) => name.indexOf(`${moduleName}.`) === 0)
      for (let subModuleName of subModuleNames) {
        let as = subModuleName.slice(moduleName.length + 1)
        if (s.modules[ moduleName ]) {
          delete s.modules[ moduleName ][ as ]
        }
      }
    }
  }
}

/**
 * Create a module no actor access
 * @param {Object} methods - Module methods
 * @param {Object} connection - Hub connection
 * @return {Object} - Defined module
 */
function actorAccessModule (methods, connection) {
  const getterPrefix = /^get\$/
  const setterPrefix = /^set\$/

  let emitter = new EventEmitter()
  const module = function callDefault (...args) {
    return module.default(...args)
  }
  let { $invoke, $fire, $listen, $delisten } = connection

  // Define methods
  {
    let names = Object.keys(methods || {})
    let dynamicProps = {}
    for (let name of names) {
      module[ name ] = co.wrap(function * methodRedirect (...params) {
        return yield $invoke(name, params)
      })
      if (getterPrefix.test(name)) {
        let dynamicName = name.replace(getterPrefix, '')
        dynamicProps[ dynamicName ] = Object.assign({
          get: module[ name ]
        }, dynamicProps[ dynamicName ])
      }
      if (setterPrefix.test(name)) {
        let dynamicName = name.replace(setterPrefix, '')
        dynamicProps[ dynamicName ] = Object.assign({
          set: module[ name ]
        }, dynamicProps[ dynamicName ])
      }
    }
    Object.defineProperties(module, Object.assign({}, dynamicProps))
  }

  Object.assign(module, {
    emit (event, data) {
      $fire(event, data)
      return emitter.emit(...arguments)
    },
    on (event, listener) {
      return module.addListener(...arguments)
    },
    off (event, listener) {
      return module.removeListener(...arguments)
    },
    addListener (event, listener) {
      $listen(event, listener)
      return emitter.addListener(...arguments)
    },
    removeListener (event, listener) {
      $delisten(event, listener)
      return emitter.removeListener(...arguments)
    },
    removeAllListeners (event) {
      for (let listener of module.listeners(event)) {
        $delisten(event, listener)
      }
      return emitter.removeAllListeners(...arguments)
    },
    once (event, listener) {
      let listenerWrap = (...args) => {
        listener(...args)
        module.off(event, listenerWrap())
      }
      return module.on(event, listenerWrap)
    }
  })
  let inherits = [
    'listeners',
    'listenerCount',
    'setMaxListeners',
    'getMaxListeners',
    'eventNames'
  ]
  for (let inherit of inherits) {
    if (emitter[ inherit ]) {
      module[ inherit ] = emitter[ inherit ].bind(emitter)
    } else {
      module[ inherit ] = () => {
        throw new Error(`${inherit} is not supported!`)
      }
    }
  }
  return module
}

module.exports = ActorAccess
