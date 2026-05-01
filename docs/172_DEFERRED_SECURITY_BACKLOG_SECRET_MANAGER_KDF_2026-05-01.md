# Deferred Security Backlog: Secret Manager / External KDF

作成日: 2026-05-01
状態: 保留。ただし必須 backlog。

## 1. 決定

パスワード hash pepper の Google Cloud Secret Manager 化、および Apps Script 内 PBKDF2 制約を解消する外部 KDF / managed identity の採否決定は、いったん次作業へ進むため保留する。

ただし、このタスクは破棄しない。完了、または同等以上のセキュリティ水準を満たす明示的な代替設計決定が記録されるまで、必須 security backlog として扱う。

## 2. 現時点の本番前提

- 短期の本番方式は Apps Script Script Properties に `PASSWORD_HASH_PEPPER_V1` を設定する方式。
- integrated/public・member split・admin split の 3 project に同一の強乱数 pepper を設定する。
- pepper の値は Git、handover、docs、ログ、チャット、生成物へ記録しない。
- `.env` は Apps Script 本番 runtime の正本にしない。
- 未設定 project がある場合、password verifier / credential generation 変更を含む release は不可。

## 3. 保留タスク

1. Secret Manager へ pepper の保存先を移す設計を作成する。
2. Apps Script から Secret Manager を読むための IAM、OAuth scope、API 有効化、監査、障害時 fail-closed 方針を決める。
3. 移行期間に Script Properties fallback を使う場合、期限と撤去条件を決める。
4. Apps Script 内 PBKDF2 の制約を解消するため、外部 KDF / managed identity の採否を判断する。
5. 採用する場合は、ログイン、パスワード変更、初期発行、再発行、ロック、監査、レート制限、rollback を含む設計へ進む。

## 4. 影響範囲

- `gas-src/Code.full.gs` の `getPasswordPepper_()` 周辺。
- generated artifacts: `backend/Code.gs`, `gas/member/Code.gs`, `gas/admin/Code.gs`。
- Apps Script manifest / OAuth scopes。
- GCP project IAM / Secret Manager API。
- deployment policy と release pre-check。
- 認証仕様、データモデル、運用手順。

## 5. 再開条件

- password storage の標準整合をさらに上げる判断を行うとき。
- GCP IAM / Secret Manager の運用体制を整えるとき。
- Apps Script 実行時間制約により PBKDF2 iteration を上げられないことが release risk と判断されたとき。
- 第三者評価、監査、または運用者判断で secret lifecycle 管理の強化が必要になったとき。

## 6. 関連資料

- `docs/171_PASSWORD_HASH_STANDARD_ALIGNMENT_2026-04-30.md`
- `docs/learning/13_password_pepper_secret_management_2026-04-30.html`
- `docs/05_AUTH_AND_ROLE_SPEC.md`
- `docs/09_DEPLOYMENT_POLICY.md`
- `AGENTS.md`
- `GLOBAL_GROUND_RULES/docs/AI_RULES/05_PROJECT_RULES_HIRAKATA.md`
