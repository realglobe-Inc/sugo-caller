#!/usr/bin/env node
/**
 * Prepare asset files
 */
'use strict'

process.chdir(`${__dirname}/..`)


const apeTasking = require('ape-tasking')
const filecopy = require('filecopy')
const path = require('path')
const { images } = require('sugos-assets/lib/paths')

apeTasking.runTasks('assets', [
  async () => {
    for (let name of Object.keys(images)) {
      let filename = images[ name ]
      let result = await filecopy(filename, `assets/images/${path.basename(filename)}`, {
        mkdirp: true,
        force: true
      })
      Object.keys(result).forEach((filename) =>
        console.log(`File generated: ${filename}`)
      )
    }
  }
])
