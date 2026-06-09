/**
 * @import {FlatXoConfig} from 'xo'
 */

import globals from 'globals'

/** @type {FlatXoConfig} */
const xoConfig = [
  {
    name: 'default',
    prettier: true,
    rules: {
      'import-x/order': 'off',
      'require-unicode-regexp': 'off',
      'unicorn/no-array-sort': 'off',
      'unicorn/prefer-string-replace-all': 'off'
    },
    space: true
  },
  {
    files: ['lib/**/*.js'],
    languageOptions: {globals: globals.browser}
  },
  {
    files: ['test/**/*.js'],
    rules: {'no-await-in-loop': 'off'}
  }
]

export default xoConfig
