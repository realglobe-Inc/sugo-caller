#!/usr/bin/env node

/**
 * This is an example to access dynamic property for module
 */
'use strict'

const co = require('co')
const sugoCaller = require('sugo-caller')

co(function * () {
  let caller = sugoCaller({ /* ... */ })
  let actor = yield caller.connect('my-actor-01')

  {
    let location = actor.get('location')

    // Set href attribute on location
    location.herf = 'http://example.com'

    // To wait for async done, you need call internal function directly since there is no way to wait promise with dynamic setter.
    // Dynamic sett has prefix "set$"
    yield location.set$href('http://example.com')

    // Use dynamic setter
    let href = yield location.href
    // Equals
    href = yield location.get$href()
  }

  /* ... */
}).catch((err) => console.error(err))

