#!/usr/bin/env node

/**
 * This is an example to restrict an interface with json schema
 */
'use strict'

const co = require('co')
const sugoTerminal = require('sugo-terminal')

const CLOUD_URL = 'my-sugo-cloud.example.com/terminals'
const TARGET_SPOT_ID = 'my-spot-01'

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
  let terminal = sugoTerminal(CLOUD_URL, {})

 // Connect to the target spot
  let spot = yield terminal.connect(TARGET_SPOT_ID)
  let shell
  try {
    shell = spot.shell({
      // Pass a JSON-Schema to validate the interface
      expect: shellSchemaV2
    })
  } catch (err) {
    console.error('Failed to access!!')
    return
  }
  /* ... */
}).catch((err) => console.error(err))

