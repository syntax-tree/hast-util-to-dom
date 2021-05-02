/* eslint-env jest, browser */

import fs from 'fs'
import path from 'path'
import glob from 'glob'
import serializeNodeToHtmlString from './utils.js'
import toDOM from './index.js'

describe('fixtures', () => {
  const root = path.join(__dirname, '__fixtures__')
  const fixturePaths = glob.sync(path.join(root, '**/*/'))
  let index = -1

  while (++index < fixturePaths.length) {
    each(fixturePaths[index])
  }

  function each(fixturePath) {
    const fixture = path.relative(root, fixturePath)
    const fixtureInput = path.join(fixturePath, 'index.json')
    const fixtureOutput = path.join(fixturePath, 'index.html')

    test(fixture, () => {
      const fixtureData = JSON.parse(fs.readFileSync(fixtureInput))
      const parsedActual = serializeNodeToHtmlString(toDOM(fixtureData))

      let parsedExpected

      try {
        parsedExpected = fs.readFileSync(fixtureOutput).toString().trim()
      } catch {
        fs.writeFileSync(fixtureOutput, parsedActual)
        return
      }

      expect(parsedActual).toEqual(parsedExpected)
    })
  }
})
