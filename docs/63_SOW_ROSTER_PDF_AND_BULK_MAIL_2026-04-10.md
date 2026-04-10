# SOW: PDF名簿出力 & 会員一括メール送信機能

作成日: 2026-04-10
最終更新: 2026-04-10
ステータス: **Phase 2 完了・Phase 3 未着手**
現行本番: v195（Phase 2 完了）
参照先: `docs/10_SOW.md`（親SOW）、`docs/02_ARCHITECTURE.md`、`docs/03_DATA_MODEL.md`

---

## 1. 目的・背景

事務局が会員に対して行う以下の定型業務を、管理コンソール上で完結できるようにする。

| 業務 | 現状 | 本機能後 |
|---|---|---|
| 事業所ごとの会員名簿作成 | 手作業（スプレッドシート手編集） | テンプレートSSからPDF自動生成・ZIP一括DL |
| 個人・賛助会員の情報票出力 | 手作業 | 同上 |
| 会員への一括メール送信 | 手作業（Gmailから個別送信） | 管理コンソールから差し込み・添付付き一括送信 |

---

## 2. スコープ

### 2.1 機能A: PDF名簿出力コンソール

- 管理コンソールに新メニュー「名簿出力コンソール」を追加（MASTER / ADMIN 限定）
- 会員種別・在籍状態・年会費ステータス（当年度、事業所会員本体ベース）でフィルタ
- 一覧からチェックボックスで対象を選択（全選択・全解除・種別ごと全選択ボタン付き）
- 「ZIP生成・ダウンロード」ボタン押下でバックエンド処理を実行
- スプレッドシートテンプレート（管理者が事前にDriveへ準備・IDをシステム設定に登録）を使用してPDF化
- 選択した全対象のPDFをZIPで一括ダウンロード

#### 選択単位と出力内容

| 会員種別 | チェックボックス単位 | PDF 1枚の内容 |
|---|---|---|
| 個人会員 (INDIVIDUAL) | 会員1名ごと | T_会員 の本人情報 |
| 賛助会員 (SUPPORT) | 会員1名ごと | T_会員 の本人情報 |
| 事業所会員 (BUSINESS) | **事業所ごと**（T_会員 1行） | 事業所情報 + 在籍職員一覧（T_事業所職員）|

> 事業所会員は事業所単位でチェック。職員一覧はPDF内容として自動展開。選択画面では職員個人を行として表示しない。

#### 年会費ステータスの扱い

- 事業所会員: T_会員(BUSINESS) ベースの T_年会費納入履歴（当年度）で判定・表示
- 職員個人の年会費状態は表示・フィルタに使用しない
- 個人会員・賛助会員: T_会員 ベース

### 2.2 機能B: 会員一括メール送信コンソール

- 管理コンソールに新メニュー「一括メール送信コンソール」を追加（MASTER / ADMIN 限定）
- 会員種別・在籍状態・メール配信希望（事業所職員のみ）でフィルタ
  - **年会費ステータスによるフィルタは設けない**
- 宛先一覧からチェックボックスで対象を選択
- 件名・本文を差し込みタグ形式で編集
- 送信元アドレスをエイリアス含めて選択可能（`GmailApp.getAliases()`）
- 共通添付ファイル（ブラウザから手動選択）
- Driveフォルダからの個別自動添付（ファイル名に姓名（スペースなし）が含まれるファイルを1件照合）
- 個人ごとの追加添付ファイル（手動追加）
- 送信後に `T_メール送信ログ` へバッチ記録
- 送信ログの閲覧権限は `T_システム設定.EMAIL_LOG_VIEWER_ROLE` で動的設定（MASTER のみ変更可）

---

## 3. 宛先解決モデル（確定）

```
T_会員 (INDIVIDUAL) → 代表メールアドレス    名前: 姓+名
T_会員 (SUPPORT)    → 代表メールアドレス    名前: 姓+名
T_会員 (BUSINESS)
  └─ T_事業所職員 [メール配信希望コード ≠ 'NO']
                  → メールアドレス          名前: 姓+名（スペースなし）
```

- `T_会員(BUSINESS).代表メールアドレス` は事業所代表連絡先。一括メール送信には使用しない。
- `T_事業所職員.メール配信希望コード` が `'NO'` の職員はデフォルトで除外。
- `NULL` / 空 = `'YES'` と同等に扱う（v133 設計方針に準拠）。
- 「全員（NO含む）」選択時は画面上に `⚠ オプトアウトN名を含みます` 警告を表示。

---

## 4. 差し込みタグ仕様（確定）

| タグ | INDIVIDUAL / SUPPORT | BUSINESS_STAFF |
|---|---|---|
| `{{氏名}}` | T_会員.姓+名 | T_事業所職員.姓+名 |
| `{{事業所名}}` | T_会員.勤務先名（空の場合は空文字） | T_会員.勤務先名（親事業所） |
| `{{会員番号}}` | T_会員.会員ID | T_会員.会員ID（親事業所） |

---

## 5. Drive 自動添付のファイル名照合ルール（確定）

- 照合キー: `姓+名`（スペースなし。例: `"山田太郎"`）
- 生成ルール:
  - INDIVIDUAL/SUPPORT: `T_会員.姓 + T_会員.名`（空の場合は `T_会員.姓名` または空白）
  - BUSINESS_STAFF: `T_事業所職員.姓 + T_事業所職員.名`（空の場合は `T_事業所職員.氏名` fallback）
- 照合方法: `ファイル名.indexOf(照合キー) >= 0`（部分一致、先頭1件）
- 照合失敗: その受信者への自動添付をスキップ（エラーにしない）
- 結果報告: 送信完了後に `{ autoAttachMissed: ["山田太郎", ...] }` をフロントに返して表示

---

## 6. フィルタ仕様（確定）

### 機能A（PDF名簿出力）

| フィルタ | 対象 | 選択肢 |
|---|---|---|
| 会員種別 | 全種別 | INDIVIDUAL / SUPPORT / BUSINESS（複数選択可） |
| 在籍状態 | 個人・賛助: T_会員.会員状態コード / 事業所: T_会員.会員状態コード | 在籍中 / 退会予定 / すべて |
| 年会費ステータス | 全種別（事業所は本体ベース） | すべて / 未納のみ / 納入済みのみ |

### 機能B（一括メール送信）

| フィルタ | 対象 | 選択肢 |
|---|---|---|
| 会員種別 | 全種別 | INDIVIDUAL / SUPPORT / BUSINESS（複数選択可） |
| 在籍状態（個人・賛助） | T_会員.会員状態コード | 在籍中 / すべて |
| 在籍状態（事業所職員） | T_事業所職員.職員状態コード | 在籍中 / すべて |
| メール配信希望 | 事業所職員のみ | 希望者のみ（推奨）/ 全員（⚠警告付） |
| メールアドレスなし | 全種別 | 除外（推奨・デフォルト）/ 含める |

---

## 7. システム設定追加項目（確定）

新たに T_システム設定 へ追加する設定キー。

| 設定キー | 初期値 | 説明 | 変更可能権限 |
|---|---|---|---|
| `ROSTER_TEMPLATE_SS_ID` | （空） | 名簿テンプレートスプレッドシートID | MASTER / ADMIN |
| `BULK_MAIL_AUTO_ATTACH_FOLDER_ID` | （空） | 一括メール個別自動添付DriveフォルダID | MASTER / ADMIN |
| `EMAIL_LOG_VIEWER_ROLE` | `MASTER` | メール送信ログ閲覧権限 | **MASTER のみ** |

`updateSystemSettings_` はキー別に権限チェックを行い、`MASTER_ONLY_KEYS` リストに含まれるキーは
`adminLevel === 'MASTER'` でなければ更新を拒否する。

---

## 8. 新規 DB テーブル

### T_メール送信ログ

| 列名 | 型 | 説明 |
|---|---|---|
| ログID | UUID | 主キー |
| 送信日時 | ISO8601 | 送信実行日時 |
| 送信者メール | string | from アドレス（エイリアス含む） |
| 件名テンプレート | string | 差し込み前の件名テンプレート |
| 宛先数 | integer | 送信対象の総数 |
| 成功数 | integer | 送信成功数 |
| エラー数 | integer | 送信失敗数 |
| 送信種別 | string | `BULK_MEMBER` / `TRAINING` 等 |
| 削除フラグ | boolean | 論理削除 |

> プライバシー保護方針: 個人メールアドレス・本文は記録しない（OWASP GenAI sensitive data disclosure 対策）。

---

## 9. 新規 GAS API Actions

| action | 権限 | 説明 |
|---|---|---|
| `getMembersForRoster` | MASTER / ADMIN | PDF名簿出力用対象一覧取得（フィルタ付き） |
| `generateRosterZip` | MASTER / ADMIN | テンプレートSS → PDF → ZIP生成 → DriveURL返却 |
| `getMembersForBulkMail` | MASTER / ADMIN | 一括メール用宛先一覧取得（フィルタ付き） |
| `sendBulkMemberMail` | MASTER / ADMIN | 会員一括メール送信 + 送信ログ記録 |
| `getEmailSendLog` | 設定依存 | メール送信ログ取得（`EMAIL_LOG_VIEWER_ROLE` で動的チェック） |

既存の `sendTrainingMail` / `getAdminEmailAliases` は変更しない。

---

## 10. OAuth スコープ変更

### 追加が必要なスコープ

| スコープ | 用途 | 影響 |
|---|---|---|
| `https://www.googleapis.com/auth/gmail.send` | GmailApp.sendEmail（エイリアス送信） | **本番管理者の再認証が発生** |
| `https://www.googleapis.com/auth/drive` | Drive テンプレート・添付フォルダへのアクセス | 同上 |

現在の `drive.file`（スクリプト作成ファイルのみ）では、管理者が準備したテンプレートSSや
添付フォルダへのアクセスが不可のため `drive`（フルアクセス）への昇格が必要。

> **承認事項**: スコープ昇格は本番 push 前にユーザー承認を得ること。

---

## 11. フロントエンド構成

### 新規コンポーネント

| ファイル | 役割 |
|---|---|
| `src/components/RosterExport.tsx` | PDF名簿出力コンソール |
| `src/components/BulkMailSender.tsx` | 会員一括メール送信コンソール |

### 既存変更ファイル

| ファイル | 変更内容 |
|---|---|
| `src/components/Sidebar.tsx` | 「名簿出力コンソール」「一括メール送信コンソール」メニュー追加（isFullAdmin 条件） |
| `src/App.tsx` | `roster-export` / `bulk-mail` ルーティング追加、新コンポーネント呼び出し |
| `src/shared/types.ts` | `RosterTarget`, `BulkMailRecipient`, `EmailSendLog` 型追加 |
| `src/services/api.ts` | 新API呼び出しメソッド追加 |

### サイドバーメニュー追加位置

```
管理コンソール（会員管理）
年会費管理コンソール
研修管理コンソール
──── 追加 ────────────────────
名簿出力コンソール          ← 新規（isFullAdmin）
一括メール送信コンソール    ← 新規（isFullAdmin）
──────────────────────────────
管理コンソール（システム権限）
システム設定
```

---

## 12. 実装フェーズ（確定）

### Phase 1: 基盤整備 ✅ 完了（v194 / 2026-04-10）

- [x] `backend/appsscript.json` に `gmail.send` / `drive` スコープ追加
  - **本番管理者は次回 /exec アクセス時に同意画面が表示される → 承認必須**
- [x] GAS: `T_システム設定` へ3キー追加（`insertSystemSettingKeysForV194` 実行済み）
- [x] GAS: `T_メール送信ログ` シート新設（`createEmailLogSheet` 実行済み・9列）
- [x] GAS: `updateSystemSettings_` にキー別権限チェック追加（`EMAIL_LOG_VIEWER_ROLE` は MASTER のみ）
- [x] フロントエンド: システム設定画面に3項目追加（MASTER のみ `EMAIL_LOG_VIEWER_ROLE` 表示）
- [x] `npm run typecheck` / `npm run build:gas` PASS
- [x] リリース: v194（両 deployment @194 確認済み）

### Phase 2: 一括メール送信コンソール ✅ 完了（v195 / 2026-04-10）

- [x] GAS: `getMembersForBulkMail_` 実装
  - T_会員（INDIVIDUAL/SUPPORT）+ T_事業所職員（BUSINESS）フラット展開
  - フィルタ: 種別・在籍状態・メール配信希望コード・メール未登録除外
- [x] GAS: `sendBulkMemberMail_` 実装
  - `GmailApp.sendEmail` でエイリアス送信（from 検証付き）
  - 共通添付（base64）+ Drive自動添付（姓名部分一致・先頭1件）+ 個人追加添付
  - `T_メール送信ログ` に記録（個人情報なし）
- [x] GAS: `getEmailSendLog_` 実装（`EMAIL_LOG_VIEWER_ROLE` 動的チェック）
- [x] フロントエンド: `BulkMailSender.tsx` 実装
  - フィルタパネル（種別・在籍状態・配信希望・メール未登録除外）
  - 宛先一覧（チェックボックス・全選択・opt-out警告・個人別添付）
  - 差し込みタグエディタ（件名・本文・タグ挿入ボタン）
  - エイリアス選択セレクト・共通添付・Drive自動添付ON/OFF
  - 送信確認ダイアログ → 送信結果表示（成功数・失敗・自動添付未マッチ一覧）
  - 送信ログ表示（EMAIL_LOG_VIEWER_ROLE 権限チェック）
- [x] `Sidebar.tsx` / `App.tsx` ルーティング追加
- [x] `npm run typecheck` / `npm run build:gas` PASS
- [x] リリース: v195（両 deployment @195 確認済み）

### Phase 3: PDF名簿出力コンソール（テンプレートSS準備後）

**前提条件**: `ROSTER_TEMPLATE_SS_ID` がシステム設定に登録済みであること

- [ ] GAS: `getMembersForRoster_` 実装
  - T_会員（全種別）をフィルタして返却
  - 事業所会員は在籍職員数を付加（PDF内容の予告表示用）
  - 年会費ステータスは T_会員(BUSINESS) ベース
- [ ] GAS: `generateRosterZip_` 実装
  - テンプレートSSを一時コピー
  - 種別ごとにデータ充填 → `SpreadsheetApp.flush()` → `UrlFetchApp` でPDF blob取得
  - 全blob → `Utilities.zip()` → Drive 一時保存 → DL URL 返却
  - タイムアウト対策: 対象50件超の場合は分割処理（ユーザーに分割指示を表示）
  - 一時コピーは処理後即削除
- [ ] フロントエンド: `RosterExport.tsx` 実装
  - フィルタパネル
  - 対象一覧（会員種別タブ切り替え＋チェックボックス）
  - ZIP生成中のプログレス表示
  - ダウンロードリンク表示
- [ ] `npm run typecheck` / `npm run build:gas` PASS
- [ ] リリース: v196（または後続版）

---

## 13. 完了条件

各フェーズの完了条件は `docs/44_DEVELOPMENT_HANDOVER_PLAYBOOK_2026-04-04.md` §5 の標準基準に加え：

### Phase 1 完了条件
- `npx clasp run healthCheck` PASS
- システム設定画面で3キーが表示・保存できること
- ADMIN ログインで `EMAIL_LOG_VIEWER_ROLE` 変更フィールドが表示されないこと
- `T_メール送信ログ` シートがDBに存在すること

### Phase 2 完了条件
- 個人会員・賛助会員・事業所会員職員が宛先一覧に正しく展開されること
- `メール配信希望コード='NO'` の職員がデフォルトで除外されること
- エイリアス選択で送信元が変わること（`GmailApp.sendEmail` 確認）
- Drive自動添付: 姓名スペースなし照合で正しいファイルが添付されること
- `T_メール送信ログ` に送信結果が記録されること
- MASTER のみ送信ログを閲覧できること

### Phase 3 完了条件
- テンプレートSSが存在しない場合、エラーメッセージが適切に表示されること
- 事業所会員のPDFに職員一覧が展開されること
- 個人・賛助会員の個人票PDFが生成されること
- ZIPダウンロードが正常に完了すること
- Drive 一時コピーが処理後に削除されていること

---

## 14. 未解決・要確認事項

| 項目 | 状態 | 担当 |
|---|---|---|
| テンプレートSS の構造（シート名・充填セル範囲） | **未確定** | ユーザー（事務局）側でSS準備後に確認 |
| テンプレートSS の Drive ID | **未登録** | Phase 3 着手前にシステム設定へ登録 |
| PDF 分割処理のしきい値（50件）の妥当性 | 暫定 | Phase 3 実装時にGASタイムアウト計測後調整 |

---

## 15. 引継ぎ時の再開手順

1. このドキュメントを読む
2. `HANDOVER.md` で現在の本番 version と fixed deployment を確認する
3. 再開時チェック（`docs/44_DEVELOPMENT_HANDOVER_PLAYBOOK_2026-04-04.md` §3）を実施する
4. 「12. 実装フェーズ」のチェックボックスで未完了フェーズ・タスクを確認する
5. 未完了の最初のタスクから着手する

---

## 16. 関連正本

| 文書 | 参照理由 |
|---|---|
| `docs/10_SOW.md` | 親SOW・統一仕様・品質保証基準 |
| `docs/02_ARCHITECTURE.md` | API action 一覧・GAS通信プロトコル |
| `docs/03_DATA_MODEL.md` | T_会員・T_事業所職員・T_システム設定スキーマ |
| `docs/09_DEPLOYMENT_POLICY.md` | リリース手順 |
| `docs/44_DEVELOPMENT_HANDOVER_PLAYBOOK_2026-04-04.md` | 完了条件・証跡要件 |
| `docs/37_GAS_QUOTAS_AND_LIMITS.md` | GASクォータ・タイムアウト制約 |
