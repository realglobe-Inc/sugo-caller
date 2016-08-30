#!/usr/bin/env node

/**
 * Generate docs
 */

'use strict'

process.chdir(`${__dirname}/..`)

const apeTasking = require('ape-tasking')
const co = require('co')
const coz = require('coz')
const { execSync } = require('child_process')
const writeout = require('writeout')

apeTasking.runTasks('build', [
  // Generate jsdoc.json
  () => co(function * () {
    let src = 'lib/*.js lib/**/*.js'
    let dest = 'jsdoc.json'
    let data = execSync(`
    jsdoc ${src} -t templates/haruki -d console -q format=JSON
`)
    data = JSON.stringify(JSON.parse(data), null, 2)
    let result = yield writeout(dest, data, {
      mkdirp: true,
      skipIfIdentical: true
    })
    if (!result.skipped) {
      console.log(`File generated: ${result.filename}`)
    }
  }),
  () => coz.render('doc/**/.*.bud')
], true)
