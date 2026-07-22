# tmpose-kamishibai-samples

`tmpose-kamishibai` の台本、サンプル固有アセット、生成設定、検証、公開物を管理するリポジトリです。

公開サイト: <https://kubohiroya.github.io/tmpose-kamishibai-samples/>

浦島太郎サンプルの台本、元アセット、生成設定は `samples/urashima/` に配置しています。

- `source.txt`: 元アセットを `file:` 参照するビルド元台本
- `urashima.txt`: editor/playerで共通の変換済み公開用台本
- `assets/images/`: 画像元データ 24ファイル
- `assets/sounds/`: 音声元データ 21ファイル
- `assets.lock.json`: 組み込み対象42件の名前・target・ハッシュ・メタデータ
- `sample.config.json`: `generic` / `editor` / `player` の生成設定
- `artifacts.lock.json`: 再現可能な生成物のサイズとSHA-256
- `base/kamishibai.sb3`: 本体 `v3.1.0` から生成した `generic` ベース

`pnpm build` は、固定した `@kubohiroya/tmpose-kamishibai` `v3.1.0` のビルダーを使い、次の2成果物を生成します。

- `_urashima.sb3` (`editor`): 台本非埋め込み・アセット埋め込み。物語作成者の編集用
- `urashima.sb3` (`player`): 台本・アセット埋め込み。配布・再生用

先頭の `_` は物語作成者による内部的使用を示します。`player` は編集禁止を意味する「再生専用」ではなく「再生用」です。成果物そのものはリポジトリへ重複コミットせず、GitHub Pagesのビルド時にロック済み入力から生成します。

## ライセンス

本リポジトリのコンテンツは [Mozilla Public License 2.0](LICENSE)（SPDX: `MPL-2.0`）で提供します。浦島太郎サンプルの適用範囲は [`samples/urashima/LICENSES.md`](samples/urashima/LICENSES.md) に明記しています。

## ビルドと検証

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm test
pnpm build
```

`pnpm build` は空の `dist/` から両プロファイルのSB3と公開サイトを生成し、台本・SB3・全アセット・ライセンス・リンク・SHA-256を検証します。`editor`の外部台本と`player`の組み込み台本は同一バイト列であり、変換後の台本にはリモートまたは`file:`アセット参照が残らないことも検査します。

Pull Requestでは `.github/workflows/ci.yml` が生成と検証だけを行います。`main` へのマージ後は `.github/workflows/deploy.yml` が同じ検証を再実行し、成功した `dist/` だけをGitHub Pagesへ公開します。

公開に問題がある場合はdeploy workflowを停止し、問題の変更をrevertします。`player`に問題がある場合は一般向け導線を停止し、外部台本を開く`editor`へ切り戻せます。ビルダーの不具合では依存タグとベースSB3を直前の検証済み組へ戻し、修正後に `workflow_dispatch` から再検証・再公開します。

実装計画は次のIssueで管理します。

- [サンプル生成とGitHub Pages公開](https://github.com/kubohiroya/tmpose-kamishibai-samples/issues/1)
- [浦島太郎の生成・検証・公開](https://github.com/kubohiroya/tmpose-kamishibai-samples/issues/2)
