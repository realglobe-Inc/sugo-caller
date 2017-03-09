/**
 * Loaded module for an actor.
 * This class provides pseudo interfaces for remote actor module
 * @class ActorAccessModule
 * @param {Object} methods - Actor specifications for module methods
 * @param {Object} connection - Actor connections
 *
 */
/**
 * Create a module no actor access
 * @function actorAccessModule
 * @param {Object} methods - Module methods
 * @param {Object} connection - Hub connection
 * @param {Object} [options={}] - Optional settings
 * @return {Object} Defined module
 */
'use strict'

const co = require('co')
const { EventEmitter } = require('events')

const MethodsToInherit = [
  'listeners',
  'listenerCount',
  'setMaxListeners',
  'getMaxListeners',
  'eventNames'
]

/** @lends actorAccessModule */
function actorAccessModule (methods, connection, options = {}) {
  const getterPrefix = /^get\$/
  const setterPrefix = /^set\$/

  let { prependedParams = [] } = options

  let emitter = new EventEmitter()
  const module = function callDefault (...args) {
    return module.default(...args)
  }

  /**
   * Create a new module with prepended params
   * @param {...*} prependedParams - Params to prepend for each invocation
   * @returns {Object} Defined module
   */
  module.with = function moduleWithPrependParams (...prependedParams) {
    return actorAccessModule(methods, connection, { prependedParams })
  }

  let { $invoke, $fire, $listen, $delisten } = connection

  // Define methods
  {
    let names = Object.keys(methods || {})
    let dynamicProps = {}
    for (let name of names) {
      module[ name ] = co.wrap(function * methodRedirect (...params) {
        return yield $invoke(name, [ ...prependedParams ].concat(params))
      })
      if (getterPrefix.test(name)) {
        let dynamicName = name.replace(getterPrefix, '')
        dynamicProps[ dynamicName ] = Object.assign({
          get: module[ name ]
        }, dynamicProps[ dynamicName ])
      }
      if (setterPrefix.test(name)) {
        let dynamicName = name.replace(setterPrefix, '')
        dynamicProps[ dynamicName ] = Object.assign({
          set: module[ name ]
        }, dynamicProps[ dynamicName ])
      }
    }
    Object.defineProperties(module, Object.assign({}, dynamicProps))
  }

  Object.assign(module,
    /** @lends ActorAccessModule.prototype */
    {
      emit (event, data) {
        $fire(event, data)
        return emitter.emit(...arguments)
      },
      on (event, listener) {
        return module.addListener(...arguments)
      },
      off (event, listener) {
        return module.removeListener(...arguments)
      },
      addListener (event, listener) {
        $listen(event, listener)
        return emitter.addListener(...arguments)
      },
      removeListener (event, listener) {
        $delisten(event, listener)
        return emitter.removeListener(...arguments)
      },
      removeAllListeners (event) {
        for (let listener of module.listeners(event)) {
          $delisten(event, listener)
        }
        return emitter.removeAllListeners(...arguments)
      },
      once (event, listener) {
        let listenerWrap = (...args) => {
          listener(...args)
          module.off(event, listenerWrap)
        }
        return module.on(event, listenerWrap)
      }
    })
  for (let inherit of MethodsToInherit) {
    if (emitter[ inherit ]) {
      module[ inherit ] = emitter[ inherit ].bind(emitter)
    } else {
      module[ inherit ] = () => {
        throw new Error(`${inherit} is not supported!`)
      }
    }
  }
  return module
}

module.exports = actorAccessModule
