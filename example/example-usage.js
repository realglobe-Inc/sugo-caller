#!/usr/bin/env node

/**
 * This is an example to use caller to connect remote actor
 */
'use strict'

const sugoCaller = require('sugo-caller')

const TARGET_ACTOR_ID = 'my-actor-01'

async function tryExample () {
  let caller = sugoCaller({
    protocol: 'https',
    hostname: 'my-sugo-hub.example.com'
  })

// Connect to the target actor
  let actor = await caller.connect(TARGET_ACTOR_ID)
  let shell = actor.get('shell') // Get bash interface

  // Trigger ls command on remote actor
  {
    let lsResult = await shell.exec('ls -la /opt/shared')
    console.log(lsResult)
  }

  // Pipe std out
  {
    let out = (chunk) => process.stdout.write(chunk)
    shell.on('stdout', out)
    await shell.spawn('tail -f /var/log/app.log') // Trigger tailing without blocking
    await new Promise((resolve) => setTimeout(() => resolve(), 3000)) // Block for duration
    shell.off('stdout', out)
  }

  // Exec reboot command
  await shell.exec('reboot')
}

tryExample().catch((err) => console.error(err))

