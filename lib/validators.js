/**
 * Validator for caller
 * @module validators
 */
'use strict'

const sgValidator = require('sg-validator')
const sgSchemas = require('sg-schemas')

/** @lends validators */
module.exports = Object.assign(exports, {

  /**
   * Validate spec of module
   * @param {Object} specs
   * @returns {?Error} - Found errors
   */
  validateInterfaceSpecs (specs) {
    for (const name of Object.keys(specs)) {
      const errors = sgValidator(sgSchemas.moduleSpec).validate(specs[name])
      if (errors && errors.length > 0) {
        const {dataPath, message} = errors[0]
        return new Error(`[SUGO-Caller] spec "${name} is invalid. ${message} ( dataPath: "${dataPath}" )`)
      }
    }
    return null
  },

  /**
   * Validate spec of module with expected schema
   * @param {Object} $spec - Specs to validate
   * @param {Object} expected - JSON schema for expectation
   */
  validateInterfaceSpecWithExpected ($spec, expected = {}) {
    const errors = sgValidator(expected).validate($spec)
    if (errors && errors.length > 0) {
      const {dataPath, message} = errors[0]
      return new Error(`[SUGO-Caller] Interface "${$spec.name}" is invalid. ${message} ( dataPath: "${dataPath}" )`)
    }
    return null
  }

})
