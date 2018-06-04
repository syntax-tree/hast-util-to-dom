import fs from 'fs';
import path from 'path';
import glob from 'glob';

import { serializeNodeToHtmlString } from './utils';
import toDOM from './index';

describe('fixtures', () => {
  const FIXTURES_PATH = path.join(__dirname, '__fixtures__');
  const fixturePaths = glob.sync(path.join(FIXTURES_PATH, '**/*/'));
  fixturePaths.forEach((fixturePath) => {
    const fixture = path.relative(FIXTURES_PATH, fixturePath);
    const fixtureInput = path.join(fixturePath, 'index.json');
    const fixtureOutput = path.join(fixturePath, 'index.html');

    test(fixture, () => {
      const fixtureData = JSON.parse(fs.readFileSync(fixtureInput));
      const parsedActual = serializeNodeToHtmlString(toDOM(fixtureData));
      let parsedExpected;
      try {
        parsedExpected = fs.readFileSync(fixtureOutput).toString();
      } catch (e) {
        fs.writeFileSync(fixtureOutput, parsedActual);
        return;
      }
      expect(parsedActual).toEqual(parsedExpected);
    });
  });
});
