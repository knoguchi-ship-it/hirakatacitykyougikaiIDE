# 227. メール送信 4 階層ガード（Mail Kill Switch / Delivery Modes）

更新日: 2026-05-19（v371.1 デプロイ直後）
対象: 統合 public `@331` x2 / member split `@89` / admin split `@132`
コミット: 未コミット（v360-v370 + 本変更を 1 コミットでまとめる予定）

## 1. 背景

本番 DB をテスト環境として共用する運用中、入会申請・変更申請の承認テストやドライランテストで「**実際の宛先にメールが飛んでしまう**」課題が発生。即時の全停止と、ドライランテスト用に粒度の細かい制御が必要となった。

Web 検索（2026-05-18 取得）に基づくベストプラクティス：
- **Mailtrap** 流の SMTP 切替は GAS の `MailApp` 固定で不可
- → 等価機能を内製：**4 階層ガードモデル**
- パターン由来: Drupal Mail Redirect / Laravel `Mail::alwaysTo` / Postmark Per-category Stream / Defense in Depth

## 2. 設計：4 階層ガードモデル

```
[1] MAIL_GLOBAL_ENABLED          ← 全停止スイッチ（パニックボタン）
[2] MAIL_DELIVERY_MODE           ← LIVE / REDIRECT / SUPPRESS
[3] MAIL_REDIRECT_ALLOWLIST      ← REDIRECT モード時の宛先（CSV）
[4] {category}_ENABLED           ← カテゴリ別 ON/OFF（既存 9 + 補完 6）
```

判定順序（`mailDispatchPolicy_()` + `deliverMail_()`）:

1. **カテゴリ別フラグ** が false なら早期 SUPPRESS、ログのみ
2. **GLOBAL ENABLED** が false なら SUPPRESS
3. **MODE = SUPPRESS** なら SUPPRESS
4. **MODE = REDIRECT** なら allowlist に転送（件名・本文は加工せず、元宛先は Apps Script log に保持）
5. **MODE = LIVE**（default）なら通常送信

## 3. 動作モード一覧

| シナリオ | GLOBAL | MODE | ALLOWLIST | 結果 |
|---|---|---|---|---|
| **本番運用** | true | LIVE | — | 通常送信。カテゴリ別フラグに従う |
| **dryRun テスト** | true | REDIRECT | `kenta-noguchi@tadakayo.jp` | 全メールが allowlist 宛のみ。件名・本文は加工せず、元宛先は log で確認 |
| **静粛モード** | true | SUPPRESS | — | 全カテゴリ抑止、Logger に記録のみ |
| **緊急パニック** | false | (any) | — | 全停止（最優先・他設定無視） |

## 4. 設定キー一覧

### 新規 9 キー（v371.1 で追加）

| キー | 初期値 | 用途 |
|---|---|---|
| `MAIL_GLOBAL_ENABLED` | **`false`** | 全停止スイッチ（safe-stop default） |
| `MAIL_DELIVERY_MODE` | `LIVE` | LIVE / REDIRECT / SUPPRESS |
| `MAIL_REDIRECT_ALLOWLIST` | （空） | カンマ区切り宛先 |
| `TRAINING_APPLY_RECEIPT_ENABLED` | `true` | 研修申込確認 |
| `TRAINING_REMINDER_ENABLED` | `true` | 研修リマインダー |
| `BULK_MAIL_ENABLED` | `true` | 一括メール送信 |
| `AUTH_OTP_ENABLED` | `true` | 公開ポータル OTP |
| `MEMBER_UPDATE_CONFIRM_ENABLED` | `true` | 会員情報変更確認 |
| `WITHDRAWAL_CONFIRM_ENABLED` | `true` | 退会申請受付確認 |

### 既存 9 カテゴリ（変更なし・並列維持）

`CREDENTIAL_EMAIL_*` / `IND_SUPP_EMAIL_*` / `BIZ_REP_EMAIL_*` / `BIZ_STAFF_EMAIL_*` /
`STAFF_ADD_REP_EMAIL_*` / `STAFF_ADD_STAFF_EMAIL_*` /
`APPLICATION_RECEIPT_*` / `APPROVAL_NOTIFICATION_*` / `REJECTION_NOTIFICATION_*`

## 5. メール送信箇所と category 割り当て

| ファイル位置 | カテゴリ | 送信内容 |
|---|---|---|
| `gas-src/Code.full.gs:2348` | `BULK_MAIL` | 一括メール送信 |
| `:8553` | `APPLICATION_RECEIPT` | 変更申請受付確認 |
| `:8577` | `APPROVAL_NOTIFICATION` | 変更申請承認通知 |
| `:8601` | `REJECTION_NOTIFICATION` | 変更申請却下通知 |
| `:14408` | `TRAINING_APPLY_RECEIPT` | 研修申込確認 |
| `:14561` | `AUTH_OTP` | 公開ポータル OTP |
| `:14661` | `MEMBER_UPDATE_CONFIRM` | 公開ポータル 会員情報変更確認 |
| `:14726` | `WITHDRAWAL_CONFIRM` | 公開ポータル 退会受付確認 |
| `:14854` | `MEMBER_UPDATE_CONFIRM` | 事業所登録情報変更確認 |
| `:25645` | `TRAINING_REMINDER` | 研修リマインダー（segmented） |

その他 `createMemberApplicationDirect_` 内で `sendEmailWithValidatedFrom_` を直接呼び出している入会承認時メール群（事業所職員 credential メール / 個人賛助 credential メール）は、既存の `CREDENTIAL_EMAIL_ENABLED` / `BIZ_REP_EMAIL_ENABLED` / `BIZ_STAFF_EMAIL_ENABLED` / `IND_SUPP_EMAIL_ENABLED` で個別判定後、最終的に `sendEmailWithValidatedFrom_` 経由で送信されるが、これは `deliverMail_` のラップ外。**そのため GLOBAL/MODE/REDIRECT は効かない**。要追加対応（次期リリース候補）。

→ **暫定対応**: dryRun テスト時は対応する個別フラグ（CREDENTIAL_EMAIL_ENABLED 等）を OFF にする。

## 6. 実装ファイル

| ファイル | 変更内容 |
|---|---|
| `gas-src/Code.full.gs` | `mailDispatchPolicy_()` + `deliverMail_()` 追加 / 10 箇所置換 / `getSystemSettings_` + `updateSystemSettings_` 拡張 / `initializeSchema_` に mailGuardDefaults 追加 / DB_SCHEMA_VERSION bump |
| `backend/Code.gs` | build:gas 出力（public 用 prune） |
| `gas/admin/Code.gs` | build:gas:admin 出力（admin 用 prune） |
| `gas/member/Code.gs` | build:gas:member 出力（member 用 prune） |
| `src/types.ts` | SystemSettings に 9 フィールド追加 |
| `src/App.tsx` | useState 9 個 / load mapping / save payload / UI セクション追加 |

## 7. 運用手順

### テスト時：dryRun モード復帰
1. admin → システム設定 → メール通知タブ → 「メール送信制御」セクション
2. グローバルキルスイッチを ON
3. 配信モード を `REDIRECT` に
4. Redirect allowlist に `kenta-noguchi@tadakayo.jp` を入力
5. 「設定を保存」
6. → 全カテゴリのメールが野口さん宛のみに集約。件名・本文は実送信時と同じ表示になる

### 本番運用復帰
1. グローバルキルスイッチ ON
2. 配信モード `LIVE`
3. 必要に応じてカテゴリ別 ENABLED を調整
4. 「設定を保存」

### 緊急停止（パニックボタン）
1. グローバルキルスイッチ OFF
2. 「設定を保存」
3. → 即時全停止（即時反映、再デプロイ不要）

## 8. 既知の制約

1. **入会承認時の credential メール（事業所職員・個人賛助）** は `deliverMail_` 経由ではないため GLOBAL/MODE/REDIRECT が効かない。既存 `CREDENTIAL_EMAIL_ENABLED` 等で個別制御。次期リリースで `deliverMail_` 経由に統一予定。
2. **REDIRECT 時の元宛先確認**: 件名・本文は実送信時と同じ表示にするため加工しない。元宛先は Apps Script log の `deliverMail_ REDIRECT ... originalTo=...` で確認する。
3. **キャッシュ TTL**: getSystemSettingMap_ は内部キャッシュ TTL 5 分。設定変更後 5 分以内に反映するため、急ぎなら admin で「設定を保存」を再実行（`clearAllDataCache_` が走る）。

## 9. ロールバック手順

万が一不具合発生時:
1. 全 4 deployment を v371 (@330/@88/@131) に redeploy 戻し
2. ただし新規 9 設定キーは T_システム設定 に残る（idempotent）
3. v370 (@329/@87/@129) に完全戻しは可能だが、DB_SCHEMA_VERSION 差分が残るため初回アクセス時に schema 初期化が再走する（副作用なし）

## 10. 参照

- Web 検索（2026-05-18 取得）:
  - Mailtrap Email Sandbox / Best Practices 2026
  - Postmark Transactional Email Best Practices 2026
  - Moosend Transactional Email Best Practices 2026
  - Drupal Mail Redirect module
  - Laravel `Mail::alwaysTo` capture-and-redirect pattern
  - Sendwithus Best Practices for Unit Testing Emails
- 内部設計参考:
  - `docs/05_AUTH_AND_ROLE_SPEC.md` — 3 境界モデル
  - `docs/12_ENGINEERING_RULEBOOK.md` — 最上位ルール
  - `memory/feedback_no_destructive_db_ops.md` — DB 全削除許可制
