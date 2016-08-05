/**
 * Creates a single bundle with all karma testcases
 */

// To use Promise in browser
const babelPolyfill = require('babel-polyfill')

const testsContext = require.context('.', true, /_test.karma.js$/)
testsContext.keys().forEach(testsContext)
