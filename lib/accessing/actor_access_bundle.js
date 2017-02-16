/**
 * Bundle for actor access.
 * This class provides access for loaded modules on actor.
 * @class ActorAccessBundle
 * @param {Object} specs - Actor module specs
 */
'use strict'

const { validateInterfaceSpecWithExpected } = require('../validators')

/** @lends ActorAccessBundle */
class ActorAccessBundle {
  constructor (specs) {
    const s = this
    s.modules = {}
    Object.assign(s, {
      specs
    })
  }

  /**
   * Get a module
   * @param {string} moduleName - Name of module
   * @param {Object} [options={}] - Optional settings
   * @returns {ActorAccessModule} - Found module
   */
  get (moduleName, options = {}) {
    const s = this
    let { modules, specs } = s
    let module = modules[ moduleName ]
    let $spec = specs[ moduleName ]
    let { expect } = options
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
    const s = this
    let { modules } = s
    return modules.hasOwnProperty(moduleName)
  }

  /**
   * Describe a module
   * @method describe
   * @param {string} moduleName - Name of module
   * @returns {Object} - Module description
   */
  describe (moduleName) {
    const s = this
    let { specs } = s
    return specs[ moduleName ]
  }

  /**
   * Set module
   * @param {string} moduleName - Name of module
   * @param {ActorAccessModule} module - Module to set
   * @param {Object} [options={}] - Optional settings
   */
  set (moduleName, module, options = {}) {
    const s = this
    s.modules[ moduleName ] = module
  }

  /**
   * Delete module
   * @param {string} moduleName - Name of module
   */
  del (moduleName) {
    const s = this
    delete s.modules[ moduleName ]
  }

  /**
   * Get names of modules
   * @returns {Array.<string>}
   */
  names () {
    const s = this
    return Object.keys(s.modules)
  }

}

module.exports = ActorAccessBundle
