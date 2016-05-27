/**
 * Create an terminal instance
 * @function create
 * @returns {Object}
 */
'use strict'

const SugoTerminal = require('./sugo_terminal')

/** @lends create */
function create (...args) {
  return new SugoTerminal(...args)
}

module.exports = create
