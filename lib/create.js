/**
 * Create an terminal instance
 * @function create
 * @returns {Object}
 */
'use strict'

const SugoCaller = require('./sugo_caller')

/** @lends create */
function create (...args) {
  return new SugoCaller(...args)
}

module.exports = create
