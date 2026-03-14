# 引継ぎ書（次担当者向け）

更新日: **2026-03-14（v77本番 + `clasp run` 認証復旧反映版）**
対象: 枚方市介護支援専門員連絡協議会 会員システム

---

## ⚠️ Codex 引継ぎ担当者へ — 最初に必読

本書は **Claude Code → Codex（OpenAI）** への引継ぎ専用に整備した。
Codex と Claude Code では動作環境が異なるため、以下の注意事項を必ず守ること。

### Codex 固有の注意事項

| 項目 | 内容 |
|------|------|
| ブラウザ自動化 | Playwright MCP 利用可。GAS UI 手動操作が必要な場面（Manage Deployments 更新）は残る |
| デプロイ方法 | `clasp push` + `clasp version` は CLI。その後の Manage Deployments UI は**手動操作**が必要 |
| メモリ・セッション | Claude Code の `memory/` ファイルは参照不可。本書が唯一の引継ぎ資料 |
| 作業ディレクトリ | `C:\VSCode\CloudePL\hirakatacitykyougikaiIDE`（Windows） |
| シェル | PowerShell（必要に応じて bash 互換コマンドも可） |

---

## 1. 先に必ず読む文書（順番固定）

1. `docs/12_ENGINEERING_RULEBOOK.md`（**最上位ルール**。ここが全ての基準）
2. `docs/10_SOW.md`（スコープ・品質保証）
3. `docs/09_DEPLOYMENT_POLICY.md`（本番デプロイ標準・禁止事項）
4. `docs/17_ROOT_CAUSE_ERROR_RESPONSE_PLAYBOOK.md`（根本エラー対応の標準）
5. `docs/16_INCIDENT_clasp_run_permission_2026-03-14.md`（`clasp run` 障害の実例）
6. `docs/05_AUTH_AND_ROLE_SPEC.md`（認証/権限仕様・変更禁止）
7. `docs/04_DB_OPERATION_RUNBOOK.md`（DB運用）
8. `docs/03_DATA_MODEL.md`（スキーマ定義）

> 矛盾が生じたら上位文書を正とし、下位文書を即日修正する。

---

## 1.1 次担当者向け・最短状況サマリ（このまま新スレッドへ貼付可）

- 本番Web URLは固定2本（会員/公開）で **@77 同期済み**。
- `clasp run` 障害は、既定OAuthクライアントが組織でブロックされたことが原因。
- 復旧済み手順:
  - `npx clasp logout`
  - `npx clasp login --creds .tmp/oauth-client-uguisu-gas-exec.json --use-project-scopes --no-localhost`
  - `npx clasp run healthCheck` 成功、`npx clasp run getDbInfo` 成功を確認済み。
- 追加費用: この復旧対応自体では **発生なし**。
- 参照:
  - `docs/16_INCIDENT_clasp_run_permission_2026-03-14.md`
  - `docs/17_ROOT_CAUSE_ERROR_RESPONSE_PLAYBOOK.md`

---

## 2. プロジェクト概要

### 2.1 システム構成

| レイヤー | 技術 | 用途 |
|---|---|---|
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS | 会員マイページ・公開ポータル |
| Backend | Google Apps Script (GAS) + Google Spreadsheet | API + DB |
| メール | `MailApp.sendEmail`（GAS ネイティブ） | リマインダー・確認メール |
| 認証（会員） | ログインID + パスワード（SHA-256 ハッシュ） | `T_認証アカウント` テーブル |
| 認証（管理者） | Google アカウント + ホワイトリスト照合 | `checkAdminBySession_()` |

### 2.2 重要な固定値

| 項目 | 値 |
|---|---|
| Apps Script ID | `11YRlyWVgWRFw5_zByfLnA_vUlZzLeBSgiaanQCvZZoHMAfay8yK7RdkL` |
| DB スプレッドシート ID | `1GVlIzOG1Tsqw8fBXgZ__c8u4oMu-4_WCf0H3aVLESKs` |
| GCP プロジェクト | `uguisu-gas-exec-20260225191000` |
| 運用アカウント | `k.noguchi@uguisunosato.or.jp` |

---

## 3. 本番デプロイの現状（2026-03-14 v77 時点）

### 3.1 固定 Deployment ID（**絶対に変更禁止**）

| 用途 | Deployment ID | 現在 Version | URL |
|---|---|---|---|
| **会員マイページ** | `AKfycbzmnp5s0ulA9gWZuNUevcJirKXhpBU7mtwJLQDNb5dx1zEgdRZoEJweEPJlKOo4-AZa` | **@77** | `.../exec` |
| **公開ポータル** | `AKfycbz7YRgNXIYyHTvE9OJGq1h6g-5W94LsfNLYReTTWTdlfcLhQFaG9CM2Ro_i9AJ7eWwl` | **@77** | `.../exec?app=public` |

> **鉄則**: 2 つの Deployment ID は常に同一バージョンへ同時更新。片方だけ更新禁止。

### 3.2 最新リリース（v77）の変更内容

- 公開申込 API (`applyTrainingExternal_`) の `申込状態コード` を表示文言 `申込済` からコード値 `APPLIED` へ統一。
- 既存の v76 修正（公開取消 `CANCELED` 化）と合わせ、`M_申込状態` とのコード値整合を完了。
- v77 反映後、公開申込の新規受付成功（申込ID発行）を E2E で再確認。
- 詳細記録: `docs/15_INCIDENT_LOG_2026-03-14_v76.md`

---

## 4. 絶対ルール（違反禁止）

### 4.1 デプロイ

- `clasp deploy --deploymentId` **使用禁止**（Web App → API Executable に変換するバグあり）
- 本番更新は必ず **Apps Script UI の `Manage Deployments`** から手動操作
- 両 Deployment ID を **同時に同一バージョンへ更新**
- デプロイ後 `/exec` の疎通確認必須（404 のまま完了扱い禁止）

### 4.2 認証（変更禁止）

- **会員ログイン**: ログインID + パスワードのみ（Google ログイン不使用）
- **管理者ログイン**: `checkAdminBySession_()` → `Session.getActiveUser().getEmail()` → `T_管理者Googleホワイトリスト` 照合
- この 2 方式の分離は絶対に崩さない

### 4.3 DB 整合性

- 型定義・マスタ・シート列・API 実装は**常に同一変更セットで更新**
- `T_研修申込` は `申込者区分コード`（MEMBER/EXTERNAL）+ `申込者ID` のポリモーフィック設計を維持
- 既存の `会員ID` のみレコードは `backfillApplicationApplicantIdentity_()` で自動補完（`MEMBER` + `会員ID`）
- 既存 DB は「追記/移行で整合維持」（再作成前提禁止）

### 4.4 メール

- 既存リマインダーは `MailApp.sendEmail` を使用
- 管理コンソールの個別/一斉メール送信は `GmailApp.sendEmail` を使用（エイリアス送信元対応）
- スコープ: `script.send_mail` と `gmail.send` を `appsscript.json` で管理

### 4.5 ドキュメント

- 仕様変更時は実装と同時に正本ドキュメントを更新（後回し禁止）
- 正本一覧: `docs/00_DOC_INDEX.md` 参照

---

## 5. 標準コマンド

```bash
# ─── 前提確認 ───────────────────────────────────────
# 認証アカウント確認（必ず k.noguchi@uguisunosato.or.jp であること）
cd backend
npx clasp show-authorized-user

# `clasp run` が 403/404 の場合（認証復旧）
npx clasp logout
npx clasp login --creds .tmp/oauth-client-uguisu-gas-exec.json --use-project-scopes --no-localhost
npx clasp show-authorized-user

# 疎通確認
npx clasp run healthCheck
npx clasp run getDbInfo

# ─── フロントエンドビルド ─────────────────────────────
# 会員マイページ用ビルド（dist/ に出力）
npm run build

# GAS 組み込み用ビルド（backend/index.html, backend/index_public.html に出力）
npm run build:gas

# ─── GAS 反映手順 ────────────────────────────────────
# 1. コードをプッシュ
cd backend
npx clasp push --force

# 2. バージョン作成
npx clasp version "fix: <説明>"

# 3. デプロイ確認（両 ID が同じ @N であること）
npx clasp deployments

# 4. GAS UI で Manage Deployments → 両 ID を最新バージョンへ更新（手動）

# ─── DB 操作 ────────────────────────────────────────
# スキーマ再構築（スキーマ変更後に必要）
npx clasp run rebuildDatabaseSchema

# デモデータ投入
npx clasp run seedDemoData

# DB タイムゾーン設定（一度だけ実行。既に v74 で実施済み）
npx clasp run setSpreadsheetTimezone

# ─── ユーティリティ ───────────────────────────────────
# ドライランメール
npx clasp run dryRunTrainingReminderT001
npx clasp run sendTrainingReminderToNoguchiTest
```

---

## 6. デプロイ手順（詳細・Codex 向け）

### 6.1 通常リリース

```bash
# 1. ビルド
npm run build:gas

# 2. GAS へプッシュ
cd backend
npx clasp push --force

# 3. バージョン作成
npx clasp version "リリース内容を記述（v75 等）"

# 4. バージョン番号を確認
npx clasp versions
```

**以降は手動 UI 操作（Codex からは実行不可）:**

```
5. ブラウザで Apps Script エディタを開く
   https://script.google.com/home/projects/11YRlyWVgWRFw5_zByfLnA_vUlZzLeBSgiaanQCvZZoHMAfay8yK7RdkL/edit

6. Deploy > デプロイを管理

7. アクティブリストから「公開ポータル」の Deployment ID を選択
   → 編集 → バージョンを最新に変更 → デプロイ → 完了

8. アクティブリストから「会員マイページ」の Deployment ID を選択
   → 編集 → バージョンを最新に変更 → デプロイ → 完了

9. npx clasp deployments で両 ID の @N が一致していることを確認
```

### 6.2 疎通確認

```bash
# GAS 疎通
npx clasp run healthCheck
npx clasp run getDbInfo

# ブラウザ確認（手動）
# 公開ポータル: https://script.google.com/macros/s/AKfycbz7YRgNXIYyHTvE9OJGq1h6g-5W94LsfNLYReTTWTdlfcLhQFaG9CM2Ro_i9AJ7eWwl/exec?app=public
# 会員マイページ: https://script.google.com/macros/s/AKfycbzmnp5s0ulA9gWZuNUevcJirKXhpBU7mtwJLQDNb5dx1zEgdRZoEJweEPJlKOo4-AZa/exec
```

---

## 7. アーキテクチャ概要

### 7.1 URL ルーティング

```
/exec              → doGet() → app != 'public' → index.html   (会員マイページ)
/exec?app=public   → doGet() → app == 'public' → index_public.html (公開ポータル)
```

### 7.2 API 通信プロトコル

- 全リクエスト: `POST /exec` に JSON ボディ `{ action: string, payload?: object }`
- 全レスポンス: `{ success: boolean, data?: any, error?: string }`
- アクセス制御: `processApiRequest_()` で action ごとに認証チェック
  - 公開 API（認証不要）: `getPublicTrainings`, `applyTrainingExternal`, `cancelTraining`
  - 会員 API（セッション必須）: `getMemberDashboard`, `applyTraining`, 等
  - 管理 API（管理者セッション必須）: `saveTraining`, `sendTrainingMail`, 等

### 7.3 主要ファイル構成

```
hirakatacitykyougikaiIDE/
├── CLAUDE.md               # AI エージェント向け憲法（このファイルは保持する）
├── HANDOVER.md             # 本書
├── backend/
│   ├── Code.gs             # GAS バックエンド全体（単一ファイル）
│   ├── appsscript.json     # GAS マニフェスト
│   ├── index.html          # 会員マイページ HTML（ビルド成果物）
│   └── index_public.html   # 公開ポータル HTML（ビルド成果物）
├── src/
│   ├── member-portal/      # 会員マイページ React ソース
│   ├── public-portal/      # 公開ポータル React ソース
│   └── shared/             # 共通型定義・API ユーティリティ
├── docs/                   # 正本ドキュメント群
└── vite.config.ts          # Vite ビルド設定
```

- **バックエンド正本**: `backend/Code.gs` のみを編集対象とする（`Code.js` はGit管理対象外、`Code.ts` は廃止）。

---

## 8. DB スキーマ要点

### 8.1 主要テーブル

| テーブル | 用途 |
|---|---|
| `T_会員` | 個人会員・事業所会員のマスタ |
| `T_事業所職員` | 事業所に所属するスタッフ |
| `T_認証アカウント` | ログインID/パスワードハッシュ |
| `T_研修` | 研修マスタ（開催日・定員・費用JSON・項目設定JSON 等） |
| `T_研修申込` | 会員・外部申込者の申込（ポリモーフィック設計） |
| `T_外部申込者` | 公開ポータルから申し込んだ非会員の個人情報 |
| `T_管理者Googleホワイトリスト` | 管理者として許可された Google メール一覧 |

### 8.2 T_研修 の列順（DB_SCHEMA_VERSION = 2026-03-09-02）

```
研修ID, 研修名, 開催日, 開催終了時刻, 定員, 申込者数, 開催場所, 研修状態コード,
主催者, 法定外研修フラグ, 研修概要, 研修内容, 費用JSON,
申込開始日, 申込締切日, 講師, 案内状URL, 項目設定JSON,
作成日時, 更新日時, 削除フラグ
```

- `費用JSON`: `[{"label":"会員","amount":0},{"label":"非会員","amount":1000}]`
- `項目設定JSON`: `{"fieldConfig":null,"cancelAllowed":true,"inquiryPerson":"","inquiryContactType":"EMAIL","inquiryContactValue":""}`
- **開催形式コードは廃止**（列なし）

### 8.3 タイムゾーン（v74 で修正済み）

- DB スプレッドシートのタイムゾーン = `Asia/Tokyo`（`setSpreadsheetTimezone()` で設定済み）
- GAS 側も `Utilities.formatDate(val, 'Asia/Tokyo', ...)` で統一
- 新たに日時値を書き込む際は `Utilities.parseDate(str, 'Asia/Tokyo', fmt)` を使うこと

---

## 9. 認証仕様詳細

### 9.1 会員認証

```
ログインID + パスワード
→ T_認証アカウント で SHA-256 ハッシュ照合
→ セッション Cookie（GAS Session）でステート管理
```

### 9.2 管理者認証

```
Googleアカウントでアクセス
→ checkAdminBySession_() が Session.getActiveUser().getEmail() を取得
→ T_管理者Googleホワイトリスト のメールと照合
→ 一致すれば管理者セッション確立
```

- WL-001 登録アカウント: `k.noguchi@uguisunosato.or.jp`（sub: `110446186080909614640`）
- **GIS（Google Identity Services）は廃止**（GAS iframe sandbox では OAuth 不可）

---

## 10. 既知の課題・技術的負債

### 10.1 セキュリティ

| # | 内容 | 優先度 |
|---|------|--------|
| S-02 | パスワードハッシュが SHA-256 単回（OWASP 2025 は Argon2id 推奨。GAS 制約で移行困難） | 中 |
| S-03 | ログインロック解除が DB 直接編集のみ（管理画面に unlock 機能が必要） | 中 |
| S-04 | IDトークン直入力 UI（保守用）が本番でも表示される（環境変数フラグで非表示化推奨） | 低 |

> S-01（パスワード変更時の現在PW未検証）は解消済み（フロントエンド入力必須 + バックエンド照合実装）。

### 10.2 未実装機能

| # | 機能 |
|---|------|
| F-01 | パスワード初期化メール送信（DB 手動設定のみ） |
| F-02 | 振込先情報の会員向け UI |
| F-03 | 職員「退職済み」自動削除 |
| F-04 | キャンセル禁止設定の管理 UI（`cancelAllowed` フラグは DB に保存可だが管理画面なし） |

---

## 11. デモ用ログイン情報

| 種別 | ログインID | パスワード | 氏名 |
|---|---|---|---|
| 個人会員 | `12345678` | `demo1234` | 山田 太郎 |
| 個人会員 | `87654321` | `demo1234` | 鈴木 花子 |
| 事業所管理者 | `11223344` | `demo1234` | 佐藤 次郎 |
| 事業所スタッフ | `support-99999999-s2` | `demo1234` | — |

---

## 12. 開発再開チェックリスト

### 12.1 再開前

- [ ] `docs/12_ENGINEERING_RULEBOOK.md` を再読した
- [ ] `docs/09_DEPLOYMENT_POLICY.md` を再読した
- [ ] `cd backend && npx clasp show-authorized-user` が `k.noguchi@uguisunosato.or.jp` であることを確認した
- [ ] `npx clasp run healthCheck` が成功した
- [ ] `npx clasp run getDbInfo` が成功した

### 12.2 変更作業中

- [ ] DB 関連変更は「型/マスタ/シート/API」を同一変更セットで更新した
- [ ] 管理者=Google認証、会員=ID/パス認証の仕様を崩していない
- [ ] メール送信実装が仕様どおりである（リマインダー=MailApp / 管理コンソール=GmailApp）
- [ ] 変更内容を正本ドキュメントへ追記した

### 12.3 本番反映前

- [ ] `npm run build:gas` が成功した
- [ ] `npx clasp push --force` が成功した
- [ ] `npx clasp version "..."` で新バージョンを作成した

### 12.4 本番反映（GAS UI — 必ず 2 回実施）

- [ ] **公開ポータル** Deployment ID を最新バージョンに更新した
- [ ] **会員マイページ** Deployment ID を最新バージョンに更新した
- [ ] `npx clasp deployments` で両 ID の `@N` が一致していることを確認した

### 12.5 本番反映後

- [ ] 公開ポータル `/exec?app=public` を実ブラウザで確認し 404 でないことを確認した
- [ ] 会員マイページ `/exec` を実ブラウザで確認し 404 でないことを確認した
- [ ] `npx clasp run healthCheck` が成功した
- [ ] 変更内容を `HANDOVER.md` か関連正本へ記録した

---

## 13. 直近の変更履歴

| バージョン | 内容 |
|---|---|
| **v77** | 公開申込の申込状態コードを `APPLIED` に統一（表示文言混在を解消） |
| **v76** | 公開取消不具合修正（`申込状態コード: 取消` → `CANCELED`） |
| **v74** | DBスプレッドシートタイムゾーン Asia/Tokyo 設定・開催日時/終了時刻ズレ修正 |
| v73 | formatTimeOnly_() 追加・seedDemoData の開催日 Utilities.parseDate 対応 |
| v72 | 公開ポータル v72 両 ID デプロイ（前セッション作業） |
| v69 | 公開ポータル / 会員 URL 分離・2 Deployment 固定運用開始 |
| v67 | sendTrainingMail_ 戻り値修正（B-02） |
| v66 | sendTrainingMail_ DB参照 recipients 構築（B-01） |
| v65 | GmailApp → MailApp 切替（B-03） |
| v62 | T_外部申込者 フリガナ列追加 |

---

## 14. リリース記録（最新）

### 14.1 v77

- **実施日**: 2026-03-14
- **担当者**: Codex (GPT-5)
- **公開ポータル ID**: `AKfycbz7...eWwl` → @77
- **会員マイページ ID**: `AKfycbzm...AZa` → @77
- **備考**: 公開申込の `申込状態コード` を `APPLIED` に統一し、公開申込完了を再確認。

### 14.2 v76

- **実施日**: 2026-03-14
- **担当者**: Codex (GPT-5)
- **公開ポータル ID**: `AKfycbz7...eWwl` → @76
- **会員マイページ ID**: `AKfycbzm...AZa` → @76
- **備考**: 公開取消時の入力規則違反を解消。詳細は `docs/15_INCIDENT_LOG_2026-03-14_v76.md`。

### 14.3 v74

- **実施日**: 2026-03-13
- **担当者**: Claude Code (claude-sonnet-4-6)
- **Git コミット**: `0f2edc5`
- **公開ポータル ID**: `AKfycbz7...eWwl` → @74
- **会員マイページ ID**: `AKfycbzm...AZa` → @74
- **備考**: DBタイムゾーン修正。本番で `令和8年4月15日 10:00〜12:00` など正常表示を確認。
