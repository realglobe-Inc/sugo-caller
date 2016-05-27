/**
 * 
 * @module sugo-terminal
 */

'use strict'

const SugoTerminal = require('./sugo_terminal')
const create = require('./create')

let lib = create.bind(this)

Object.assign(lib, SugoTerminal, {
  create,
  SugoTerminal
})

module.exports = lib
