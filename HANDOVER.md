# 引継ぎ書（次担当者向け）

更新日: 2026-03-13
対象: 枚方市介護支援専門員連絡協議会 会員システム

## 1. 先に必ず読む文書（順番固定）
1. `docs/12_ENGINEERING_RULEBOOK.md`（最上位ルール）
2. `docs/10_SOW.md`（スコープ・品質保証）
3. `docs/09_DEPLOYMENT_POLICY.md`（本番デプロイ標準）
4. `docs/05_AUTH_AND_ROLE_SPEC.md`（認証/権限仕様）
5. `docs/04_DB_OPERATION_RUNBOOK.md`（DB運用）
6. `docs/11_WITHDRAWAL_DELETION_POLICY.md`（退会/削除ポリシー）

## 2. 現在の運用要点
- 認証方式:
  - 管理者: Googleアカウントログイン（`checkAdminBySession_()`・会員管理/研修管理コンソール共通）
  - 会員: ID/パスワードログイン
- DB整合性ポリシー:
  - マスタ定義・テーブル定義・型定義・実装を同時更新
  - 既存DBは再作成前提ではなく、追記/移行で整合維持
- ドキュメント運用:
  - 正本は `docs/00_DOC_INDEX.md` を参照
  - 不要文書は `docs/archive/` へ退避
  - 人間確認用HTMLは保持（削除しない）
- 公開ポータル（2026-03-13 追加）:
  - URL: `...exec?app=public`（同一GAS・同一Deployment ID）
  - 非会員が認証なしで受付中研修の閲覧・申込できる公開フォーム
  - 申込データは `T_外部申込者` + `T_研修申込`（ポリモーフィック設計）で会員申込と統合管理
- 管理コンソール連携（2026-03-13 追加）:
  - 会員管理コンソール ⇄ 研修管理コンソール 双方向ナビゲーション（再認証不要）
  - `T_管理者Googleホワイトリスト` 登録アカウントが両コンソールに同一権限でアクセス可
- メール送信（2026-03-13 追加）:
  - 既存リマインダー: `MailApp.sendEmail`（変更なし）
  - 管理コンソール メール送信機能: `GmailApp.sendEmail`（エイリアス・Reply-To対応）
  - `appsscript.json` に `gmail.send` スコープ追加が必要（実装フェーズで対応）

## 3. 本番デプロイの現状（2026-03-11時点）
- `clasp` 認証ユーザー: `k.noguchi@uguisunosato.or.jp`
- デプロイ一覧（抜粋）:
  - `AKfycbw2QYvMovSCkXtSpGAro1drZqonpXjf_zTpa-ylsUIYZhzrlDgGds7jurGHKuKCY4xU` @57
  - `AKfycby8Uc8RMNpRrcQIV-DePe3ZzoDMglSnB9EBO5GXzTn3VNyJT1lUBcpEpjiodjqbzCpF` @56
- `/exec` 疎通確認:
  - `AKfycbw2.../exec` -> HTTP 403（認可ありURLとして応答）
  - `AKfycby8.../exec` -> HTTP 404

## 4. 次担当者の最初の作業
1. `docs/12_ENGINEERING_RULEBOOK.md` と `docs/09_DEPLOYMENT_POLICY.md` を読み、固定URL運用ルールを確認
2. Apps Script `Manage deployments` で本番として扱うDeployment IDを確認
3. `/exec` をブラウザで確認（404でないこと）
4. `npx clasp run healthCheck` と `npx clasp run getDbInfo` を実行
5. 問題なければ開発再開

## 5. 標準コマンド
```bash
# フロント/GASビルド
npm run build
npm run build:gas

# GAS反映
cd backend
npx clasp show-authorized-user
npx clasp push --force
npx clasp version "<release note>"

# 疎通確認
npx clasp run healthCheck
npx clasp run getDbInfo
```

## 6. デプロイ時の禁止事項（再掲）
- 事前合意なしで本番Deployment IDを変更しない
- 404未解消のまま本番完了にしない
- ドキュメント更新なしで完了扱いにしない

## 7. 直近の変更履歴（Git）
- `54fe9a1` docs: メール送信機能・管理コンソール連携の仕様追加（GmailApp採用・DR13新規作成）
- `52388cf` docs: Decision Record追加・索引更新（ルール是正）
- `6ef9f05` docs: ドキュメント整合性修正・公開ポータル設計追加
- `b665e3f` chore: 文字化け防止のための .gitattributes と VS Code 設定を追加

## 8. 補足
- 既存の履歴文書は `docs/archive/docs_history/` に保存
- 本書は再開時の最初の確認資料として維持し、更新時は日付を更新する

## 8a. 既知の課題・技術的負債（2026-03-12 精査）

### セキュリティ / 仕様不整合
| # | 種別 | 内容 | 対処推奨 | 優先度 |
|---|------|------|----------|--------|
| S-01 | セキュリティ欠陥 | `changePassword_()` が現在のパスワードを検証しない（PRD §5「現在PW不一致時は変更不可」の要件不整合） | `currentPassword` パラメータを追加してバックエンドでハッシュ照合 | 高 |
| S-02 | セキュリティ課題 | パスワードハッシュが SHA-256 単回（OWASP 2025 は Argon2id/bcrypt 推奨） | GAS 制約上ネイティブ移行不可。長期的には外部ハッシュ計算を検討 | 中 |
| S-03 | 運用課題 | ログインロック解除が DB 直接編集のみ | 管理画面に unlock 機能追加、または時間ベース自動解除 | 中 |
| S-04 | UI 課題 | IDトークン直入力 UI（保守用）が本番環境でも表示される | 本番ビルドで非表示化推奨（環境変数フラグで制御） | 低 |

### 未実装機能
| # | 機能 | 状況 |
|---|------|------|
| F-01 | パスワード初期化メール送信 | DB を手動設定のみ。自動通知なし |
| F-02 | 振込先情報の会員向け UI | DB には振込先 JSON を保持。UI 表示は実装済み（`DEFAULT_TRANSFER_ACCOUNT` は固定値） |
| F-03 | 職員「退職済み」自動削除 | 手動設定のみ。`applyWithdrawalDeletionPolicy_()` は退会会員のみ対象 |
| F-04 | キャンセル禁止設定の管理 UI | `cancelAllowed` フラグは DB に保存できるが管理画面の設定 UI なし |

## 9. 当日運用チェックリスト（実施欄）

### 9.1 開発再開前
- [ ] `docs/12_ENGINEERING_RULEBOOK.md` を再読した
- [ ] `docs/10_SOW.md` を再読した
- [ ] `docs/09_DEPLOYMENT_POLICY.md` を再読した
- [ ] `npx clasp show-authorized-user` が想定アカウントであることを確認した

### 9.2 変更作業中
- [ ] DB関連変更は「型/マスタ/シート/API」を同一変更セットで更新した
- [ ] 管理者=Google認証、会員=ID/パス認証の仕様を崩していない
- [ ] 変更内容を正本ドキュメントへ追記した

### 9.3 本番反映前
- [ ] `npm run build:gas` が成功した
- [ ] `npx clasp push --force` が成功した
- [ ] `npx clasp version` で新Versionを作成した
- [ ] `Manage deployments` で本番対象のVersionを確認した

### 9.4 本番反映後
- [ ] `/exec` を実ブラウザで確認し404でないことを確認した
- [ ] `npx clasp run healthCheck` が成功した
- [ ] `npx clasp run getDbInfo` が成功した
- [ ] 変更内容・確認結果を `HANDOVER.md` か関連正本へ記録した

### 9.5 リリース記録
- 実施日:
- 担当者:
- Gitコミット:
- 本番Deployment ID:
- 本番URL:
- 備考:
