const babel = require('rollup-plugin-babel');
const { default: babelrc } = require('babelrc-rollup');
const commonjs = require('rollup-plugin-commonjs');
const resolve = require('rollup-plugin-node-resolve');

module.exports = function karmaConfig(config) {
  config.set({
    frameworks: ['jasmine'],
    files: [
      'src/index.test.js',
    ],
    preprocessors: {
      '**/*.test.js': ['rollup'],
    },
    rollupPreprocessor: {
      output: {
        name: 'Test',
        format: 'iife',
        sourcemap: 'inline',
      },
      plugins: [
        resolve({
          browser: true,
          extensions: ['.mjs', '.js', '.json', '.node'],
        }),
        commonjs(),
        babel(babelrc()),
      ],
    },
    reporters: ['mocha'],
    port: 9876, // karma web server port
    colors: true,
    logLevel: config.LOG_INFO,
    browsers: [
      'Chrome',
      'ChromeHeadless',
      'Firefox',
      'FirefoxHeadless',
      'Safari',
    ],
    autoWatch: false,
    // singleRun: false, // Karma captures browsers, runs the tests and exits
    concurrency: Infinity,
  });
};
