const babel = require('rollup-plugin-babel');
const commonjs = require('rollup-plugin-commonjs');
const resolve = require('rollup-plugin-node-resolve');
const json = require('rollup-plugin-json');

module.exports = function karmaConfig(config) {
  config.set({
    frameworks: ['jasmine'],
    files: [
      { pattern: 'src/index.test.js', watched: false },
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
        json(),
        commonjs(),
        babel({
          presets: [
            ['@babel/preset-env', { modules: false }],
          ],
          babelrc: false,
        }),
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
