/**
 * Spot client
 * @class SpotAccess
 */
'use strict'

const co = require('co')
const { EventEmitter } = require('events')

/** @lends SpotAccess */
class SpotAccess {
  constructor (config) {
    let { $specs, $connector } = config
    const s = this
    s.interfaces = {}
    s.methods = {}
    s.registerSpecs($specs, $connector)
    s.bundle = s.newBundle()
  }

  newBundle () {
    const s = this
    let bundle = {}
    for (let interfaceName of Object.keys(s.interfaces || {})) {
      bundle[ interfaceName ] = () => {
        return s.interfaces[ interfaceName ]
      }
    }
    return bundle
  }

  registerSpecs ($specs, $connector) {
    const s = this
    for (let interfaceName of Object.keys($specs)) {
      let { $methods } = $specs[ interfaceName ]
      let $invoke = (name, params) => $connector.invoke(interfaceName, name, params)
      let $fire = (name, params) => $connector.fire(interfaceName, name, params)
      let $listen = (name, params) => $connector.listen(interfaceName, name, params)
      s.interfaces[ interfaceName ] = new SpotAccessInterface($methods, {
        $invoke, $fire, $listen
      })
    }
  }
}

class SpotAccessInterface extends EventEmitter {
  constructor ($methods, props = {}) {
    super()
    const s = this
    for (let name of Object.keys($methods || {})) {
      s[ name ] = co.wrap(function * methodRedirect (...params) {
        return yield s.$invoke(name, params)
      })
    }
    let emit = s.emit.bind(s)
    let on = s.on.bind(s)
    Object.assign(s, props, {
      emit (event, data) {
        s.$fire(event, data)
        return emit.call(s, ...arguments)
      },
      on (event, handler) {
        s.$listen(event, handler)
        return on.call(s, ...arguments)
      }
    })
  }

  $invoke () {
    throw new Error('Not implemented!')
  }

  $fire () {
    throw new Error('Not implemented!')
  }

  $listen () {
    throw new Error('Not implemented!')
  }
}

module.exports = SpotAccess
