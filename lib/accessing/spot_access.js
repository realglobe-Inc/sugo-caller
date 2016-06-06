/**
 * Spot client
 * @class SpotAccess
 */
'use strict'

const co = require('co')

/** @lends SpotAccess */
class SpotAccess {
  constructor ($specs = {}, props) {
    const s = this
    s.interfaces = {}
    s.methods = {}
    Object.assign(s, props)
    s.registerSpecs($specs)
    s.bundle = s.newBundle()
  }

  invokeMethod () {
    // Should be override
    throw new Error('Not implemented!')
  }

  newBundle () {
    const s = this
    let bundle = {}
    for (let interfaceName of Object.keys(s.interfaces || {})) {
      bundle[ interfaceName ] = () => {
        let interface_ = s.interfaces[ interfaceName ]
        return new Proxy(interface_, {
          get (target, propKey, receiver) {
            return interface_.methods[ propKey ] || target[ propKey ]
          }
        })
      }
    }
    return bundle
  }

  registerSpecs ($specs) {
    const s = this
    let invokeMethod = s.invokeMethod.bind(s)
    for (let interfaceName of Object.keys($specs)) {
      let { $methods } = $specs[ interfaceName ]
      s.interfaces[ interfaceName ] = new SpotAccessInterface($methods, invokeMethod)
    }
  }

}

class SpotAccessInterface {
  constructor ($methods, invoke) {
    const s = this
    let methods = {}
    for (let name of Object.keys($methods || {})) {
      methods[ name ] = co.wrap(function * methodRedirect (...params) {
        return yield invoke(name, params)
      })
    }
    s.methods = methods
  }
}

module.exports = SpotAccess
