#!/usr/bin/env node

/**
 * This is an example to access dynamic property for module
 */
'use strict'

const sugoCaller = require('sugo-caller')

async function tryDynamicExample () {
  let caller = sugoCaller({ /* ... */ })
  let actor = await caller.connect('my-actor-01')

  {
    let location = actor.get('location')

    // Set href attribute on location
    location.herf = 'http://example.com'

    // To wait for async done, you need call internal function directly since there is no way to wait promise with dynamic setter.
    // Dynamic sett has prefix "set$"
    await location.set$href('http://example.com')

    // Use dynamic setter
    let href = await location.href
    // Equals
    href = await location.get$href()
  }

  /* ... */
}

tryDynamicExample().catch((err) => console.error(err))

