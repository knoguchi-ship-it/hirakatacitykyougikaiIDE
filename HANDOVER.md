# 開発引継ぎ

更新日: 2026-05-03
現行本番: `v293`（統合プロジェクト GAS version 290 / 会員 split GAS version 40 / 管理者 split GAS version 50）
固定 deployment: 統合（公開ポータル）`@290` × 2本 / 会員 split `@40` / 管理者 split `@50`

## 1. 現行状態

- `public / member / admin` の 3 境界は確定済み。
- 会員ログインは `loginId + password` のみ。
- 管理者ログインは Google アカウント + whitelist 検証のみ。
- 会員マイページに管理者ログイン導線を戻さない。
- fixed deployment 2本運用を維持し、片系だけ更新しない。
- production fixed deployment 同期は `npx clasp redeploy ... --versionNumber ... --description ...` を標準とする。
- split project の広範な関数本体 pruning は v283 で破損したため停止中。public artifact は v289 で comment/string を除外した依存解析と top-level callable allowlist 検査を導入済み。
- release 前に `npm run security:public-boundary` を実行し、統合/public artifact の callable/action/HTML 境界が崩れていないことを確認する。
- `v291` で `npm run security:member-boundary` / `npm run security:admin-boundary` / `npm run security:split-boundary` を追加し、member/admin split artifact の top-level callable は `doGet` / `processApiRequest` のみに制限済み。

## 2. 最初に読む順序

1. `HANDOVER.md`
2. `AGENTS.md`
3. `GLOBAL_GROUND_RULES/docs/AI_RULES/05_PROJECT_RULES_HIRAKATA.md`
4. `GLOBAL_GROUND_RULES/docs/AI_RULES/00_OPERATING_MODEL.md`
5. `GLOBAL_GROUND_RULES/docs/AI_RULES/10_WORKFLOW_AND_QUALITY.md`
6. `GLOBAL_GROUND_RULES/docs/AI_RULES/20_SECURITY_APPROVALS.md`
7. `GLOBAL_GROUND_RULES/docs/AI_RULES/30_ERROR_MEMORY.md`
8. `GLOBAL_GROUND_RULES/docs/AI_RULES/40_DOCS_AND_TEACHING.md`
9. `docs/44_DEVELOPMENT_HANDOVER_PLAYBOOK_2026-04-04.md`
10. `docs/175_RELEASE_STATE_v293_2026-05-03.md`
11. `docs/174_RELEASE_STATE_v292_2026-05-01.md`
12. `docs/173_RELEASE_STATE_v291_2026-05-01.md`
13. `docs/169_RELEASE_STATE_v290_2026-04-29.md`
14. `docs/170_HANDOVER_SECURITY_SEPARATION_NEXT_2026-04-29.md`
15. `docs/168_RELEASE_STATE_v289_2026-04-29.md`
16. `docs/167_THIRD_PARTY_ASSESSMENT_PUBLIC_SEPARATION_2026-04-28.md`
17. `docs/166_RELEASE_STATE_v288_2026-04-28.md`
18. `docs/165_HANDOVER_PUBLIC_PORTAL_SEPARATION_PLAN_2026-04-28.md`
19. `docs/164_RELEASE_STATE_v287_2026-04-28.md`
20. `docs/163_RELEASE_STATE_v286_2026-04-28.md`
21. `docs/162_RELEASE_STATE_v285_2026-04-27.md`
22. `docs/161_RELEASE_STATE_v284_2026-04-27.md`
23. `docs/160_RELEASE_STATE_v283_2026-04-27.md`
24. `docs/159_RELEASE_STATE_v282_2026-04-27.md`
25. `docs/158_RELEASE_STATE_v281_2026-04-27.md`
26. `docs/157_RELEASE_STATE_v280_2026-04-27.md`
27. `docs/156_RELEASE_STATE_v279_2026-04-27.md`
28. `docs/155_RELEASE_STATE_v278_2026-04-27.md`
29. `docs/153_INCIDENT_DRIVE_PERMISSION_2026-04-27.md`
30. `docs/09_DEPLOYMENT_POLICY.md`
31. `docs/05_AUTH_AND_ROLE_SPEC.md`
32. `docs/04_DB_OPERATION_RUNBOOK.md`
33. `docs/03_DATA_MODEL.md`
34. `docs/00_DOC_INDEX.md`

## 3. 配信境界

| 用途 | Project | Deployment ID | Access |
|---|---|---|---|
| 会員マイページ | member split | `AKfycbxd_6HlH5aWLhxYOtLUHehI3ODiHg4fpc5SCzNdEBIDbDpaBuU3KTuqDRbeBmhWZxSQ_g` | `ANYONE_ANONYMOUS` |
| 管理者ポータル | admin split | `AKfycbwSCTTyvWY_cFG764XawdbqA8r0qxYbav4aDZ-BK9rRmvXHoUXrKQnQ9egRGqWcx4Os` | `DOMAIN` |
| 公開ポータル | 統合 public | `AKfycbxyuUXgK1oHUDMahQjluiL-gcrMK0qV0FWLFYaYBqGxlRSg9NhvmbyQRyf0dvaqg7Zp` | `ANYONE_ANONYMOUS` |

## 4. 直近リリース

- `v293`: 宛名リスト出力コンソールの5列ドロップダウンフィルター（年度処理 / 種別 / 状態 / 郵送先 / 住所不備）を admin split に反映。管理者 split を `@50` へ同期。詳細: `docs/175_RELEASE_STATE_v293_2026-05-03.md`
- `v292`: `build-admin-gas.mjs` の pruning バグ修正。`ADMIN_ACTION_PERMISSIONS` が誤削除されていた問題（管理者ログイン不能・404）を解消。`build-member-gas.mjs` の同一パターンも同時修正。管理者 split を `@49` へ同期。詳細: `docs/174_RELEASE_STATE_v292_2026-05-01.md`
- `v291`: パスワード保存を versioned PBKDF2-HMAC-SHA256 + verifier-side pepper へ更新し、宛名リスト出力コンソールに発送区分・年度・検索・候補選択を追加。統合 fixed deployment 2本を `@290`、会員 split を `@40`、管理者 split を `@48` へ同期。詳細: `docs/173_RELEASE_STATE_v291_2026-05-01.md`
- `v290`: public artifact から admin cache / admin audit / admin role transition 系 private helper と maintenance 関数名 token を追加削除。統合 fixed deployment 2本を `@289` へ同期。詳細: `docs/169_RELEASE_STATE_v290_2026-04-29.md`
- `v289`: v288 第三者評価で検出された public callable `rebuildDatabaseSchema` / `getDbInfo` を public artifact から除去。build 後の top-level callable allowlist 検査を追加し、統合 fixed deployment 2本を `@288` へ同期。詳細: `docs/168_RELEASE_STATE_v289_2026-04-29.md`
- `v288`: 統合プロジェクトへ push する artifact を public-only `Code.gs` に縮退。公開ポータル URL / deployment ID は維持し、統合 fixed deployment 2本を `@287` へ同期。member split `@39` と admin split `@46` は未変更。詳細: `docs/166_RELEASE_STATE_v288_2026-04-28.md`
- `v287-partial`: member split の生成済み `Code.gs` から境界外関数を物理削除。admin split は `@47` でホワイトアウトしたため `@46` へロールバック済み。統合/公開は `@285` 維持。詳細: `docs/164_RELEASE_STATE_v287_2026-04-28.md`
- `v286`: `saveMemberCore_` の admin-only 代表者検証・監査ログを option 明示化。会員セルフ更新の機能変更なし。詳細: `docs/163_RELEASE_STATE_v286_2026-04-28.md`
- `v285`: `updateMember_` を admin wrapper、`saveMemberCore_` を実保存 core に分離。詳細: `docs/162_RELEASE_STATE_v285_2026-04-27.md`
- `v284`: v283 の member function pruning を撤回し、`addPublicStaffMember_ is not defined` を解消。詳細: `docs/161_RELEASE_STATE_v284_2026-04-27.md`
- `v283`: member split の到達不能トップレベル関数削除を試行。v284 で撤回。詳細: `docs/160_RELEASE_STATE_v283_2026-04-27.md`
- `v282`: member/admin split の境界外 action handler 分岐を生成時に削除。詳細: `docs/159_RELEASE_STATE_v282_2026-04-27.md`
- `v281`: member/admin split の境界外 action registry を物理的に空化。詳細: `docs/158_RELEASE_STATE_v281_2026-04-27.md`
- `v280`: 会員ログイン画面から管理者ログイン UI を除去。詳細: `docs/157_RELEASE_STATE_v280_2026-04-27.md`
- `v279`: app 境界 API gate を追加。詳細: `docs/156_RELEASE_STATE_v279_2026-04-27.md`
- `v278`: 研修表示・申込判定モデルを lifecycle と application availability に分離。詳細: `docs/155_RELEASE_STATE_v278_2026-04-27.md`

## 4.1 v293 反映済み変更（2026-05-03）

- 宛名リスト出力コンソール（`src/components/MailingListExport.tsx`）の5列ドロップダウンフィルターを admin split に反映済み。
  - 年度処理 / 種別 / 状態 / 郵送先 / 住所不備
  - フィルター中はアクティブチップ表示・個別/一括リセット可能。
  - カウントバッジは「表示中かつ選択済み」件数を反映。
  - 全件選択はフィルター後の表示中のみ選択（Select All respects filters）。
- GAS 側 action の追加変更なし。admin HTML artifact のみ更新。
- 管理者 split fixed deployment を `@50` へ同期。

## 4.2 v292 反映済み変更（2026-05-01）

- `build-admin-gas.mjs` の `pruneUnreachableFunctionDeclarations` で `removableTopLevelStatements` フィルタの正規表現を `\b${name}\b` → `\b${name}\s*\(` に修正。関数呼び出しのみを削除対象とし、データ宣言内の文字列キーへの誤マッチを防止。
- `build-member-gas.mjs` の同一パターンも修正済み。
- admin split Code.gs に `ADMIN_ACTION_PERMISSIONS` が復元され、管理者ログイン（`checkAdminBySession` / `adminLoginWithData`）が正常動作するようになった。
- 管理者 split fixed deployment を `@49` へ同期。

## 4.3 v291 反映済み変更（2026-05-01）

- member/admin split artifact の top-level callable を `doGet` / `processApiRequest` のみに制限し、`npm run security:split-boundary` を prerelease gate に追加済み。
- パスワード保存を versioned PBKDF2-HMAC-SHA256 + verifier-side pepper 対応へ更新済み。pepper Script Property は `PASSWORD_HASH_PEPPER_V1`。integrated/public・member split・admin split の 3 project へ設定済み。pepper の値は Git、handover、docs、ログ、チャット、生成物へ記録しない。`.env` は Apps Script 本番 runtime の正本にしない。
- 会員が変更する新しいパスワードと生成パスワードは 15 文字以上へ変更済み。
- 宛名リスト出力コンソールを、発送区分・年度別の候補一覧表示、年度処理/種別/状態/住所不備表示、キーワード検索、選択対象のみ Excel 出力へ拡張済み。GAS 側で `getMailingListTargets` を追加し、`generateMailingListExcel` は選択 `targetKeys` を再照合する。
- 学習資料 `docs/learning/13_password_pepper_secret_management_2026-04-30.html` を追加。詳細: `docs/171_PASSWORD_HASH_STANDARD_ALIGNMENT_2026-04-30.md`
- Secret Manager 化および外部 KDF / managed identity 検討は 2026-05-01 時点で一旦保留。ただし必須 security backlog とし、完了または明示的な代替設計決定まで削除・完了扱いにしない。詳細: `docs/172_DEFERRED_SECURITY_BACKLOG_SECRET_MANAGER_KDF_2026-05-01.md`

## 5. 既知の重要事項

- `v288 third-party assessment`: `google.script.run` で呼べる `rebuildDatabaseSchema` / `getDbInfo` 残存を検出。v289 で public artifact から除去済み。詳細: `docs/167_THIRD_PARTY_ASSESSMENT_PUBLIC_SEPARATION_2026-04-28.md`, `docs/168_RELEASE_STATE_v289_2026-04-29.md`
- DriveApp 障害は解決済み。根本原因は GCP 標準 Cloud project `hcmn-member-system-prod`（88737175415）で Google Drive API が未有効化だったこと。詳細: `docs/153_INCIDENT_DRIVE_PERMISSION_2026-04-27.md`
- Google API 依存機能の障害では、コード調査前に GCP API 有効化、OAuth scope、Workspace 管理設定、実行ユーザー権限を確認する。
- `seedDemoData` は production DB を破壊する操作として扱い、完全バックアップと明示承認なしでは実行しない。
- business member の代表者情報は `staff.role='REPRESENTATIVE'` を正本とする。

## 6. 操作者確認待ち

`v293` の実ブラウザ確認は操作者側で行う。

- **管理者ポータル（優先）**: `k.noguchi@hcm-n.org` で管理者ログインが成功し、ダッシュボードが表示されること（v292 修正確認）。
- 管理者ポータル: 宛名リスト出力コンソールで、発送区分選択後に候補一覧、年度フィルタ、キーワード検索、5列ドロップダウンフィルター、対象選択、選択対象のみ Excel 出力が動くこと。
- 管理者ポータル: Google アカウント + whitelist の管理者ログインが従来どおり動き、会員向け UI に管理者導線が混入しないこと。
- 会員マイページ: 会員ログイン、研修一覧、申込済み研修、会員情報更新、パスワード変更が従来どおり動くこと。旧 verifier は初回成功時に新形式へ再保存される。
- 公開ポータル: 旧統合 URL / 公開 URL が public-only 画面を返し、研修一覧、外部申込/取消、会員登録申請、公開変更申請、OTP 導線が従来どおり動くこと。
- DriveApp: 必要に応じて管理設定の研修ファイル保存先フォルダ作成、PDF アップロード、サムネイル生成を確認すること。

# Next Handover Note

- 次担当者は `docs/175_RELEASE_STATE_v293_2026-05-03.md`、`docs/174_RELEASE_STATE_v292_2026-05-01.md`、`docs/170_HANDOVER_SECURITY_SEPARATION_NEXT_2026-04-29.md` を最初に読み、分離済み範囲と未完了タスクを確認すること。
- v292 で build-admin-gas.mjs / build-member-gas.mjs の pruning 正規表現を修正済み。今後 admin/member build で同様の誤削除は発生しない。
- v291 からの既存 note（v290 の admin helper 除去確認、headless Chrome 検証等）は引き続き有効。
- v290 で public artifact から admin cache / admin audit / admin role transition 系 private helper も除去済み。詳細は `docs/169_RELEASE_STATE_v290_2026-04-29.md` を読むこと。
- 2026-04-29 に agent 側で headless Chrome / CDP を使い、実アプリ iframe 内の `google.script.run.rebuildDatabaseSchema` / `google.script.run.getDbInfo` が `is not a function` で呼べないことを確認済み。
- v288 で public portal の integrated artifact は public-only へ縮退済み。背景は `docs/166_RELEASE_STATE_v288_2026-04-28.md` と `docs/165_HANDOVER_PUBLIC_PORTAL_SEPARATION_PLAN_2026-04-28.md` を参照。
- canonical full source は `gas-src/Code.full.gs`。`backend/Code.gs` は `npm run build:gas` で生成される public-only artifact として扱う。
- admin `@47` はホワイトアウト発生済み。原因特定まで admin physical pruning を再デプロイしない。
