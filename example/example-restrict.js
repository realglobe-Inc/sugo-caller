#!/usr/bin/env node

/**
 * This is an example to restrict a module with json schema
 */
'use strict'

const sugoCaller = require('sugo-caller')

// JSON-Schema for expected spec info
const shellSchemaV2 = {
  type: 'object',
  properties: {
    name: { enum: [ 'shell' ] }, // Should be shell
    version: { pattern: '^2\.' } // Major version must be 2
    /* ... */
  }
}

async function tryRestrictExample () {
  let caller = sugoCaller({ /* ... */ })
  let actor = await caller.connect('my-actor-01')

  let shell
  try {
    shell = actor.get('shell', {
      // Pass a JSON-Schema to validate the module. Throws an error if invalid
      expect: shellSchemaV2
    })
  } catch (err) {
    console.error('Failed to access!!')
  }
  /* ... */
}

tryRestrictExample().catch((err) => console.error(err))

