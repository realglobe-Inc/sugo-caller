/**
 * Create a caller instance. This is just an alias of `new SugoCaller(config)`
 * @function sugoCaller
 * @param {Object} config - Sugo caller configuration
 * @returns {SugoCaller}
 */
'use strict'

const SugoCaller = require('./sugo_caller')

/** @lends sugoCaller */
function sugoCaller (...args) {
  return new SugoCaller(...args)
}

module.exports = sugoCaller
