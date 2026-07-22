import {createHash} from 'node:crypto';
import {copyFile, cp, mkdir, readFile, readdir, rm, stat, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {verifyPublishedSite} from './verify-site.mjs';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const sourceDirectory = path.join(projectRoot, 'samples/urashima');
const outputDirectory = path.join(projectRoot, 'dist');
const outputSampleDirectory = path.join(outputDirectory, 'samples/urashima');
const publicUrl = 'https://kubohiroya.github.io/tmpose-kamishibai-samples/';

function sha256(contents) {
  return createHash('sha256').update(contents).digest('hex');
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function contentType(filename) {
  if (filename.endsWith('.png')) return 'image/png';
  if (filename.endsWith('.svg')) return 'image/svg+xml';
  if (filename.endsWith('.wav')) return 'audio/wav';
  throw new Error(`Unsupported asset format: ${filename}`);
}

async function assetRecords(directory, kind) {
  const filenames = (await readdir(directory)).sort();
  return Promise.all(filenames.map(async (filename) => {
    const filePath = path.join(directory, filename);
    const contents = await readFile(filePath);
    const expectedMd5 = path.parse(filename).name;
    const actualMd5 = createHash('md5').update(contents).digest('hex');
    if (actualMd5 !== expectedMd5) {
      throw new Error(`Scratch md5ext mismatch: ${filename}`);
    }
    return {
      path: `assets/${kind}/${filename}`,
      contentType: contentType(filename),
      size: contents.length,
      sha256: sha256(contents),
    };
  }));
}

function renderRootIndex(manifest) {
  return `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="TMPose紙芝居の公開サンプル">
  <title>TMPose紙芝居サンプル</title>
  <style>
    :root { color-scheme: light; font-family: system-ui, sans-serif; --ink: #3f302b; --muted: #756960; --paper: #fffdf8; --canvas: #fff8ee; --accent: #963f2f; --line: #dbc9bb; }
    * { box-sizing: border-box; }
    body { margin: 0; background: var(--canvas); color: var(--ink); }
    main { max-width: 920px; margin: auto; padding: 48px 24px 72px; }
    h1 { font-size: clamp(2rem, 6vw, 3.5rem); margin-bottom: .35rem; }
    .lead { color: var(--muted); font-size: 1.15rem; }
    article { margin-top: 32px; padding: 24px; border: 1px solid var(--line); border-radius: 14px; background: var(--paper); box-shadow: 0 8px 24px rgb(89 61 43 / 10%); }
    .actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 1.25rem; }
    .button { display: inline-block; padding: 10px 14px; border-radius: 8px; background: var(--accent); color: white; text-decoration: none; font-weight: 700; }
    .button.secondary { border: 1px solid var(--accent); background: white; color: var(--accent); }
    footer { margin-top: 40px; color: var(--muted); }
    code { overflow-wrap: anywhere; }
  </style>
</head>
<body>
<main>
  <h1>TMPose紙芝居サンプル</h1>
  <p class="lead">台本、画像・音声、実行用SB3を配布しています。</p>
  <article>
    <h2>浦島太郎</h2>
    <p>紙芝居DSL 3.1の台本と、画像${manifest.assetCounts.images}件・音声${manifest.assetCounts.sounds}件を組み込んだSB3です。</p>
    <div class="actions">
      <a class="button" href="samples/urashima/">内容を見る</a>
      <a class="button secondary" href="samples/urashima/urashima.txt">台本</a>
      <a class="button secondary" href="samples/urashima/urashima.sb3" download>SB3をダウンロード</a>
    </div>
  </article>
  <footer>
    <p>コンテンツは <a href="LICENSE">Mozilla Public License 2.0</a> で提供します。</p>
    <p><a href="https://github.com/kubohiroya/tmpose-kamishibai-samples">GitHubリポジトリ</a></p>
  </footer>
</main>
</body>
</html>
`;
}

function renderSampleIndex(manifest) {
  const assetItems = manifest.assets.map((asset) =>
    `      <li><a href="${escapeHtml(asset.path)}"><code>${escapeHtml(asset.path)}</code></a> <small>${asset.size.toLocaleString('ja-JP')} bytes</small></li>`,
  ).join('\n');
  return `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="TMPose紙芝居 浦島太郎サンプル">
  <title>浦島太郎 | TMPose紙芝居サンプル</title>
  <style>
    :root { color-scheme: light; font-family: system-ui, sans-serif; --ink: #3f302b; --muted: #756960; --canvas: #fff8ee; --accent: #963f2f; }
    body { margin: 0; background: var(--canvas); color: var(--ink); }
    main { max-width: 920px; margin: auto; padding: 40px 24px 72px; }
    nav { margin-bottom: 32px; }
    a { color: var(--accent); }
    .actions { display: flex; flex-wrap: wrap; gap: 10px; margin: 24px 0; }
    .button { display: inline-block; padding: 10px 14px; border-radius: 8px; background: var(--accent); color: white; text-decoration: none; font-weight: 700; }
    .button.secondary { border: 1px solid var(--accent); background: white; color: var(--accent); }
    li { margin: .45rem 0; }
    small { color: var(--muted); }
    code { overflow-wrap: anywhere; }
  </style>
</head>
<body>
<main>
  <nav><a href="../../">サンプル一覧へ戻る</a></nav>
  <h1>浦島太郎</h1>
  <p>紙芝居DSL 3.1の台本、元アセット、アセット組み込み済みSB3を配布しています。</p>
  <div class="actions">
    <a class="button" href="urashima.txt">台本を表示</a>
    <a class="button" href="urashima.sb3" download>SB3をダウンロード</a>
    <a class="button secondary" href="manifest.json">manifest</a>
    <a class="button secondary" href="LICENSES.md">ライセンス</a>
  </div>
  <p>SB3 SHA-256: <code>${manifest.sb3.sha256}</code></p>
  <h2>元アセット</h2>
  <p>画像${manifest.assetCounts.images}件、音声${manifest.assetCounts.sounds}件。ファイル名はScratchの <code>md5ext</code> 名です。</p>
  <ul>
${assetItems}
  </ul>
</main>
</body>
</html>
`;
}

export async function buildSite() {
  const images = await assetRecords(path.join(sourceDirectory, 'assets/images'), 'images');
  const sounds = await assetRecords(path.join(sourceDirectory, 'assets/sounds'), 'sounds');
  if (images.length !== 24 || sounds.length !== 21) {
    throw new Error(`Unexpected Urashima asset counts: ${images.length} images, ${sounds.length} sounds.`);
  }

  const [scriptContents, sb3Contents, checksumContents] = await Promise.all([
    readFile(path.join(sourceDirectory, 'urashima.txt')),
    readFile(path.join(sourceDirectory, 'urashima.sb3')),
    readFile(path.join(sourceDirectory, 'urashima.sb3.sha256'), 'utf8'),
  ]);
  const sb3Sha256 = sha256(sb3Contents);
  if (checksumContents.trim().split(/\s+/u)[0] !== sb3Sha256) {
    throw new Error('urashima.sb3 does not match urashima.sb3.sha256.');
  }

  const manifest = {
    formatVersion: 1,
    sample: 'urashima',
    publicUrl: `${publicUrl}samples/urashima/`,
    license: 'MPL-2.0',
    script: {
      path: 'urashima.txt',
      size: scriptContents.length,
      sha256: sha256(scriptContents),
    },
    sb3: {
      path: 'urashima.sb3',
      size: sb3Contents.length,
      sha256: sb3Sha256,
    },
    assetCounts: {images: images.length, sounds: sounds.length},
    assets: [...images, ...sounds],
  };

  await rm(outputDirectory, {recursive: true, force: true});
  await mkdir(path.dirname(outputSampleDirectory), {recursive: true});
  await cp(sourceDirectory, outputSampleDirectory, {recursive: true});
  await copyFile(path.join(projectRoot, 'LICENSE'), path.join(outputDirectory, 'LICENSE'));
  await writeFile(path.join(outputDirectory, '.nojekyll'), '');
  await writeFile(path.join(outputDirectory, 'index.html'), renderRootIndex(manifest), 'utf8');
  await writeFile(
    path.join(outputSampleDirectory, 'manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8',
  );
  await writeFile(
    path.join(outputSampleDirectory, 'index.html'),
    renderSampleIndex(manifest),
    'utf8',
  );

  const results = await verifyPublishedSite({projectRoot, outputDirectory, sourceDirectory});
  console.log(
    `Built ${results.fileCount} published files with ${results.assetCount} assets in dist/.`,
  );
  return results;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await buildSite();
}
