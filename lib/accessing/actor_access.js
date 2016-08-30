/**
 * Access for actors.
 * @class ActorAccess
 */
'use strict'

const co = require('co')
const { EventEmitter } = require('events')
const ActorAccessBundle = require('./actor_access_bundle')

/** @lends ActorAccess */
class ActorAccess {
  constructor ({ specs, connector, validator }) {
    const s = this
    s.bundle = new ActorAccessBundle({ specs, validator })
    s.registerSpecs(specs, connector)
  }

  /**
   * Register module specs.
   * @param {Object} specs - Spec data of actor
   * @param {Object} connector - Connector functions
   */
  registerSpecs (specs, connector) {
    const s = this
    let { bundle } = s
    let moduleNames = Object.keys(specs).sort((a, b) => a.length - b.length)

    // Register as top level
    for (let moduleName of moduleNames) {
      let { methods } = specs[ moduleName ] || {}
      let $invoke = (name, params) => connector.invoke(moduleName, name, params)
      let $fire = (event, data) => connector.fire(moduleName, event, data)
      let $listen = (event, callback) => connector.listen(moduleName, event, callback)
      let $delisten = (event, callback) => connector.delisten(moduleName, event, callback)
      let module = actorAccessModule(methods, {
        $invoke, $fire, $listen, $delisten
      })
      bundle.set(moduleName, module)
    }
    // Register as sub
    for (let moduleName of bundle.names()) {
      let subModuleNames = moduleNames.filter((name) => name.indexOf(`${moduleName}.`) === 0)
      for (let subModuleName of subModuleNames) {
        let as = subModuleName.slice(moduleName.length + 1)
        let subModule = bundle.get(subModuleName)
        let module = bundle.get(moduleName) || {}
        module[ as ] = subModule
        bundle.set(moduleName, module)
      }
    }
  }

  /**
   * De-register module specs.
   * @param {...string} moduleNames - Spec data of actor
   */
  deregisterSpecs (...moduleNames) {
    const s = this
    let { bundle } = s
    // Delete modules
    for (let moduleName of moduleNames) {
      bundle.del(moduleName)
    }
    // Register as sub
    for (let moduleName of bundle.names()) {
      let subModuleNames = moduleNames.filter((name) => name.indexOf(`${moduleName}.`) === 0)
      for (let subModuleName of subModuleNames) {
        let as = subModuleName.slice(moduleName.length + 1)
        let module = bundle.get(moduleName)
        if (module) {
          delete module[ as ]
          bundle.set(moduleName, module)
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
