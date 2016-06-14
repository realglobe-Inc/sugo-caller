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
  validateInterfaceSpec (specs) {
    for (let name of Object.keys(specs)) {
      let errors = sgValidator(sgSchemas.interfaceSpec).validate(specs[ name ])
      if (errors && errors.length > 0) {
        return new Error(`[SUGO-Terminal] spec "${name} is invalid. ${errors[ 0 ].message}`)
      }
    }
    return null
  }

}

module.exports = TerminalValidator
