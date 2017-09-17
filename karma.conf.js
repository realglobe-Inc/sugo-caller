module.exports = function (config) {
  config.set({
    browsers: process.env.CI ? ['Firefox'] : ['Chrome', 'Firefox'],

    frameworks: ['mocha'],

    singleRun: true,

    files: [
      'test/test_index.karma.js'
    ],

    preprocessors: {
      'test/test_index.karma.js': ['webpack', 'sourcemap']
    },

    reporters: ['mocha'],

    webpack: {
      devtool: 'inline-source-map',
      module: {
        loaders: [
          {
            test: /\.js$|\.jsx$/,
            loader: 'babel-loader',
            include: __dirname + '/test',
            query: {
              presets: ['es2015', 'es2016', 'es2017']
            }
          },
          {
            test: /\.json$/,
            loader: 'json-loader'
          }
        ]
      },
      resolve: {
        extensions: ['', '.js', '.json']
      }
    },

    webpackMiddleware: {
      stats: 'errors-only'
    },

    port: 9876,

    colors: true,

    logLevel: config.LOG_INFO,

    browserNoActivityTimeout: 120000
  })
}
