# Handover Task: v225 Public Membership Transitions

Updated: 2026-04-17

### Task: 公開入会申込の遷移ルール実装と v225 リリース

- 対象ケースID: `v225-public-membership-transitions`
- owner: Codex
- status: `done`
- 対象 deployment/version: GAS `225`
- 対象 URL:
  - member fixed deployment `/exec`
  - public fixed deployment `/exec?app=public`
- 関連ログイン:
  - operator: `k.noguchi@hcm-n.org`
- 関連正本:
  - `HANDOVER.md`
  - `docs/44_DEVELOPMENT_HANDOVER_PLAYBOOK_2026-04-04.md`
  - `docs/88_RELEASE_STATE_v225_2026-04-17.md`
  - `docs/09_DEPLOYMENT_POLICY.md`
  - `docs/02_ARCHITECTURE.md`
  - `docs/03_DATA_MODEL.md`

#### このタスクの要点
- 公開入会申込で `介護支援専門員番号` を照合キーにし、会員種別の自動遷移を backend で処理するようにした。
- 事業所会員本体の重複は `事業所番号` で拒否するようにした。
- 代表者が別会員種別または別事業所へ移る場合、残留メンバーがいれば後任代表者を自動選定し、いなければ元事業所を退会扱いにする。
- 同リリースに、公開ポータルの重要事項ダイアログと一括メール送信テンプレート保存機能も含めて本番同期した。

#### 変更した正本
- [HANDOVER.md](/C:/VSCode/CloudePL/hirakatacitykyougikaiIDE/HANDOVER.md:1)
- [docs/09_DEPLOYMENT_POLICY.md](/C:/VSCode/CloudePL/hirakatacitykyougikaiIDE/docs/09_DEPLOYMENT_POLICY.md:1)
- [docs/00_DOC_INDEX.md](/C:/VSCode/CloudePL/hirakatacitykyougikaiIDE/docs/00_DOC_INDEX.md:1)
- [docs/02_ARCHITECTURE.md](/C:/VSCode/CloudePL/hirakatacitykyougikaiIDE/docs/02_ARCHITECTURE.md:199)
- [docs/03_DATA_MODEL.md](/C:/VSCode/CloudePL/hirakatacitykyougikaiIDE/docs/03_DATA_MODEL.md:136)
- [docs/88_RELEASE_STATE_v225_2026-04-17.md](/C:/VSCode/CloudePL/hirakatacitykyougikaiIDE/docs/88_RELEASE_STATE_v225_2026-04-17.md:1)

#### 主な変更ファイル
1. [backend/Code.gs](/C:/VSCode/CloudePL/hirakatacitykyougikaiIDE/backend/Code.gs:5534)
2. [src/components/application/MemberApplicationForm.tsx](/C:/VSCode/CloudePL/hirakatacitykyougikaiIDE/src/components/application/MemberApplicationForm.tsx:457)
3. [src/components/application/types.ts](/C:/VSCode/CloudePL/hirakatacitykyougikaiIDE/src/components/application/types.ts:59)
4. [src/components/BulkMailSender.tsx](/C:/VSCode/CloudePL/hirakatacitykyougikaiIDE/src/components/BulkMailSender.tsx:61)
5. [src/services/api.ts](/C:/VSCode/CloudePL/hirakatacitykyougikaiIDE/src/services/api.ts:170)

#### 実装内容
1. 個人会員申込時に、同じ `介護支援専門員番号` の在籍中事業所メンバーがいれば個人会員へ切替。
2. 事業所会員申込時に、同じ `介護支援専門員番号` の個人/賛助会員がいれば退会後に申込先事業所メンバーとして登録。
3. 事業所会員申込時に、同じ `介護支援専門員番号` の別事業所在籍メンバーがいれば元事業所から転籍。
4. 個人会員の二重登録と、同じ `事業所番号` の事業所二重登録を拒否。
5. 成功画面に `transitionSummary` を表示。

#### 影響範囲
- 公開ポータル新規入会申込
- 既存の会員種別変換 helper
- 一括メール送信コンソール

#### evidence
- 実施日: 2026-04-17
- 実行コマンド:
  - `npm run typecheck`
  - `npm run build`
  - `npm run build:gas`
  - `npx clasp push --force`
  - `npx clasp version "v225 public membership transitions + notice dialog + bulk mail templates"`
  - `npx clasp redeploy <memberDeploymentId> --versionNumber 225 --description "v225 public membership transitions + notice dialog + bulk mail templates"`
  - `npx clasp redeploy <publicDeploymentId> --versionNumber 225 --description "v225 public membership transitions + notice dialog + bulk mail templates"`
  - `npx clasp deployments --json`
  - `npx clasp run healthCheck`
  - `npx clasp run getDbInfo`
- deployment/version:
  - member fixed deployment: `@225`
  - public fixed deployment: `@225`
- PASS/FAIL:
  - PASS: build/typecheck/build:gas
  - PASS: version create / fixed deployment sync
  - PASS: `healthCheck`
  - PASS: `getDbInfo`
- 実行者ログイン:
  - `k.noguchi@hcm-n.org`
- DB:
  - fixed DB spreadsheet `1GVlIzOG1Tsqw8fBXgZ__c8u4oMu-4_WCf0H3aVLESKs`

#### 未了・注意事項
- 本番 DB に新規会員を作るため、公開入会申込そのものの live 登録試験は未実施。
- 既存データに同一 `介護支援専門員番号` の有効候補が複数ある場合は公開申込を止める実装なので、実データ不整合が見つかった際は先に管理側でデータ整理が必要。
- ワークツリーには未コミット差分が残っている。次担当者は `git status --short` から開始すること。

#### 次担当者の最初の一手
1. `HANDOVER.md` と `docs/88_RELEASE_STATE_v225_2026-04-17.md` を読み、v225 の範囲を把握する。
2. `git status --short` を確認し、未コミット差分と未追跡 release docs の扱いを決める。
3. 実データで公開入会の確認が必要なら、事務局承認のうえでテストデータ投入手順を先に固める。

#### blocker
- なし
