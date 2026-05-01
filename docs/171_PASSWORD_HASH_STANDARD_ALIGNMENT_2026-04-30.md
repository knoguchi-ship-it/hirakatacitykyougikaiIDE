# Password Hash Standard Alignment

作成日: 2026-04-30
対象: 会員 `loginId + password` 認証

## 1. Purpose

会員ログイン方式は案件固定ルールにより `loginId + password` を維持する。その上で、保存済みパスワード検証子を現行標準へ近づけ、DB 漏えい時の offline cracking 耐性を上げる。

## 2. Current Standards Checked On 2026-04-30

- OWASP Password Storage Cheat Sheet:
  - 第一候補は Argon2id。
  - Argon2id が使えない場合は scrypt / bcrypt / PBKDF2 を検討。
  - PBKDF2-HMAC-SHA256 の目安は `600,000+` iterations。
- NIST SP 800-63B / SP 800-63-4:
  - パスワードは salted hash と cost factor を持つ適切な password hashing scheme で保存する。
  - cost factor は verifier 性能に悪影響を出さない範囲で高くし、時間とともに上げる。
  - verifier だけが保持する secret key による追加の keyed hashing を推奨する。
  - 単一要素パスワードは最小 15 文字。

References:

- https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
- https://pages.nist.gov/800-63-4/sp800-63b.html

## 3. Platform Constraint

Google Apps Script V8 には native Argon2id / scrypt / bcrypt がない。現行実装の PBKDF2-HMAC-SHA256 は `Utilities.computeHmacSha256Signature` で実装しているが、過去 benchmark では `10,000` iterations が GAS 実行時間制約内の現実値だった。

そのため、GAS 内だけで OWASP の PBKDF2-HMAC-SHA256 `600,000+` を満たすことは現実的ではない。標準を完全達成するには、外部 KDF / managed identity component の設計が必要。

## 4. Implemented Local Source Change

2026-04-30 のローカルソースでは以下を実装済み。未 deploy。

- Password verifier format:
  - Legacy SHA-256: existing rows only, verified for migration.
  - Legacy PBKDF2: `pbkdf2:sha256:<hex>`, verified for migration.
  - Versioned PBKDF2: `pbkdf2:sha256:<iterations>:<hex>`, verified for migration.
  - Pepper-protected verifier: `pbkdf2:sha256:<iterations>:pepper:<pepperId>:<hmacHex>`.
- Pepper:
  - Script Property key: `PASSWORD_HASH_PEPPER_V1`.
  - Must be set to the same random secret in integrated/public, member split, and admin split projects before production release.
  - The pepper is not stored in the DB.
  - The pepper value must not be committed to Git, written into handover/spec/docs/logs/chat, or included in generated artifacts.
- New password minimum length: 15 characters.
- Randomly generated initial/reissue passwords: 15 characters.
- Login and password-change paths support rehash-on-success.

## 5. Deployment Preconditions

Before releasing this change, set the same pepper value in all relevant Apps Script projects:

- integrated/public project
- member split project
- admin split project

The value must be generated with a cryptographically strong random generator and must not be committed to Git or written into handover documents.

If a pepper-protected hash exists but the project lacks `PASSWORD_HASH_PEPPER_V1`, password verification fails closed.

`.env` is not the production runtime source for this Apps Script system. Google Apps Script uses per-project Script Properties; a local `.env` may only be an ignored operator helper for setting properties and must never be committed or documented with the actual value.

## 6. Residual Gap

This is a material improvement and aligns with NIST's verifier-side keyed hash recommendation, but it is not full OWASP password-storage target compliance because:

- PBKDF2 remains at `10,000` iterations due to GAS constraints.
- The implementation is not memory-hard.
- Native Argon2id / scrypt is not available in Apps Script.

## 7. Next Architecture Task

Status: deferred on 2026-05-01, but mandatory. This task must remain in the project backlog and source documents until completed or replaced by an explicit alternative security design decision.

Design one of the following while preserving the user-facing `loginId + password` requirement:

1. Managed identity provider that can support the existing login identifier model and modern password storage.
2. Minimal external KDF/verifier service with Argon2id or scrypt, secret management, rate limiting, monitoring, and rollback.

Decision criteria:

- No plaintext password persistence.
- Authenticated protected channel only.
- Server-side verifier ownership.
- Strong rate limiting and lockout behavior.
- Auditability and rollback.
- Clear operational cost and Google Workspace compatibility.
