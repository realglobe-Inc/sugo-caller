/**
 * @class SugoTerminal
 */
'use strict'

const sgSocketClient = require('sg-socket-client')
const { EventEmitter } = require('events')
const { SpotEvents } = require('sg-socket-constants')
const co = require('co')
class SugoTerminal extends EventEmitter {
  constructor (url, config = {}) {
    super()
    const s = this
    s.url = url
    s.socket = null
  }

  /**
   * Connect to spot
   * @param {string} key - Key of spot
   * @param {generator} handler
   * @returns {Promise}
   */
  connect (key, handler) {
    const s = this
    return co(function * () {

    })
  }

  disconnect () {

  }
}

module.exports = SugoTerminal
