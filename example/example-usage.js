#!/usr/bin/env node

/**
 * This is an example to use caller to connect remote actor
 */
'use strict'

const co = require('co')
const sugoCaller = require('sugo-caller')

const CLOUD_URL = 'https://my-sugo-cloud.example.com/callers'
const TARGET_ACTOR_ID = 'my-actor-01'

co(function * () {
  let caller = sugoCaller(CLOUD_URL, {})

// Connect to the target actor
  let actor = yield caller.connect(TARGET_ACTOR_ID)
  let shell = actor.get('shell') // Get bash interface

  // Trigger ls command on remote actor
  {
    let lsResult = yield shell.exec('ls -la /opt/shared')
    console.log(lsResult)
  }

  // Pipe std out
  {
    let out = (chunk) => process.stdout.write(chunk)
    shell.on('stdout', out)
    yield shell.spawn('tail -f /var/log/app.log') // Trigger tailing without blocking
    yield new Promise((resolve) => setTimeout(() => resolve(), 3000)) // Block for duration
    shell.off('stdout', out)
  }

  // Exec reboot command
  yield shell.exec('reboot')
}).catch((err) => console.error(err))

