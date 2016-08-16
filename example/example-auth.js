#!/usr/bin/env node

/**
 * This is an example to use an auth
 * @see https://github.com/realglobe-Inc/sugo-hub#use-authentication
 */
'use strict'

const co = require('co')
const sugoCaller = require('sugo-caller')

co(function * () {
  let caller = sugoCaller({
    protocol: 'https',
    hostname: 'my-sugo-hub.example.com',
    // Auth for hub
    auth: {
      // The structure of this field depends on `authenticate` logic implemented on SUGO-Hub
      token: 'a!09jkl3A'
    }
  })

// Connect to the target actor
  let actor = yield caller.connect('my-actor-01')
  let shell = actor.get('shell') // Get bash interface
  /* ... */
}).catch((err) => console.error(err))

