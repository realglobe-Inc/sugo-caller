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

const {EventEmitter} = require('events')

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

  const {prependedParams = []} = options

  const emitter = new EventEmitter()
  const module = function callDefault (...args) {
    return module.default(...args)
  }

  /**
   * Create a new module with prepended params
   * @param {...*} prependedParams - Params to prepend for each invocation
   * @returns {Object} Defined module
   */
  module.with = function moduleWithPrependParams (...prependedParams) {
    return actorAccessModule(methods, connection, {prependedParams})
  }

  const {$invoke, $fire, $listen, $delisten} = connection

  // Define methods
  {
    const names = Object.keys(methods || {})
    const dynamicProps = {}
    for (const name of names) {
      module[name] = async function methodRedirect (...params) {
        return await $invoke(name, [...prependedParams].concat(params))
      }
      if (getterPrefix.test(name)) {
        const dynamicName = name.replace(getterPrefix, '')
        dynamicProps[dynamicName] = Object.assign({
          get: module[name]
        }, dynamicProps[dynamicName])
      }
      if (setterPrefix.test(name)) {
        const dynamicName = name.replace(setterPrefix, '')
        dynamicProps[dynamicName] = Object.assign({
          set: module[name]
        }, dynamicProps[dynamicName])
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
        for (const listener of module.listeners(event)) {
          $delisten(event, listener)
        }
        return emitter.removeAllListeners(...arguments)
      },
      once (event, listener) {
        const listenerWrap = (...args) => {
          listener(...args)
          module.off(event, listenerWrap)
        }
        return module.on(event, listenerWrap)
      }
    })
  for (const inherit of MethodsToInherit) {
    if (emitter[inherit]) {
      module[inherit] = emitter[inherit].bind(emitter)
    } else {
      module[inherit] = () => {
        throw new Error(`${inherit} is not supported!`)
      }
    }
  }
  return module
}

module.exports = actorAccessModule
