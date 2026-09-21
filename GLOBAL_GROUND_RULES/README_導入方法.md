# AI駆動開発プロンプト 再設計版（2026-03-21基準）

この一式は、長い単一のシステムプロンプトを分割して運用するためのテンプレートです。

> ## このリポジトリでの適用状態（2026-09-21）
>
> **常設指示の正本はリポジトリ直下の [`AGENTS.md`](../AGENTS.md) と [`CLAUDE.md`](../CLAUDE.md) です。**
> 本ディレクトリには**詳細ルール（`GLOBAL_GROUND_RULES/docs/AI_RULES/`）と知識ベースだけ**を置きます。
>
> テンプレート原本の `GLOBAL_GROUND_RULES/AGENTS.md` / `GLOBAL_GROUND_RULES/CLAUDE.md` は削除しました。
> リポジトリ直下に適用済みの本体があるのに原本が並存し、**どちらが入口か分からない状態**だったためです。
> 原本側の「参照順」は詳細ルールをリポジトリ直下からの相対パス（`docs/AI_RULES/` 始まり）で書いており、
> この配置では解決できませんでした。読む順序の正本は `AGENTS.md` §2 です。
>
> 本ディレクトリ内の文書がこのキット自身の資料（`GLOBAL_GROUND_RULES/docs/04_KNOWN_ERRORS.md` /
> `GLOBAL_GROUND_RULES/docs/03_ADR/` / `GLOBAL_GROUND_RULES/docs/01_ARCHITECTURE/`）を指すときは、
> 案件側の `docs/` と混同しないよう `GLOBAL_GROUND_RULES/` から書いています。

## 目的
- 常設ルールを短く保つ
- ツール／製品ごとの差分を吸収する
- 詳細ルールは docs 側へ逃がす
- 人間レビュー・セキュリティ・検証を明文化する
- 既知エラーや設計判断をプロジェクト資産として蓄積する

## 推奨配置（テンプレートとしての想定。このリポジトリでの実配置は上の囲みを参照）
- `AGENTS.md`（リポジトリ直下）
  - OpenAI Codex / agent 系の常設指示。**本リポジトリでは適用済み**
- `CLAUDE.md`（リポジトリ直下）
  - Claude Code 系の常設指示。**本リポジトリでは適用済み**（実体は `AGENTS.md` に集約）
- `.github/copilot-instructions.md`
  - GitHub Copilot 向け。**本リポジトリは未適用**（Copilot を使っていないため原本のまま）
- `GLOBAL_GROUND_RULES/docs/AI_RULES/*.md`
  - 詳細ルール。`AGENTS.md` §2 の読む順序から参照する
- `GLOBAL_GROUND_RULES/docs/04_KNOWN_ERRORS.md`
  - 再発防止の知識ベース
- `GLOBAL_GROUND_RULES/docs/03_ADR/README.md`
  - 技術判断記録の書き方
- `GLOBAL_GROUND_RULES/docs/01_ARCHITECTURE/README.md`
  - アーキテクチャ説明の書き方

## 優先順位
1. 直近のユーザー依頼 / Issue / PR要件
2. リポジトリ直下の常設指示（`AGENTS.md` / `CLAUDE.md` / Copilot instructions）
3. 対応する詳細ルール（`GLOBAL_GROUND_RULES/docs/AI_RULES/`）
4. プロジェクト固有の実装事実（コード、テスト、設定、README）
5. 一次ソース（公式Docs / 公式Issue / RFC / ベンダー公式）

## 使い方
- まずこのまま投入して動かす
- 次に、各プロジェクトの build / test / lint / deploy / 禁止事項を埋める
- フロントエンド、バックエンド、インフラなど領域別ルールが必要なら `GLOBAL_GROUND_RULES/docs/AI_RULES/` に追加する
- プロジェクト固有の運用ルールは `GLOBAL_GROUND_RULES/docs/AI_RULES/05_PROJECT_RULES_HIRAKATA.md` のような補助文書に切り出す
- ルールが重くなったら、繰り返し使う手順は別途 skill / playbook に分離する

## 重要
この一式は「AIが自己学習する」ことを前提にしていません。  
前提にしているのは、**AIと人間が、プロジェクト内の明示的な文書を更新して学習を外部化する**ことです。
