/**
 * Parsing modules
 * @module parsing
 */

'use strict'

const d = (module) => module && module.default || module

const parseCallerUrl = d(require('./parse_caller_url'))

module.exports = {
  parseCallerUrl
}
