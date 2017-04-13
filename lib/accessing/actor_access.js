/**
 * Access for actors.
 * @class ActorAccess
 * @param {Object} config - Actor access configuration
 * @param {Object} config.specs - Actor module specs
 * @param {Object} config.connector - Hub server connector
 */
'use strict'

const ActorAccessBundle = require('./actor_access_bundle')
const actorAccessModule = require('./actor_access_module')

/** @lends ActorAccess */
class ActorAccess {
  constructor (config) {
    let { specs, connector, key, as } = config
    const s = this
    s.bundle = new ActorAccessBundle(specs, { key, as })
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

module.exports = ActorAccess
