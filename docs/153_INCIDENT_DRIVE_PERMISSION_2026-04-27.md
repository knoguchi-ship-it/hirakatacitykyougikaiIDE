# インシデント: DriveApp 全操作失敗（権限問題）

発生日: 2026-04-27
影響機能: 研修案内PDF アップロード（`uploadTrainingFile_`）
状態: **未解決・次担当者への引き継ぎ**

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

### 結論

`DriveApp` の **全ての操作**（`getFoldersByName`, `getFolderById`, `createFolder`, `createFile`）が GAS ランタイムレベルで失敗している。これは GCP プロジェクトの設定問題と考えられる。

---

## 3. 根本原因の仮説

### 仮説A（最有力）: Drive API が GCP プロジェクトで有効化されていない

`appsscript.json` に `drive` OAuth スコープを宣言しても、対応する GCP プロジェクトで **Google Drive API** が有効になっていなければ DriveApp は動作しない。

確認先:
```
GCP コンソール → hcmn-member-system-prod (88737175415)
→ API とサービス → 有効な API とサービス
→ Google Drive API が有効か確認
```

有効でなければ: **Google Drive API を有効化** → 既存の OAuth grant を失効させて再承認

### 仮説B: v263 のOAuthスコープ最小化で `drive` スコープの OAuth grant が失効

v263 で不要スコープを削除した際、既存の OAuth grant が失効した可能性がある。再承認が必要。

確認先: `myaccount.google.com/permissions` でアプリのアクセス権を確認・失効後に再承認。

### 仮説C: `executeAs: USER_DEPLOYING` の権限問題

Web App が `executeAs: USER_DEPLOYING`（k.noguchi@hcm-n.org として実行）の場合、DriveApp は k.noguchi@hcm-n.org の Drive にアクセスする。このアカウントの Drive アクセスが何らかの理由で制限されている可能性。

---

## 4. 確認すべき事項

1. **GCP コンソール** で Google Drive API が有効か確認
   ```
   https://console.developers.google.com/apis/api/drive.googleapis.com/overview?project=88737175415
   ```

2. **Apps Script エディタ**（`script.google.com`）でスクリプトを直接実行
   ```javascript
   function testDriveAccess() {
     var files = DriveApp.getRootFolder().getFiles();
     Logger.log('Drive access OK: ' + DriveApp.getRootFolder().getName());
   }
   ```
   これが失敗すれば Drive API 自体が無効。

3. **OAuth スコープの再承認**
   - `myaccount.google.com/permissions` でアプリを失効させる
   - 管理者コンソールにアクセスして再承認フロー実行

4. **`clasp run testDriveAccess`** で CLI から Drive アクセスをテスト

---

## 5. 現行デプロイ状態

| プロジェクト | GAS Version | 状態 |
|---|---|---|
| 統合（公開ポータル） | @280 (v277) | 稼働中（PDF アップロード以外は正常） |
| 会員 split | @29 (v274) | 稼働中 |
| 管理者 split | @39 (v277) | 稼働中（PDF アップロード以外は正常） |

---

## 6. 未解決の実装（v271〜 で追加・Drive依存）

### 研修案内PDF サムネイルプレビュー

- **目標**: 研修一覧・詳細に PDF 1ページ目のサムネイル画像を表示
- **状態**: コードは実装済みだが Drive アクセス不可のため機能していない
- **関連コード**:
  - `backend/Code.gs`: `getOrCreateTrainingFolder_()`, `generateMissingThumbnails_()`, `runThumbnailGeneration()`
  - `src/components/PdfThumbnail.tsx`: サムネイル表示コンポーネント
  - `T_研修.案内状サムネイルURL`: 新規追加カラム（DBへの反映は `rebuildDatabaseSchema()` 実行で追加される）

### Drive アクセス解決後の作業

1. `rebuildDatabaseSchema()` を実行して `T_研修` に `案内状サムネイルURL` 列を追加
2. 管理設定 → 研修ファイル保存先フォルダ → フォルダ作成ボタンを押す
3. PDF を再アップロードしてサムネイル自動生成を確認（10〜20分後）

---

## 7. 影響を受けた機能

| 機能 | 状態 |
|---|---|
| 研修PDF アップロード | **停止**（Drive アクセス失敗） |
| 案内PDF サムネイル表示 | **停止**（Drive アクセス失敗） |
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
