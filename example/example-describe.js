#!/usr/bin/env node

/**
 * This is an example to describe a module
 */
'use strict'

const co = require('co')
const sugoCaller = require('sugo-caller')

co(function * () {
  let caller = sugoCaller({ /* ... */ })
  let actor = yield caller.connect('my-actor-01')

  {
    let description = actor.describe('shell')
    console.log(description) // -> { name: 'shell', desc: 'Shell interface', ... }
  }

  /* ... */
}).catch((err) => console.error(err))

