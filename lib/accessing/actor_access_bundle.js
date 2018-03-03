/**
 * Bundle for actor access.
 * This class provides access for loaded modules on actor.
 * @class ActorAccessBundle
 * @param {Object} specs - Actor module specs
 */
'use strict'

const {validateInterfaceSpecWithExpected} = require('../validators')

/** @lends ActorAccessBundle */
class ActorAccessBundle {
  constructor (specs, options = {}) {
    this.modules = {}
    const {key, as} = options
    Object.assign(this, {
      specs,
      key,
      as
    })
  }

  /**
   * Get a module
   * @param {string} moduleName - Name of module
   * @param {Object} [options={}] - Optional settings
   * @returns {ActorAccessModule} - Found module
   */
  get (moduleName, options = {}) {
    const {modules, specs} = this
    const module = modules[moduleName]
    const $spec = specs[moduleName]
    const {expect} = options
    if (expect) {
      let vError = validateInterfaceSpecWithExpected($spec, expect)
      if (vError) {
        throw vError
      }
    }
    if (!module) {
      let knownModuleNames = Object.keys(modules)
      throw new Error(`[SUGO-Caller] Failed to get module "${moduleName}". ( Available modules: ${JSON.stringify(knownModuleNames)} )`)
    }
    return module
  }

  /**
   * Check if module exists
   * @param {string} moduleName - Name of module
   * @returns {Boolean} - Has the module or not
   */
  has (moduleName) {
    let {modules} = this
    return modules.hasOwnProperty(moduleName)
  }

  /**
   * Describe a module
   * @method describe
   * @param {string} moduleName - Name of module
   * @returns {Object} - Module description
   */
  describe (moduleName) {
    let {specs} = this
    return specs[moduleName]
  }

  /**
   * Set module
   * @param {string} moduleName - Name of module
   * @param {ActorAccessModule} module - Module to set
   * @param {Object} [options={}] - Optional settings
   */
  set (moduleName, module, options = {}) {
    this.modules[moduleName] = module
  }

  /**
   * Delete module
   * @param {string} moduleName - Name of module
   */
  del (moduleName) {
    delete this.modules[moduleName]
  }

  /**
   * Get names of modules
   * @returns {Array.<string>}
   */
  names () {
    return Object.keys(this.modules)
  }

}

module.exports = ActorAccessBundle
