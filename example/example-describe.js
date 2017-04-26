#!/usr/bin/env node

/**
 * This is an example to describe a module
 */
'use strict'

const sugoCaller = require('sugo-caller')

async function tryDescribeExample () {
  let caller = sugoCaller({ /* ... */ })
  let actor = await caller.connect('my-actor-01')

  {
    let description = actor.describe('shell')
    console.log(description) // -> { name: 'shell', desc: 'Shell interface', ... }
  }

  /* ... */
}

tryDescribeExample().catch((err) => console.error(err))

