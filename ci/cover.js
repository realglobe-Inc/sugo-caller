#!/usr/bin/env node

/**
 * Measure test coverage.
 */

'use strict'

process.chdir(`${__dirname}/..`)

const apeTasking = require('ape-tasking')
const { coverage } = require('amocha')

apeTasking.runTasks('cover', [
  () => amocha('test/*_test.js', {
    dir: 'coverage'
  })
], true)
