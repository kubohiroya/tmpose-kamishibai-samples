# tmpose-kamishibai-samples

`tmpose-kamishibai` の台本、サンプル固有アセット、生成設定、検証、公開物を管理するリポジトリです。

公開サイト: <https://kubohiroya.github.io/tmpose-kamishibai-samples/>

浦島太郎サンプルの台本と元アセットは `samples/urashima/` に配置しています。

- `urashima.txt`: 公開用台本
- `assets/images/`: 画像元データ 24ファイル
- `assets/sounds/`: 音声元データ 21ファイル
- `urashima.sb3`: アセット組み込み済みスナップショット

## ライセンス

本リポジトリのコンテンツは [Mozilla Public License 2.0](LICENSE)（SPDX: `MPL-2.0`）で提供します。浦島太郎サンプルの適用範囲は [`samples/urashima/LICENSES.md`](samples/urashima/LICENSES.md) に明記しています。

## ビルドと検証

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm test
pnpm build
```

`pnpm build` は空の `dist/` から公開サイトを生成し、台本・SB3・全アセット・ライセンス・リンク・SHA-256を検証します。

Pull Requestでは `.github/workflows/ci.yml` が生成と検証だけを行います。`main` へのマージ後は `.github/workflows/deploy.yml` が同じ検証を再実行し、成功した `dist/` だけをGitHub Pagesへ公開します。

公開に問題がある場合はdeploy workflowを停止し、問題の変更をrevertします。修正後は `workflow_dispatch` から再検証・再公開できます。

実装計画は次のIssueで管理します。

- [サンプル生成とGitHub Pages公開](https://github.com/kubohiroya/tmpose-kamishibai-samples/issues/1)
- [浦島太郎の生成・検証・公開](https://github.com/kubohiroya/tmpose-kamishibai-samples/issues/2)
