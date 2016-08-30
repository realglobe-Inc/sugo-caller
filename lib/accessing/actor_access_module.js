/**
 * Create a module no actor access
 * @param {Object} methods - Module methods
 * @param {Object} connection - Hub connection
 * @return {Object} - Defined module
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
function actorAccessModule (methods, connection) {
  const getterPrefix = /^get\$/
  const setterPrefix = /^set\$/

  let emitter = new EventEmitter()
  const module = function callDefault (...args) {
    return module.default(...args)
  }
  let { $invoke, $fire, $listen, $delisten } = connection

  // Define methods
  {
    let names = Object.keys(methods || {})
    let dynamicProps = {}
    for (let name of names) {
      module[ name ] = co.wrap(function * methodRedirect (...params) {
        return yield $invoke(name, params)
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

  Object.assign(module, {
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
        module.off(event, listenerWrap())
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