#!/usr/bin/env node

/**
 * Generate shim scripts
 */

'use strict'

process.chdir(`${__dirname}/..`)

const apeTasking = require('ape-tasking')
const ababel = require('ababel')

apeTasking.runTasks('browser', [
  () => ababel('**/*.js', {
    cwd: 'lib',
    out: 'shim/browser'
  })
], true)
