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
    const {specs, connector, key, as} = config
    this.bundle = new ActorAccessBundle(specs, {key, as})
    this.registerSpecs(specs, connector)
  }

  /**
   * Register module specs.
   * @param {Object} specs - Spec data of actor
   * @param {Object} connector - Connector functions
   */
  registerSpecs (specs, connector) {
    const {bundle} = this
    const moduleNames = Object.keys(specs).sort((a, b) => a.length - b.length)

    // Register as top level
    for (const moduleName of moduleNames) {
      const {methods} = specs[moduleName] || {}
      const $invoke = (name, params) => connector.invoke(moduleName, name, params)
      const $fire = (event, data) => connector.fire(moduleName, event, data)
      const $listen = (event, callback) => connector.listen(moduleName, event, callback)
      const $delisten = (event, callback) => connector.delisten(moduleName, event, callback)
      const module = actorAccessModule(methods, {
        $invoke, $fire, $listen, $delisten
      })
      bundle.set(moduleName, module)
    }
    // Register as sub
    for (const moduleName of bundle.names()) {
      const subModuleNames = moduleNames.filter((name) => name.indexOf(`${moduleName}.`) === 0)
      for (const subModuleName of subModuleNames) {
        const as = subModuleName.slice(moduleName.length + 1)
        const subModule = bundle.get(subModuleName)
        const module = bundle.get(moduleName) || {}
        module[as] = subModule
        bundle.set(moduleName, module)
      }
    }
  }

  /**
   * De-register module specs.
   * @param {...string} moduleNames - Spec data of actor
   */
  deregisterSpecs (...moduleNames) {
    const {bundle} = this
    // Deconste modules
    for (let moduleName of moduleNames) {
      bundle.del(moduleName)
    }
    // Register as sub
    for (const moduleName of bundle.names()) {
      const subModuleNames = moduleNames.filter((name) => name.indexOf(`${moduleName}.`) === 0)
      for (const subModuleName of subModuleNames) {
        const as = subModuleName.slice(moduleName.length + 1)
        const module = bundle.get(moduleName)
        if (module) {
          delete module[as]
          bundle.set(moduleName, module)
        }
      }
    }
  }
}

module.exports = ActorAccess
