/**
 * Caller component of SUGOS.
 * @module sugo-caller
 */

'use strict'

const SugoCaller = require('./sugo_caller')
const create = require('./create')

let lib = create.bind(this)

Object.assign(lib, SugoCaller, {
  create,
  SugoCaller
})

module.exports = lib
