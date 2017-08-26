/**
 * Create a caller instance. Just an alias of `new SugoCaller(config)`
 * @function sugoCaller
 * @param {Object} config - Sugo caller configuration
 * @returns {SugoCaller}
 * @example

(async () => {
  const caller = sugoCaller({})
  const actor01 = await caller.connect('my-actor-01')
  const foo = actor01.get('foo') // Get a module of actor
  await foo.sayYeah() // Call the remote function
})().catch((err) => console.error(err))

 */
'use strict'

const SugoCaller = require('./sugo_caller')

/** @lends sugoCaller */
function sugoCaller (...args) {
  return new SugoCaller(...args)
}

module.exports = sugoCaller
