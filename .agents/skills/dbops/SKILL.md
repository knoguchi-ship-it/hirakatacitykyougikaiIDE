---
name: dbops
description: 本番 DB の会員・職員データ修正、申請承認、テストデータ、dryRun、保守ツール、実データ確認を行う手順。
---

# 本番 DB 操作

実行前に、正本である `.claude/skills/dbops/SKILL.md` を最後まで読む。その手順を適用する。Codex では DB 書込みに `sandbox_permissions: "require_escalated"` を付け、operator の承認後にのみ実行する。
