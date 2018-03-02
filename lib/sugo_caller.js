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
const {validateInterfaceSpecs} = require('./validators')
const {ReservedEvents, RemoteEvents, AcknowledgeStatus} = require('sg-socket-constants')
const {JOIN, LEAVE, PERFORM, SPEC, DESPEC, PIPE, RESULT} = RemoteEvents
const {ERROR} = ReservedEvents
const {ClientTypes, PipeLevels} = require('sugo-constants')
const {ACTOR_LEVEL, MODULE_LEVEL} = PipeLevels
const {SugoClient} = require('sugo-client/shim/browser')
const {ActorAccess} = require('./accessing')

const assert = require('assert')
const sgQueue = require('sg-queue')
const {parseCallerUrl} = require('./parsing')
const argx = require('argx')
const {parse, format} = require('sg-serializer')
const {CALLER} = ClientTypes
const {authorize} = require('sugo-client-auth')

const _connectQueue = sgQueue()

const injectTypes = (data) => {
  const {payload, meta: types} = format(data)
  return Object.assign(payload, {meta: {types}})
}

/** @lends SugoCaller */
class SugoCaller extends SugoClient {
  constructor (url, config = {}) {
    const args = argx(arguments)
    url = args.shift('string')
    config = args.shift('object') || {}

    if (!url) {
      url = parseCallerUrl(config)
    }

    assert.ok(url, 'URL is required.')
    super()
    const s = this
    const {
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
  async connect (key, options = {}) {
    const {messages = null} = options
    const doConnect = async () => {
      if (this.accesses[key]) {
        throw new Error(`Already connected to: ${key}`)
      }
      let access
      try {
        access = await this.actorAccess(key, messages)
      } catch (err) {
        const socket = this.sockets[key]
        if (socket) {
          socket.call(LEAVE, {key})
          socket.close()
        }
        delete this.accesses[key]
        delete this.sockets[key]
        if (typeof err === 'string') {
          err = new Error(err)
        }
        throw err
      }
      this.accesses[key] = access

      const {bundle, actorPipeListeners} = access
      Object.assign(bundle, {
        on (event, listener) {
          actorPipeListeners[event] = (actorPipeListeners[event] || []).concat(listener)
        },
        off (event, listener) {
          actorPipeListeners[event] = (actorPipeListeners[event] || []).filter((filtering) => filtering !== listener)
        },
        async disconnect (messages) {
          let {modulePipeListeners} = access
          for (let module of Object.keys(modulePipeListeners)) {
            delete modulePipeListeners[module]
          }
          let socket = this.sockets[key]
          await socket.call(LEAVE, {key, messages})
          delete this.accesses[key]
          socket.close()
          await socket.waitToDisconnect()
          delete this.sockets[key]
        }
      })
      return bundle
    }

    const {connectQueue} = SugoCaller
    return connectQueue.push(doConnect)
  }

  /**
   * Disconnect from cloud server
   * @param {string} key - Key of actor to connect
   * @param {Object} [options={}] - Optional settings
   * @param {Object} [options.messages=null] - Disconnect messages
   * @returns {Promise}
   */
  async disconnect (key, options = {}) {
    const {messages = null} = options
    const s = this
    if (key) {
      const access = s.accesses[key]
      if (!access) {
        throw new Error(`Not connected to: ${key}`)
      }
      await access.bundle.disconnect(messages)
      delete s.accesses[key]
    } else {
      for (const key of Object.keys(s.accesses)) {
        const access = s.accesses[key]
        await access.bundle.disconnect(messages)
      }
      s.accesses = {}
    }
  }

  newSocket (options = {}) {
    const {url, multiplex, path} = this
    const isBrowser = typeof window !== 'undefined'
    return sgSocketClient(url, Object.assign({
      multiplex,
      path,
      transports: isBrowser ? ['polling', 'websocket'] : ['websocket'],
    }, options))
  }

  async actorAccess (key, messages) {
    const {auth, url} = this
    const socket = this.newSocket()
    this.sockets[key] = socket
    socket.on(ERROR, (err) => {
      socket.close()
      throw err
    })
    if (auth) {
      try {
        await authorize(socket, auth)
      } catch (err) {
        throw new Error(
          `[SUGO-Caller] Authentication failed: ${err.message} ( url: ${JSON.stringify(url)}, auth: ${JSON.stringify(auth)} )`
        )
      }
    }

    await socket.waitToConnect()

    const {payload = {}} = await socket.call(JOIN, {key, messages})
    const {specs, as} = payload

    const vError = validateInterfaceSpecs(specs)
    if (vError) {
      delete this.sockets[key]
      throw vError
    }

    const connector = this.newConnector(key)

    socket.on(PIPE, (piped) => {
      let {data, meta = {}, event, level} = piped
      let {types} = meta
      if (types) {
        data = parse(data, types, {})
      }
      let {actorPipeListeners, modulePipeListeners} = access
      switch (level) {
        case ACTOR_LEVEL: {
          let listeners = actorPipeListeners[event] || []
          for (let listener of listeners) {
            listener(data)
          }
          break
        }
        case MODULE_LEVEL:
        default: {
          const listeners = (modulePipeListeners[piped.module] || {})[event] || []
          for (const listener of listeners) {
            listener(data)
          }
          break
        }
      }
    })
    socket.on(SPEC, ({name, spec}) => {
      access.registerSpecs({[name]: spec}, connector)
    })
    socket.on(DESPEC, ({name}) => {
      access.deregisterSpecs(name)
    })

    let access = new ActorAccess({
      key,
      as,
      specs,
      connector
    })
    Object.assign(access, {actorPipeListeners: {}, modulePipeListeners: {}})

    return access
  }

  newConnector (key) {
    const s = this

    return {
      invoke: async function invokeMethod (module, method, params = []) {
        // Format params
        {
          const isFunc = (param) => typeof param === 'function'
          for (let i = 0; i < params.length; i++) {
            const param = params[i]
            if (isFunc(param)) {
              console.warn(`[SUGO-Caller] Passing function is not supported. Please check the params passed to ${'`'}${module}.${method}()${'`'}`)
              params[i] = Object.assign({}, param)
            }
          }
        }

        let socket = s.sockets[key]
        s.assertConnection(key)

        let performData = injectTypes({key, method, params, module})
        let {payload = {}} = await socket.call(PERFORM, performData)
        let {pid} = payload
        if (!pid) {
          throw new Error('[SUGO-Caller] pid not found. Perhaps you need use sugo-hub@6.x or later')
        }
        return await new Promise((resolve, reject) => {
          const {OK, NG} = AcknowledgeStatus
          // TODO Support timeout
          let handleResult = (data) => {
            let hit = data.pid === pid
            if (!hit) {
              return
            }
            socket.off(RESULT, handleResult)
            let {status, payload, meta = {}} = data
            switch (status) {
              case NG: {
                const {additionalInfo = {}} = meta
                const message = typeof payload === 'string' ? payload : payload.message
                const error = Object.assign(new Error(message), typeof payload === 'string' ? {} : payload, additionalInfo)
                reject(error)
                break
              }
              case OK:
              default: {
                let {types} = meta
                let hasTypes = types && Object.keys(types).length > 0
                if (hasTypes) {
                  payload = parse(payload, types)
                }
                resolve(payload)
                break
              }
            }
          }
          socket.on(RESULT, handleResult)
        })
      },
      fire: async function fireEvent (module, event, data) {
        const socket = s.sockets[key]
        s.assertConnection(key)
        const isObject = typeof data === 'object'
        const {payload = {}, meta: types} = isObject ? parse(data) : {payload: data}
        socket.emit(PIPE, {key, event, data: payload, module, meta: {types}})
      },
      listen: async function registerListener (module, event, listener) {
        const access = s.accesses[key]
        s.assertConnection(key)
        const {modulePipeListeners} = access
        modulePipeListeners[module] = modulePipeListeners[module] || {}
        modulePipeListeners[module][event] = (modulePipeListeners[module][event] || []).concat(listener)
      },
      delisten: async function deregisterListener (module, event, listener) {
        const access = s.accesses[key]
        s.assertConnection(key)
        const {modulePipeListeners} = access
        if (!modulePipeListeners[module][event]) {
          return
        }
        modulePipeListeners[module][event] = modulePipeListeners[module][event].filter((filterling) => filterling !== listener)
      }
    }
  }

  assertConnection (key) {
    const s = this
    if (!s.sockets[key]) {
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
