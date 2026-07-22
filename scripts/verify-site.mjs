import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {access, readFile, readdir, stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

function sha256(contents) {
  return createHash('sha256').update(contents).digest('hex');
}

async function listFiles(directory, prefix = '') {
  const entries = await readdir(directory, {withFileTypes: true});
  const files = await Promise.all(entries.map(async (entry) => {
    const relativePath = path.join(prefix, entry.name);
    if (entry.isDirectory()) return listFiles(path.join(directory, entry.name), relativePath);
    return entry.isFile() ? [relativePath] : [];
  }));
  return files.flat().sort();
}

function localLinks(html) {
  return [...html.matchAll(/\bhref="([^"]+)"/gu)]
    .map((match) => match[1])
    .filter((href) => !/^(?:https?:|mailto:|#)/u.test(href));
}

async function verifyLinks(htmlPath) {
  const html = await readFile(htmlPath, 'utf8');
  for (const href of localLinks(html)) {
    const target = path.resolve(path.dirname(htmlPath), decodeURIComponent(href));
    await access(target);
  }
  return html;
}

export async function verifyPublishedSite(options = {}) {
  const projectRoot = options.projectRoot
    ?? fileURLToPath(new URL('../', import.meta.url));
  const outputDirectory = options.outputDirectory ?? path.join(projectRoot, 'dist');
  const sourceDirectory = options.sourceDirectory ?? path.join(projectRoot, 'samples/urashima');
  const outputSampleDirectory = path.join(outputDirectory, 'samples/urashima');

  const [sourceFiles, publishedFiles, rootIndex, sampleIndex, manifest, license, licenseSummary] =
    await Promise.all([
      listFiles(sourceDirectory),
      listFiles(outputDirectory),
      verifyLinks(path.join(outputDirectory, 'index.html')),
      verifyLinks(path.join(outputSampleDirectory, 'index.html')),
      readFile(path.join(outputSampleDirectory, 'manifest.json'), 'utf8').then(JSON.parse),
      readFile(path.join(outputDirectory, 'LICENSE'), 'utf8'),
      readFile(path.join(outputSampleDirectory, 'LICENSES.md'), 'utf8'),
    ]);

  for (const relativePath of sourceFiles) {
    const [source, published] = await Promise.all([
      readFile(path.join(sourceDirectory, relativePath)),
      readFile(path.join(outputSampleDirectory, relativePath)),
    ]);
    assert(source.equals(published), `Published file differs from source: ${relativePath}`);
  }

  assert(manifest.formatVersion === 1 && manifest.sample === 'urashima');
  assert(manifest.publicUrl === 'https://kubohiroya.github.io/tmpose-kamishibai-samples/samples/urashima/');
  assert(manifest.license === 'MPL-2.0');
  assert(manifest.assetCounts.images === 24 && manifest.assetCounts.sounds === 21);
  assert(manifest.assets.length === 45);
  for (const asset of manifest.assets) {
    const contents = await readFile(path.join(outputSampleDirectory, asset.path));
    assert(contents.length === asset.size, `Asset size mismatch: ${asset.path}`);
    assert(sha256(contents) === asset.sha256, `Asset SHA-256 mismatch: ${asset.path}`);
  }

  const sb3Contents = await readFile(path.join(outputSampleDirectory, manifest.sb3.path));
  const scriptContents = await readFile(path.join(outputSampleDirectory, manifest.script.path));
  assert(scriptContents.length === manifest.script.size);
  assert(sha256(scriptContents) === manifest.script.sha256);
  assert(sb3Contents.length === manifest.sb3.size);
  assert(sha256(sb3Contents) === manifest.sb3.sha256);
  assert(license.startsWith('Mozilla Public License Version 2.0'));
  assert(licenseSummary.includes('MPL-2.0'));
  assert(rootIndex.includes('https://github.com/kubohiroya/tmpose-kamishibai-samples'));
  assert(!rootIndex.includes('https://kubohiroya.github.io/tmpose-kamishibai/samples/'));
  assert(sampleIndex.includes(manifest.sb3.sha256));
  assert(publishedFiles.includes('.nojekyll'));

  const noJekyll = await stat(path.join(outputDirectory, '.nojekyll'));
  assert(noJekyll.isFile());
  return {assetCount: manifest.assets.length, fileCount: publishedFiles.length};
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const results = await verifyPublishedSite();
  console.log(`Verified ${results.fileCount} published files and ${results.assetCount} assets.`);
}
