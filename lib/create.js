/**
 * Create a caller instance. Just an alias of `new SugoCaller(config)`
 * @function sugoCaller
 * @param {Object} config - Sugo caller configuration
 * @returns {SugoCaller}
 * @example

co(function * () {
  let caller = sugoCaller({})
  let actor01 = yield caller.connect('my-actor-01')
  let foo = actor01.get('foo') // Get a module of actor
  yield foo.sayYeah() // Call the remote function
}).catch((err) => console.error(err))

 */
'use strict'

const SugoCaller = require('./sugo_caller')

/** @lends sugoCaller */
function sugoCaller (...args) {
  return new SugoCaller(...args)
}

module.exports = sugoCaller
