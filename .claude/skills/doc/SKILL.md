---
name: doc
description: このリポジトリの文書を書く・直す・整理するときの規約。docs/ への新規追加、ER 図やテーブル設計書の更新、docs/portal の再生成、文書のアーカイブ移動、文字コードと改行コードの扱い。「ドキュメントを更新して」「ER を直して」「仕様書に書いて」と言われたときに使う。
---

# ドキュメント規約（この案件の正本）

`AGENTS.md` §4.6 をここへ移した（2026-10-02 / `docs/296`）。
文書を触るときだけ読めばよい手順なので常設から外した。

## 1. ER 図は手書き禁止 — 単一情報源から自動生成する

`docs/03_DATA_MODEL.md` の**最初の `mermaid` ER ブロック**は自動生成物（`AUTO-GENERATED` バナー付）。
**手書き編集してはならない。**

| 要素 | 正本 |
|---|---|
| 列の存在・順序 | `gas-src/Code.full.gs` の `テーブル定義` / `マスタ定義` |
| 型・PK・FK・コメント・リレーション・分類 | `docs/er-metadata.json` |

### スキーマを変えたときの手順（**同ターン**で完結させる）

1. `gas-src/Code.full.gs` の `テーブル定義` / `マスタ定義` を更新（列の正本）
2. 必要なら `docs/er-metadata.json` に型・キー・コメント・リレーションを追記（未設定は `string` 既定）
3. `npm run build:docs-portal`（内部で `scripts/generate-er.mjs` が ER 再生成 → portal 生成）
4. `npm run test:er-sync` を確認し、同じコミットに含める

`### v305 ER Supplement` のような**補助 mermaid ブロック**（概念図）は自動生成の対象外で手書き可。

> 参照整合性そのものの検査は `npm run test:db-relations`。
> ER 図が実在しないテーブル・列を指していないかを見る（`docs/spec/02_RD.md` BR-20）。

## 2. 人間可読版を併設する

AI が読む構造化 Markdown と、人がブラウザで読む HTML を両方置く。入口は `docs/portal/`。

| ファイル | 内容 |
|---|---|
| `docs/portal/index.html` | TOC ＋ 主要原典へのリンク |
| `docs/portal/er-diagram.html` | Mermaid ER 図（自動生成） |
| `docs/portal/tables.html` / `schema.dbml` | テーブル設計書 / DBML |
| `docs/portal/specifications.html` | PRD・アーキテクチャ・認証・RBAC・デプロイ・セキュリティのサマリ |
| `docs/portal/test-report.html` | テスト結果（自動テスト＋dry-run＋本番実測。`npm run report:tests`） |

再生成: `npm run build:docs-portal`。スキーマ・仕様を更新したら必ず実行する。

## 3. 置き場所

- **`docs/` 直下は現役の文書だけ。** 完了した一過性の記録（リリース記録・インシデント・修正記録・
  旧引継ぎ・旧世代の学習ノート）は `docs/archive/` の該当サブフォルダへ移す。
- 移動したら `docs/00_DOC_INDEX.md` と `docs/archive/00_ARCHIVE_INDEX.md` を**同ターンで**更新する。
- **リリース記録は直近 3 件だけを直下に残す。**
- 同種の文書が増えたら統合を検討する（例: 決定記録 5 件 → `06_DECISION_RECORDS.md`）。
- `docs/archive/` は過去の記録置き場であり、**現況・仕様の参照先にしない**。
  経緯を追うときだけ `docs/archive/00_ARCHIVE_INDEX.md` から開く。

## 4. 新規文書を作ったら索引に登録する

`docs/00_DOC_INDEX.md` へ 1 行足す。**登録を忘れると `npm run test:docs-single-source` が落ちる**
（要件 ID を新設した場合は `docs/268` のトレーサビリティ一覧にも登録が要る）。

## 5. 文字コードと改行コード

- **UTF-8 で保存する。** PowerShell 等の既定エンコーディングに依存した読み書きを避ける。
  保存後に文字化けがないことを確認し、化けていたら更新を完了扱いにせず先に直す。
- **改行コードはファイルごとに揃える。** このリポジトリは作業ツリーに CRLF の文書と LF の文書が
  混在している（git は LF で保存する）。置換スクリプトを書くときは、
  **読んだときの改行コードを保って書き戻す**。

```python
raw = io.open(path, encoding='utf-8', newline='').read()
nl  = '\r\n' if '\r\n' in raw else '\n'
s   = raw.replace('\r\n', '\n')
#   ... 加工 ...
io.open(path, 'w', encoding='utf-8', newline=nl).write(s)
```

Python の `io.open(..., 'w')` は Windows で LF→CRLF 変換を行う。`newline=` を必ず指定する
（`feedback_python_write_crlf_trap`）。

## 6. 書き方

- 版依存の現況値（現行 version・deployment の向き先）を規約文書に埋め込まない。
  正本は `HANDOVER.md` で、都度更新する。
- 不具合の記録は「**何が起きたか / なぜ起きたか / どう直したか / どう再発を防ぐか**」を書く。
  再発防止が機械検査なら、そのテスト名を書く。
- **未検証は残してよい。ただし「未検証」と明示する。**
