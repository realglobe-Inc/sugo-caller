/**
 * Validator for terminal
 * @class TerminalValidator
 */
'use strict'

const sgValidator = require('sg-validator')
const sgSchemas = require('sg-schemas')

/** @lends spotValidator */
class TerminalValidator {
  constructor () {
    const s = this
  }

  /**
   * Validate spec of interface
   * @param {Object} specs
   * @returns {?Error} - Found errors
   */
  validateInterfaceSpecs (specs) {
    for (let name of Object.keys(specs)) {
      let errors = sgValidator(sgSchemas.interfaceSpec).validate(specs[ name ])
      if (errors && errors.length > 0) {
        let { dataPath, message } = errors[ 0 ]
        return new Error(`[SUGO-Terminal] spec "${name} is invalid. ${message} ( dataPath: "${dataPath}" )`)
      }
    }
    return null
  }

  /**
   * Validate spec of interface with expected schema
   * @param {Object} $spec - Specs to validate
   * @param {Object} expected - JSON schema for expectation
   */
  validateInterfaceSpecWithExpected ($spec, expected = {}) {
    let errors = sgValidator(expected).validate($spec)
    if (errors && errors.length > 0) {
      let { dataPath, message } = errors[ 0 ]
      return new Error(`[SUGO-Terminal] Interface "${$spec.name}" is invalid. ${message} ( dataPath: "${dataPath}" )`)
    }
    return null
  }

}

module.exports = TerminalValidator
