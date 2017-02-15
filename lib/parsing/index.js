/**
 * Parsing modules
 * @module parsing
 */

'use strict'

let d = (module) => module && module.default || module

module.exports = {
  get parseCallerUrl () { return d(require('./parse_caller_url')) }
}
