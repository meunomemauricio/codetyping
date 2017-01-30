var path = require('path'),
  configSettings,
  TEST_RESULTS_DIR = 'test-results',
  COVERAGE_DIR =  path.join(TEST_RESULTS_DIR, 'coverage');

module.exports = function(config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine'],

    reporters: ['progress', 'coverage'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: false,
    browsers: ['Chrome'],
    singleRun: true,
    concurrency: Infinity,

    files: [
      'test/unit/index.js',
    ],

    preprocessors: {
      'src/*.js': ['coverage'],
      './test/unit/index.js': ['babel', 'webpack'],
    },

    webpack: {
       module: {
        preLoaders: [
          {
            test: /\.js$/,
            include: path.resolve('src/'),
            loader: 'istanbul-instrumenter',
          },
        ]
      },
    },

    webpackMiddleware: {
      noInfo: true
    },

    coverageReporter: {
      type : 'lcovonly',
      dir : 'coverage/',
    },
  })
}
