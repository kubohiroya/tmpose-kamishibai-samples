# 浦島太郎 — アセット組み込みSB3

`urashima.txt` は浦島太郎の公開用台本です。`urashima.sb3` は、専用スプライト、背景、画像、音声をSB3内に組み込んだスナップショットです。

## ビルド元データ

- `urashima.txt`: `tmpose-kamishibai` で管理していた台本の移設版
- `assets/images/`: 画像 24ファイル
- `assets/sounds/`: 音声 21ファイル

アセットは、本体PR #44で浦島太郎固有コンテンツを分離する直前の `app/assets/` から同一バイト列で移設しています。ファイル名はScratchの `md5ext` 名を維持し、ターゲット、コスチューム、背景、音声名との対応は `urashima.sb3` 内の `project.json` で保持しています。

## ライセンス

台本、画像、音声、SB3はMozilla Public License 2.0（SPDX: `MPL-2.0`）で提供します。適用範囲と表記は [`LICENSES.md`](LICENSES.md) を参照してください。

## 来歴

- 移設元: [`kubohiroya/tmpose-kamishibai`](https://github.com/kubohiroya/tmpose-kamishibai) PR #44
- 移設元コミット: `9526c9d6391622ee261b8d7c0778b1fbbd2e6745`
- ファイルサイズ: 14,536,918 bytes
- ZIPエントリ: 57
- アセット: 56
- SHA-256: `c998f1304e5a2d1371ea0400d1705ac100d649a3857268be4f3f1c28b8faae61`

このファイルは、汎用SB3・台本変換ビルダーによる再生成へ移行するまでの暫定スナップショットです。今後の台本、アセット、ライセンス、生成、検証、公開の整備は [Issue #2](https://github.com/kubohiroya/tmpose-kamishibai-samples/issues/2) で管理します。
