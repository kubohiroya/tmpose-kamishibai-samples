import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile, readdir} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

import {validateAssetManifest} from '@kubohiroya/tmpose-kamishibai/builder';
import {strFromU8, unzipSync} from 'fflate';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const sampleDirectory = path.join(projectRoot, 'samples/urashima');

function sha256(contents) {
  return createHash('sha256').update(contents).digest('hex');
}

test('licenses the repository and Urashima content under MPL-2.0', async () => {
  const [packageJson, license, licenseSummary, runtimeLicense] = await Promise.all([
    readFile(path.join(projectRoot, 'package.json'), 'utf8').then(JSON.parse),
    readFile(path.join(projectRoot, 'LICENSE'), 'utf8'),
    readFile(path.join(sampleDirectory, 'LICENSES.md'), 'utf8'),
    readFile(path.join(sampleDirectory, 'licenses/tmpose-kamishibai-MIT.txt'), 'utf8'),
  ]);
  assert.equal(packageJson.license, 'MPL-2.0');
  assert(license.startsWith('Mozilla Public License Version 2.0'));
  assert(licenseSummary.includes('MPL-2.0'));
  assert(licenseSummary.includes('tmpose-kamishibai-MIT.txt'));
  assert(runtimeLicense.startsWith('MIT License'));
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

test('pins the generic, editor, and player profile contract', async () => {
  const [packageJson, config, artifactsLock, baseSb3] = await Promise.all([
    readFile(path.join(projectRoot, 'package.json'), 'utf8').then(JSON.parse),
    readFile(path.join(sampleDirectory, 'sample.config.json'), 'utf8').then(JSON.parse),
    readFile(path.join(sampleDirectory, 'artifacts.lock.json'), 'utf8').then(JSON.parse),
    readFile(path.join(sampleDirectory, 'base/kamishibai.sb3')),
  ]);
  assert.equal(
    packageJson.dependencies['@kubohiroya/tmpose-kamishibai'],
    'github:kubohiroya/tmpose-kamishibai#v3.1.0',
  );
  assert.equal(config.builder.version, '3.1.0');
  assert.equal(config.builder.commit, 'c92c310159c88ff03ed3cae65dbe21f1991fcf16');
  assert.equal(config.baseSb3.profile, 'generic');
  assert.equal(config.baseSb3.size, baseSb3.length);
  assert.equal(config.baseSb3.sha256, sha256(baseSb3));
  assert.deepEqual(config.profiles, {
    editor: {outputName: '_urashima', script: 'external', assets: 'embedded'},
    player: {outputName: 'urashima', script: 'embedded', assets: 'embedded'},
  });
  assert.deepEqual(Object.keys(artifactsLock.profiles).sort(), ['editor', 'player']);

  const archive = unzipSync(new Uint8Array(baseSb3));
  const project = JSON.parse(strFromU8(archive['project.json']));
  const stage = project.targets.find((target) => target.isStage);
  assert.deepEqual(stage.variables.tmposeEmbeddedScript, ['__tmpose_embedded_script', '']);
  assert.deepEqual(
    project.targets.map((target) => target.name),
    ['Stage', 'Actor', 'prompt', 'openButton', 'reloadButton', 'showTitleButton', 'Hatchling'],
  );
});

test('locks every external script asset and publishes one transformed script', async () => {
  const [source, published, rawAssetManifest] = await Promise.all([
    readFile(path.join(sampleDirectory, 'source.txt'), 'utf8'),
    readFile(path.join(sampleDirectory, 'urashima.txt'), 'utf8'),
    readFile(path.join(sampleDirectory, 'assets.lock.json'), 'utf8').then(JSON.parse),
  ]);
  const assetManifest = validateAssetManifest(rawAssetManifest);
  const externalLines = source
    .split(/\r?\n/u)
    .filter((line) => /^asset=.*,(?:file|https?):/u.test(line));
  assert.equal(externalLines.length, 42);
  assert.equal(assetManifest.assets.length, 42);
  assert.deepEqual(
    new Set(externalLines.map((line) => line.slice('asset='.length, line.indexOf(',')))),
    new Set(assetManifest.assets.map((asset) => asset.name)),
  );
  assert.equal(/^(?:asset=.*,(?:file|https?):)/mu.test(published), false);
  assert.equal(published.includes('asset=Stars,backdrop'), true);
  assert.equal(published.includes('asset=Narration,text'), true);
  assert.equal(/^text=/mu.test(published), false);
  assert.equal(published.includes('setRuntimeVariable=Narration:むかし'), true);
});
