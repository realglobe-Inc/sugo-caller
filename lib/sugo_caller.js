/**
 * Hub client for caller side.
 * When you connect to remote actor with a caller, it receives specification of the actor and dynamically define function to kick actor side function.
 * With this way you can magically call functions declared on remote as if they were here.
 * @class SugoCaller
 * @augments {SugoClient}
 * @param {Object} config - Caller configuration
 * @param {string} [config.protocol] - Protocol to use ( "http" or "https" )
 * @param {string} [config.host] - Hub host name. ( eg: "localhost:3000" )
 * @param {string} [config.pathname] - Hub URL path name ( eg: "/callers" )
 * @param {Object} [config.auth] - Auth data for hub
 */
'use strict'

const sgSocketClient = require('sg-socket-client')
const { validateInterfaceSpecs } = require('./validators')
const { ReservedEvents, RemoteEvents } = require('sg-socket-constants')
const { JOIN, LEAVE, PERFORM, SPEC, DESPEC, PIPE } = RemoteEvents
const { ERROR } = ReservedEvents

const { ClientTypes } = require('sugo-constants')
const { SugoClient } = require('sugo-client')
const { ActorAccess } = require('./accessing')
const co = require('co')
const assert = require('assert')
const sgQueue = require('sg-queue')
const { parseCallerUrl } = require('./parsing')
const argx = require('argx')
const { parse, format } = require('sg-serializer')
const { CALLER } = ClientTypes
const { authorize } = require('sugo-client-auth')

let _connectQueue = sgQueue()

let injectTypes = (data) => {
  let { payload, meta: types } = format(data)
  return Object.assign(payload, { meta: { types } })
}

/** @lends SugoCaller */
class SugoCaller extends SugoClient {
  constructor (url, config = {}) {
    let args = argx(arguments)
    url = args.shift('string')
    config = args.shift('object') || {}

    if (!url) {
      url = parseCallerUrl(config)
    }

    assert.ok(url, 'URL is required.')
    super()
    const s = this
    let {
      multiplex = true,
      auth = false,
      path = '/socket.io'
    } = config

    Object.assign(s, {
      url, auth, multiplex, path
    })
    s.sockets = {}
    s.accesses = {}

    s.onError = (err) => s.emit(err) || Promise.reject(err)
  }

  /**
   * Connect to actor
   * @param {string} key - Key of actor
   * @param {Object} [options={}] - Optional settings
   * @param {Object} [options.messages=null] - Connect messages
   * @returns {Promise.<ActorAccessBundle>} - Actor accessor
   */
  connect (key, options = {}) {
    const s = this
    let { messages = null } = options
    let doConnect = () => co(function * () {
      if (s.accesses[ key ]) {
        throw new Error(`Already connected to: ${key}`)
      }

      let access = yield s.actorAccess(key, messages)
      s.accesses[ key ] = access

      let { bundle } = access
      Object.assign(bundle, {
        disconnect (messages) {
          return co(function * () {
            let { pipeListeners } = access
            for (let module of Object.keys(pipeListeners)) {
              delete pipeListeners[ module ]
            }
            let socket = s.sockets[ key ]
            yield socket.call(LEAVE, { key, messages })
            delete s.accesses[ key ]
            socket.close()
            yield socket.waitToDisconnect()
            delete s.sockets[ key ]
          })
        }
      })
      return bundle
    }).catch((err) => {
      let socket = s.sockets[ key ]
      if (socket) {
        socket.call(LEAVE, { key })
        socket.close()
      }
      delete s.accesses[ key ]
      delete s.sockets[ key ]
      return Promise.reject(err)
    })

    let { connectQueue } = SugoCaller
    return connectQueue.push(doConnect)
  }

  /**
   * Disconnect from cloud server
   * @param {string} key - Key of actor to connect
   * @param {Object} [options={}] - Optional settings
   * @param {Object} [options.messages=null] - Connect messages
   * @returns {Promise}
   */
  disconnect (key, options = {}) {
    let { messages = null } = options
    const s = this
    return co(function * () {
      if (key) {
        let access = s.accesses[ key ]
        if (!access) {
          throw new Error(`Not connected to: ${key}`)
        }
        yield access.bundle.disconnect(messages)
        delete s.accesses[ key ]
      } else {
        for (let key of Object.keys(s.accesses)) {
          let access = s.accesses[ key ]
          yield access.bundle.disconnect(messages)
        }
        s.accesses = {}
      }
    })
  }

  actorAccess (key, messages) {
    const s = this
    let { auth, url, multiplex, path } = s
    return co(function * () {
      let socket = sgSocketClient(url, { multiplex, path })
      s.sockets[ key ] = socket
      socket.on(ERROR, (err) => {
        socket.close()
        throw err
      })
      if (auth) {
        try {
          yield authorize(socket, auth)
        } catch (err) {
          throw new Error(
            `[SUGO-Caller] Authentication failed: ${err.message} ( url: ${JSON.stringify(url)}, auth: ${JSON.stringify(auth)} )`
          )
        }
      }

      yield socket.waitToConnect()

      let { payload } = yield socket.call(JOIN, { key, messages })
      let { specs } = payload

      let vError = validateInterfaceSpecs(specs)
      if (vError) {
        delete s.sockets[ key ]
        throw vError
      }

      let connector = s.newConnector(key)

      socket.on(PIPE, (piped) => {
        let { pipeListeners } = access
        let listeners = (pipeListeners[ piped.module ] || {})[ piped.event ] || []
        let { data, meta = {} } = piped
        let { types } = meta
        if (types) {
          data = parse(data, types, {})
        }
        for (let listener of listeners) {
          listener(data)
        }
      })
      socket.on(SPEC, ({ name, spec }) => {
        access.registerSpecs({ [name]: spec }, connector)
      })
      socket.on(DESPEC, ({ name }) => {
        access.deregisterSpecs(name)
      })

      let access = new ActorAccess({
        specs,
        connector
      })
      Object.assign(access, { pipeListeners: {} })

      return access
    })
  }

  newConnector (key) {
    const s = this

    return {
      invoke: co.wrap(function * invokeMethod (module, method, params = []) {
        // Format params
        {
          let isFunc = (param) => typeof param === 'function'
          for (let i = 0; i < params.length; i++) {
            let param = params[ i ]
            if (isFunc(param)) {
              console.warn(`[SUGO-Caller] Passing function is not supported. Please check the params passed to ${'`'}${module}.${method}()${'`'}`)
              params[ i ] = Object.assign({}, param)
            }
          }
        }

        let socket = s.sockets[ key ]
        s.assertConnection(key)
        let performData = injectTypes({ key, method, params, module })
        let { payload, meta = {} } = yield socket.call(PERFORM, performData)
        if (meta.types) {
          payload = parse(payload, meta.types)
        }
        return payload
      }),
      fire: co.wrap(function * fireEvent (module, event, data) {
        let socket = s.sockets[ key ]
        s.assertConnection(key)
        let isObject = typeof data === 'object'
        let { payload, meta: types } = isObject ? parse(data) : { payload: data }
        socket.emit(PIPE, { key, event, data: payload, module, meta: { types } })
      }),
      listen: co.wrap(function * registerListener (module, event, listener) {
        let access = s.accesses[ key ]
        s.assertConnection(key)
        let { pipeListeners } = access
        pipeListeners[ module ] = pipeListeners[ module ] || {}
        pipeListeners[ module ][ event ] = (pipeListeners[ module ][ event ] || []).concat(listener)
      }),
      delisten: co.wrap(function * deregisterListener (module, event, listener) {
        let access = s.accesses[ key ]
        s.assertConnection(key)
        let { pipeListeners } = access
        if (!pipeListeners[ module ][ event ]) {
          return
        }
        pipeListeners[ module ][ event ] = pipeListeners[ module ][ event ].filter((filterling) => filterling !== listener)
      })
    }
  }

  assertConnection (key) {
    const s = this
    if (!s.sockets[ key ]) {
      throw new Error('Not connected!!')
    }
  }

  /** @override */
  get clientType () {
    return CALLER
  }

  static get connectQueue () {
    return _connectQueue
  }

  /** @deprecated */
  static urlFromConfig () {
    console.warn('`SugoCaller.urlFromConfig` is now deprecated. Use `SugoCaller.parseCallerUrl` instead')
    return this.parseCallerUrl(...arguments)
  }

  static parseCallerUrl () {
    return parseCallerUrl(...arguments)
  }
}

module.exports = SugoCaller
