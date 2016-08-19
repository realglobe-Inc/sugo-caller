/**
 * Authorize socket
 * @function authorize
 * @returns {Promise}
 */
'use strict'

const { AuthEvents } = require('sg-socket-constants')
const { AUTHENTICATION, AUTHENTICATED, UNAUTHORIZED } = AuthEvents

/** @lends authorize */
function authorize (socket, auth) {
  console.log(socket)
  return new Promise((resolve, reject) => {
    socket.emit(AUTHENTICATION, auth)
    let unauthorized = (err) => {
      socket.off(AUTHENTICATED, authenticated)
      reject(err)
    }
    let authenticated = () => {
      socket.off(UNAUTHORIZED, unauthorized)
      resolve()
    }
    socket.once(UNAUTHORIZED, unauthorized)
    socket.once(AUTHENTICATED, authenticated)
  })
}

module.exports = authorize
