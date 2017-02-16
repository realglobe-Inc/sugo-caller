/**
 * Parse caller URL
 * @function parseCallerUrl
 * @param {Object|string} - URL string or config
 * @returns {string} - Parsed url
 */
'use strict'

const {
  format: formatUrl,
  parse: parseUrl,
  resolve: resolveUrl
} = require('url')
const { get } = require('bwindow')
const { HubUrls } = require('sugo-constants')

/** @lends parseCallerUrl */
function parseCallerUrl (url) {
  if (typeof url === 'string') {
    let parsed = parseUrl(url)
    if (parsed.pathname === '/') {
      let suggestion = resolveUrl(url, HubUrls.CALLER_URL)
      console.warn(`[SUGO-Caller][Warning] Passed URL "${url}" seems to be wrong. Did you mean "${suggestion}"`)
    }
    return url
  }
  let {
    protocol = get('location.protocol') || 'http',
    host = undefined,
    port = get('location.port') || 80,
    hostname = get('location.hostname') || 'localhost',
    pathname = HubUrls.CALLER_URL
  } = url
  return formatUrl({
    protocol,
    host,
    port,
    hostname,
    pathname
  })
}

module.exports = parseCallerUrl
