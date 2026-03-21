# AI駆動開発プロンプト 再設計版（2026-03-21基準）

この一式は、長い単一のシステムプロンプトを以下に分割して運用するためのテンプレートです。

## 目的
- 常設ルールを短く保つ
- ツール／製品ごとの差分を吸収する
- 詳細ルールは docs 側へ逃がす
- 人間レビュー・セキュリティ・検証を明文化する
- 既知エラーや設計判断をプロジェクト資産として蓄積する

## 推奨配置
- `AGENTS.md`
  - OpenAI Codex / agent系の常設指示
- `CLAUDE.md`
  - Claude Code 系の常設指示
- `.github/copilot-instructions.md`
  - GitHub Copilot / Copilot coding agent 向け
- `docs/AI_RULES/*.md`
  - 詳細ルール
- `docs/04_KNOWN_ERRORS.md`
  - 再発防止の知識ベース
- `docs/03_ADR/README.md`
  - 技術判断記録の書き方
- `docs/01_ARCHITECTURE/README.md`
  - アーキテクチャ説明の書き方

## 優先順位
1. 直近のユーザー依頼 / Issue / PR要件
2. リポジトリ直下の常設指示（`AGENTS.md` / `CLAUDE.md` / Copilot instructions）
3. 対応する詳細ルール（`docs/AI_RULES/`）
4. プロジェクト固有の実装事実（コード、テスト、設定、README）
5. 一次ソース（公式Docs / 公式Issue / RFC / ベンダー公式）

## 使い方
- まずこのまま投入して動かす
- 次に、各プロジェクトの build / test / lint / deploy / 禁止事項を埋める
- フロントエンド、バックエンド、インフラなど領域別ルールが必要なら `docs/AI_RULES/` に追加する
- プロジェクト固有の運用ルールは `docs/AI_RULES/05_PROJECT_RULES_HIRAKATA.md` のような補助文書に切り出す
- ルールが重くなったら、繰り返し使う手順は別途 skill / playbook に分離する

## 重要
この一式は「AIが自己学習する」ことを前提にしていません。  
前提にしているのは、**AIと人間が、プロジェクト内の明示的な文書を更新して学習を外部化する**ことです。
