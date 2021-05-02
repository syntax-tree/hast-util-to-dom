const babel = require('@rollup/plugin-babel').default
const commonjs = require('@rollup/plugin-commonjs')
const json = require('@rollup/plugin-json')
const resolve = require('@rollup/plugin-node-resolve').default

module.exports = karmaConfig

function karmaConfig(config) {
  config.set({
    frameworks: ['jasmine'],
    files: [{pattern: 'src/index.test.js'}],
    preprocessors: {
      'src/*.test.js': ['rollup']
    },
    rollupPreprocessor: {
      output: {format: 'iife'},
      plugins: [
        resolve({
          browser: true,
          extensions: ['.mjs', '.js', '.json', '.node']
        }),
        json(),
        commonjs(),
        babel({
          presets: [['@babel/preset-env', {modules: false}]],
          babelrc: false
        })
      ]
    }
  })
}
