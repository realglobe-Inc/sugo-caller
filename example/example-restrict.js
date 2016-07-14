#!/usr/bin/env node

/**
 * This is an example to restrict an interface with json schema
 */
'use strict'

const co = require('co')
const sugoTerminal = require('sugo-terminal')

// JSON-Schema for expected spec info
const shellSchemaV2 = {
  type: 'object',
  properties: {
    name: { enum: [ 'shell' ] }, // Should be shell
    version: { pattern: '^2\.' } // Major version must be 2
    /* ... */
  }
}

co(function * () {
  let terminal = sugoTerminal('https://my-sugo-cloud.example.com/terminals', {})
  let spot = yield terminal.connect('my-spot-01')

  let shell
  try {
    shell = spot.shell({
      // Pass a JSON-Schema to validate the interface. Throws an error if invalid
      expect: shellSchemaV2
    })
  } catch (err) {
    console.error('Failed to access!!')
    return
  }
  /* ... */
}).catch((err) => console.error(err))

