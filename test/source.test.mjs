import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile, readdir} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const sampleDirectory = path.join(projectRoot, 'samples/urashima');

test('licenses the repository and Urashima content under MPL-2.0', async () => {
  const [packageJson, license, licenseSummary] = await Promise.all([
    readFile(path.join(projectRoot, 'package.json'), 'utf8').then(JSON.parse),
    readFile(path.join(projectRoot, 'LICENSE'), 'utf8'),
    readFile(path.join(sampleDirectory, 'LICENSES.md'), 'utf8'),
  ]);
  assert.equal(packageJson.license, 'MPL-2.0');
  assert(license.startsWith('Mozilla Public License Version 2.0'));
  assert(licenseSummary.includes('MPL-2.0'));
});

test('keeps the migrated Scratch assets complete and content-addressed', async () => {
  const directories = [
    ['images', 24],
    ['sounds', 21],
  ];
  for (const [directory, expectedCount] of directories) {
    const assetDirectory = path.join(sampleDirectory, 'assets', directory);
    const filenames = await readdir(assetDirectory);
    assert.equal(filenames.length, expectedCount);
    for (const filename of filenames) {
      const contents = await readFile(path.join(assetDirectory, filename));
      const md5 = createHash('md5').update(contents).digest('hex');
      assert.equal(md5, path.parse(filename).name, filename);
    }
  }
});

test('matches the bundled SB3 checksum', async () => {
  const [sb3, checksum] = await Promise.all([
    readFile(path.join(sampleDirectory, 'urashima.sb3')),
    readFile(path.join(sampleDirectory, 'urashima.sb3.sha256'), 'utf8'),
  ]);
  const actual = createHash('sha256').update(sb3).digest('hex');
  assert.equal(actual, checksum.trim().split(/\s+/u)[0]);
});
