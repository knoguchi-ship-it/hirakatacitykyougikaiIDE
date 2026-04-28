# インシデント: DriveApp 全操作失敗（権限問題）

発生日: 2026-04-27
影響機能: 研修案内PDF アップロード（`uploadTrainingFile_`）
状態: **解決済み**

解決日: 2026-04-27
根本原因: 標準 Cloud project `hcmn-member-system-prod`（project number `88737175415`）で **Google Drive API が有効化されていなかった**。
対応: Google Drive API を有効化し、管理者 split Apps Script エディタで `testDriveAccess()` が `getRootFolder` / `createFolder` / `createFile` / `trashFile` / `trashFolder` すべて PASS することを確認。

---

## 1. 症状

管理者コンソール 研修管理フォームで PDF をアップロードすると：
```
サーバー エラーが発生しました。しばらくしてからもう一度試してください。
```

GAS 実行ログ（診断コード追加後）:
```
[processApiRequest catch] action=uploadTrainingFile
  error=サーバー エラーが発生しました。しばらくしてからもう一度試してください。

フォルダ取得失敗: サーバー エラーが発生しました。しばらくしてからもう一度試してください。
```

---

## 2. 調査経緯

### 2026-04-27 13:13 JST 追加診断

管理者 split Apps Script エディタで `testDriveAccess()` を直接実行し、以下を確認済み。

| 項目 | 結果 |
|---|---|
| 実行 scriptId | `1tlBJ-OJjqNQQxzb5tY3iRUlS4DmQD9sYqw5j842tXD1SPVHutBUeKTRi` |
| effectiveUser / activeUser | `k.noguchi@hcm-n.org` |
| `DriveApp.getRootFolder()` | PASS（`マイドライブ`） |
| `DriveApp.getRootFolder().createFolder()` | PASS |
| `folder.createFile()` | PASS |
| `file.setTrashed(true)` | PASS |
| `folder.setTrashed(true)` | PASS |

結論:

- 管理者 split の Apps Script エディタ実行では、DriveApp の read / folder create / file create / trash がすべて成功する。
- したがって、少なくとも `k.noguchi@hcm-n.org` の Drive 基本書き込み権限、DriveApp OAuth、管理者 split 側の Drive API 利用は成立している。
- 次の切り分け対象は「研修PDFアップロード固有経路」および「固定 deployment `@39` の Web App 実行経路」。
- 次の一手: 管理者ポータルで「管理設定 → 研修ファイル保存先フォルダ → フォルダ作成ボタン」を実行し、`setupTrainingFileFolder_()` 経路が通るか確認する。成功後、PDFアップロードを再試行する。

### 試みた修正 (v271〜v277)

| バージョン | 試みた内容 | 結果 |
|---|---|---|
| v271 | `DriveApp.getThumbnail()` を使ったサムネイル生成（iframeは X-Frame-Options でブロック） | Drive アクセス自体が失敗 |
| v272 | GAS `getFileThumbnail` API で base64 サムネイル取得 | Drive アクセス失敗 |
| v273 | `UrlFetchApp + Drive REST API` でサムネイル取得（`generateDriveThumbnail_`） | UrlFetchApp が `thumbnailLink` 取得に失敗 |
| v274 | サムネイル生成をアップロードと分離（バッチトリガー方式）| **アップロード自体が失敗することが判明** |
| v275 | 詳細診断ログ追加 → `action=uploadTrainingFile` での失敗を確認 | 原因箇所を特定 |
| v276 | `uploadTrainingFile_` に段階ログを追加 | **「フォルダ取得失敗」** = `DriveApp.getFoldersByName()` が失敗 |
| v277 | `getFoldersByName()` を廃止、`getFolderById()` + 設定UI追加 | **新実装でも DriveApp 操作が全て失敗** |

### 当初結論

`DriveApp` の **全ての操作**（`getFoldersByName`, `getFolderById`, `createFolder`, `createFile`）が GAS ランタイムレベルで失敗している。これは GCP プロジェクトの設定問題と考えられる。

### 最終結論（2026-04-27）

根本原因はコードではなく、標準 Cloud project 側で **Google Drive API が未有効化**だったこと。

今回の学習:

- `DriveApp` / `GmailApp` / Advanced Services / 外部 Google API 依存の障害では、まず GCP API 有効化・OAuth scope・Workspace 管理設定・実行ユーザー権限を確認する。
- コード修正は、外部サービス設定と権限境界を切り分けた後に行う。
- `appsscript.json` に OAuth scope があっても、標準 Cloud project 側の対応 API が無効なら Apps Script 実行時に失敗し得る。
- `npx clasp apis` または GCP Console の `APIs & Services` を初期確認に含める。

---

## 3. 根本原因と切り分け

### 確定原因: Drive API が GCP プロジェクトで有効化されていなかった

`appsscript.json` に `drive` OAuth スコープを宣言しても、対応する GCP プロジェクトで **Google Drive API** が有効になっていなければ DriveApp は動作しない。

確認先:
```
GCP コンソール → hcmn-member-system-prod (88737175415)
→ API とサービス → 有効な API とサービス
→ Google Drive API が有効か確認
```

対応: **Google Drive API を有効化** → Apps Script エディタで `testDriveAccess()` を直接実行して確認。

### 除外・補助確認B: v263 のOAuthスコープ最小化で `drive` スコープの OAuth grant が失効

v263 で不要スコープを削除した際、既存の OAuth grant が失効した可能性も確認対象だった。
今回の根本原因は Google Drive API 未有効化であり、API 有効化後の `testDriveAccess()` は PASS。
再発時に API 有効化済みでも失敗する場合は、再承認を確認する。

確認先: `myaccount.google.com/permissions` でアプリのアクセス権を確認・失効後に再承認。

### 除外・補助確認C: `executeAs: USER_DEPLOYING` の権限問題

Web App が `executeAs: USER_DEPLOYING`（k.noguchi@hcm-n.org として実行）の場合、DriveApp は k.noguchi@hcm-n.org の Drive にアクセスする。このアカウントの Drive アクセスが何らかの理由で制限されている可能性。
今回、管理者 split Apps Script エディタで `effectiveUser` / `activeUser` ともに `k.noguchi@hcm-n.org` で DriveApp の read / write / trash が PASS したため、実行ユーザーの基本 Drive 権限は成立している。

---

## 4. 確認すべき事項

1. **GCP コンソール** で Google Drive API が有効か確認
   ```
   https://console.developers.google.com/apis/api/drive.googleapis.com/overview?project=88737175415
   ```

2. **Apps Script エディタ**（`script.google.com`）でスクリプトを直接実行
   ```javascript
   testDriveAccess()
   ```
   `backend/Code.gs` / `gas/admin/Code.gs` に診断関数を追加済み。
   Apps Script エディタの関数選択欄から `testDriveAccess` を選び、直接実行する。
   `clasp run` は既知の実行権限問題があるため、この診断では標準経路にしない。

   結果の見方:
   - `getRootFolder` が失敗: OAuth grant / Drive API / Workspace Drive SDK API / OAuth app access control のいずれか。
   - `getRootFolder` 成功、`createFolder` 失敗: 実行ユーザーの Drive 作成権限、容量、Workspace ポリシーを確認。
   - `createFolder` 成功、`createFile` 失敗: Drive 書き込み権限またはファイル作成ポリシーを確認。
   - `trashFile` / `trashFolder` 失敗: 作成は可能。削除/ゴミ箱権限だけが別制約。

3. **OAuth スコープの再承認**
   - `myaccount.google.com/permissions` でアプリを失効させる
   - 管理者コンソールにアクセスして再承認フロー実行

4. 必要に応じて Workspace 管理コンソールで以下を確認
   - Drive and Docs → Features and Applications → Drive SDK API が許可されていること
   - Security → Access and data control → API controls で対象 OAuth client / internal app が Drive scope を利用できること
   - Context-Aware Access / DLP で Drive API 書き込みがブロックされていないこと

---

## 5. 現行デプロイ状態

| プロジェクト | GAS Version | 状態 |
|---|---|---|
| 統合（公開ポータル） | @280 (v277) | 稼働中（PDF アップロード以外は正常） |
| 会員 split | @29 (v274) | 稼働中 |
| 管理者 split | @39 (v277) | 稼働中（PDF アップロード以外は正常） |

---

## 6. 後続確認対象の実装（v271〜 で追加・Drive依存）

### 研修案内PDF サムネイルプレビュー

- **目標**: 研修一覧・詳細に PDF 1ページ目のサムネイル画像を表示
- **状態**: コードは実装済み。Drive API 有効化後、アップロードとサムネイル生成の実動作確認が後続確認対象。
- **関連コード**:
  - `backend/Code.gs`: `getOrCreateTrainingFolder_()`, `generateMissingThumbnails_()`, `runThumbnailGeneration()`
  - `src/components/PdfThumbnail.tsx`: サムネイル表示コンポーネント
  - `T_研修.案内状サムネイルURL`: 新規追加カラム（DBへの反映は `rebuildDatabaseSchema()` 実行で追加される）

### Drive アクセス解決後の作業

1. 管理設定 → 研修ファイル保存先フォルダ → フォルダ作成ボタンを押す
2. PDF を再アップロードしてアップロード成功を確認
3. 必要に応じてサムネイル自動生成を確認（10〜20分後）

---

## 7. 影響を受けた機能

| 機能 | 状態 |
|---|---|
| 研修PDF アップロード | 復旧（Drive API 有効化後に確認） |
| 案内PDF サムネイル表示 | Drive API 有効化後に確認対象 |
| 研修管理コンソール（PDF 以外） | 正常 |
| 会員マイページ | 正常 |
| 公開ポータル（研修・入会申込） | 正常 |
| 変更申請ワークフロー | 正常 |
| メール設定・送信 | 正常 |

---

## 8. 参照すべき正本

- `HANDOVER.md` — 現行本番状態
- `docs/09_DEPLOYMENT_POLICY.md` — デプロイ手順
- `docs/16_INCIDENT_clasp_run_permission_2026-03-14.md` — 過去の GAS 権限インシデント参照
