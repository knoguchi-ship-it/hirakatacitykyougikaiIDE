# Task: 入会申込完了画面の「ログイン情報」メッセージを管理設定化

起票日: 2026-04-21  
優先度: MEDIUM  
状態: 未着手

---

## 要件（ユーザー指示）

入会申込完了画面に表示される「ログイン情報」セクションについて、管理者が設定画面から制御できるようにする。

### 現状の画面（スクリーンショット確認済み）

```
今後のご案内
各職員のメールアドレスにログイン情報を送信しました。
年会費や振込先などのご案内は、登録メールアドレスをご確認ください。
申込内容を事務局で確認し、追加確認が必要な場合のみご連絡します。

ログイン情報
ログイン情報は画面に表示していません。登録済みのメールをご確認ください。
```

### 要件詳細

1. **表示・非表示の制御**: 「ログイン情報」セクション全体を ON/OFF できる
2. **メッセージ内容の変更**: 表示するテキストを管理画面から変更できる
3. **会員マイページ未公開時の対応**: 現在は「ログイン情報は画面に表示していません」と表示しているが、会員マイページ公開後はメッセージ内容を変える想定

---

## 技術調査（次担当者が実施すること）

### Web検索で確認すべき事項

- GAS CacheService + T_システム設定 を使った設定管理のベストプラクティス（2026年最新）
- React コンポーネントの条件付きレンダリングとアクセシビリティ（WCAG 2.2 AA）
- 管理者向け設定UIのUXパターン（プレビュー付き編集フォーム等）

### 既存の類似実装（参考にすること）

`PUBLIC_PORTAL_COMPLETION_LOGIN_INFO_VISIBLE` が既に `T_システム設定` に存在する。

**Code.gs** 該当箇所:
```js
var completionLoginInfoVisibleRaw = m['PUBLIC_PORTAL_COMPLETION_LOGIN_INFO_VISIBLE'];
var publicPortalCompletionLoginInfoVisible = completionLoginInfoVisibleRaw === undefined || completionLoginInfoVisibleRaw === ''
  ? PUBLIC_PORTAL_DEFAULTS.completionLoginInfoVisible
  : String(completionLoginInfoVisibleRaw) !== 'false';
```

`PUBLIC_PORTAL_DEFAULTS` にデフォルト値が定義されている。  
`getSystemSettings_` / `saveSystemSettings_` / `batchUpsertSystemSettings_` で読み書き可能。

### 追加が必要な設定キー（案）

| キー | 型 | 説明 | デフォルト |
|---|---|---|---|
| `PUBLIC_PORTAL_COMPLETION_LOGIN_INFO_VISIBLE` | boolean | セクション表示ON/OFF | `true`（既存） |
| `PUBLIC_PORTAL_COMPLETION_LOGIN_INFO_MESSAGE` | string | ログイン情報セクションのメッセージ文言 | 現在のハードコード文字列 |
| `PUBLIC_PORTAL_COMPLETION_NOTICE_MESSAGE` | string | 「今後のご案内」本文 | 現在のハードコード文字列 |

---

## 実装箇所

### 1. `backend/Code.gs`

- `PUBLIC_PORTAL_DEFAULTS` に新キーのデフォルト値を追加
- `getSystemSettings_()` の return オブジェクトに新フィールドを追加
- `saveSystemSettings_()` の updates 配列に新キーの保存処理を追加
- `initializeSystemSettings_()` に新キーの初期値登録を追加

### 2. フロントエンド（公開ポータル側）

該当コンポーネント: 入会申込完了画面（`src/` 内の `Application` または `PublicPortal` 系コンポーネント）

- `systemSettings.publicPortalCompletionLoginInfoMessage` 等を props として受け取る
- `publicPortalCompletionLoginInfoVisible === false` 時はセクションを非表示
- メッセージ文言をハードコードからシステム設定値に変更

### 3. 管理者設定画面

`admin-settings` ビューの「公開ポータル設定」セクションに追加:
- 「ログイン情報セクション 表示/非表示」トグル
- 「ログイン情報メッセージ」テキストエリア（文字数制限 200字程度）
- 「今後のご案内メッセージ」テキストエリア
- プレビュー表示（任意・推奨）

---

## リリース手順

```bash
npm run typecheck
npm run build:gas           # 統合（公開）プロジェクト
npm run build:gas:member    # 会員 split（Code.gs 変更のため）
npm run build:gas:admin     # 管理者 split（Code.gs 変更 + 管理UI追加）

# 統合（公開）
npx clasp push --force
npx clasp version "v252 入会完了画面ログイン情報メッセージ設定化"
npx clasp redeploy AKfycbywpWoYxij6A... --versionNumber <N>
npx clasp redeploy AKfycbxyuUXgK1oHU... --versionNumber <N>

# 会員 split
cd gas/member && npx clasp push --force && npx clasp version "..."
npx clasp redeploy AKfycbxd... --versionNumber <N>

# 管理者 split
cd gas/admin && npx clasp push --force && npx clasp version "..."
npx clasp redeploy AKfycbwS... --versionNumber <N>
```

---

## ベストプラクティス指針（次担当者への推奨）

1. **設定値のキャッシュ**: `CacheService` TTL 600s で既存パターン踏襲（`ALL_DATA_CACHE_TTL_SECONDS`）
2. **文言の文字数制限**: frontend / backend 両方で検証。XSS対策は GAS HTML テンプレートで自動エスケープ
3. **デフォルト値の後方互換**: 既存の `PUBLIC_PORTAL_COMPLETION_LOGIN_INFO_VISIBLE` 値を壊さないこと
4. **管理UIのUX**: 変更後すぐプレビューできる「リアルタイムプレビュー」または「プレビューボタン」を推奨
5. **空文字保存時のフォールバック**: 空文字保存時は `PUBLIC_PORTAL_DEFAULTS` の値に戻す（既存パターン踏襲）

---

## 現在のシステム状態（引継ぎ時点: v251）

- 統合（公開）: `@250` / 会員 split: `@3` / 管理者 split: `@4`
- 会員マイページ: 未公開（意図的）。完了画面のメッセージは「ログイン情報は画面に表示していません」
- `CREDENTIAL_EMAIL_ENABLED` = true: 入会申込時にログイン情報メールは送信済み
