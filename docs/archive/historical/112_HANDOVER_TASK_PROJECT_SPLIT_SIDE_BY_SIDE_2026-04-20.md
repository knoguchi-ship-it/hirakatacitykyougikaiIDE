# Project Split Side-By-Side Handover

Updated: 2026-04-20
Owner: Codex
Status: `doing`

## 1. Purpose

この文書は、`public / member / admin` 分離作業の現在地を、次担当者が誤解なく再開するための専用 handover である。

この文書の役割は以下に限定する。

- side-by-side 分離の到達点を固定する
- 次にやるべき順序を固定する
- 触ってはいけない production 経路を固定する
- 既知の失敗点を固定する

正本参照:

- `HANDOVER.md`
- `docs/09_DEPLOYMENT_POLICY.md`
- `docs/111_IMPLEMENTATION_BLUEPRINT_PROJECT_SPLIT_2026-04-20.md`
- `docs/05_AUTH_AND_ROLE_SPEC.md`

## 2. Executive Summary

2026-04-20 時点で、repo 内の build root と Apps Script project は `public / member / admin` の 3 本へ分け始めている。

現時点の評価:

- `public`: 既存 production fixed deployment で継続稼働
- `member`: side-by-side project と deployment 作成済み。会員ログイン確認済み
- `admin`: side-by-side project と deployment 作成済み。ただし `/exec` が `404 Not Found` のため、Web app 到達性は未確定

重要:

- production fixed deployment 2 本には一切触っていない
- 既存の本番 URL はまだ統合運用のまま
- `member` と `admin` は「新規 side-by-side project を作った」段階であり、cutover はまだしていない

## 3. Production Baseline

現行 production:

- GAS version: `247`
- member fixed deployment: `AKfycbywpWoYxij6A-ZunIeBjG1Q8qX78PMMTsT3frx1cM5PJ2nAuZpz81KruXb5LIvWgbQx`
- public fixed deployment: `AKfycbxyuUXgK1oHUDMahQjluiL-gcrMK0qV0FWLFYaYBqGxlRSg9NhvmbyQRyf0dvaqg7Zp`
- 両 fixed deployment ともに `@247`

production で守ること:

- 既存 fixed deployment 2 本はまだ運用中
- `npx clasp redeploy` でこの 2 本を触るのは、明示的な production cutover の時だけ
- 今回の side-by-side 作業では production fixed deployment を更新しない

## 4. Repository State Added For Split

### 4.1 Security and API boundary

`backend/Code.gs` にて deny-by-default を導入済み。

実装済み:

- `PUBLIC_ALLOWED_ACTIONS`
- `MEMBER_ALLOWED_ACTIONS`
- `ADMIN_ACTION_PERMISSIONS`
- 未登録 action は `unsupported_action`
- member self-service 系は `loginId` 起点で canonical principal を再解決

意図:

- `member` shell から admin action に入れない
- `public` shell から member/admin action に入れない
- client-supplied `memberId` に依存しない

### 4.2 Build roots

追加済み build roots:

- `gas/member`
- `gas/admin`

追加済み scripts:

- `npm run build:gas:member`
- `npm run build:gas:admin`

build の意味:

- `build:gas` は既存 production 用。`backend/` に出力する
- `build:gas:member` は `gas/member/` にだけ出力する
- `build:gas:admin` は `gas/admin/` にだけ出力する

### 4.3 Frontend shell split

`VITE_APP` に応じて shell mode を分岐し始めている。

実装済み:

- `VITE_APP=member`: 会員ログインを初期表示
- `VITE_APP=admin`: 管理者ログインを初期表示
- `index_admin.html` 追加
- `dist-admin/index_admin.html` を admin bundle 出力に使用

注意:

- `App.tsx` の mode 分岐は最小限であり、完全な UI 分割ではない
- 特に `Sidebar.tsx` は admin shell で member menu を完全に除外しきれていない可能性があるため、次担当者が実画面で再点検すること

## 5. Side-By-Side Projects And Deployments

### 5.1 Member split

Local root:

- `gas/member`

Local clasp config:

- `gas/member/.clasp.json`

Script:

- Script ID: `1ZKFJKNr4IzbguZvO4KbtSOE1BzkrzOG8OV2tF0RFdk28EnZTCL4Sx3dJ`

Deployment:

- Deployment ID: `AKfycbxd_6HlH5aWLhxYOtLUHehI3ODiHg4fpc5SCzNdEBIDbDpaBuU3KTuqDRbeBmhWZxSQ_g`
- Version: `1`
- Description: `member split side-by-side initial deployment from v247 baseline`

Observed behavior:

- `npx clasp deployments` で `@1` を確認
- `curl -I` on `/exec` -> `403 Forbidden`
- ユーザー報告ベースで member login 自体は確認済み
- 管理者ログインは `unsupported_action` で拒否される

評価:

- これは仕様どおり
- member shell は admin action を持たないことの確認になっている

### 5.2 Admin split

Local root:

- `gas/admin`

Local clasp config:

- `gas/admin/.clasp.json`

Script:

- Script ID: `1tlBJ-OJjqNQQxzb5tY3iRUlS4DmQD9sYqw5j842tXD1SPVHutBUeKTRi`

Deployment:

- Deployment ID: `AKfycbwSCTTyvWY_cFG764XawdbqA8r0qxYbav4aDZ-BK9rRmvXHoUXrKQnQ9egRGqWcx4Os`
- Version: `1`
- Description: `admin split side-by-side initial deployment from v247 baseline`

Observed behavior:

- `npx clasp deployments` で `@1` を確認
- generic URL でも domain URL でも `/exec` が `404 Not Found`
- したがって「deployment object はあるが、Web app 到達性は未確認」

評価:

- admin split は未完
- 次担当者はここを最優先で解消する

## 6. Commands Already Executed

### 6.1 Member split

```bash
npm run build:gas:member
npx clasp push --force        # in gas/member
npx clasp version "member split side-by-side initial deployment from v247 baseline"
npx clasp deploy -V 1 -d "member split side-by-side initial deployment from v247 baseline"
npx clasp deployments
```

### 6.2 Admin split

```bash
npm run typecheck
npm run build:gas:admin
npx clasp push --force        # in gas/admin
npx clasp version "admin split side-by-side initial deployment from v247 baseline"
npx clasp deploy -V 1 -d "admin split side-by-side initial deployment from v247 baseline"
npx clasp deployments
curl.exe -L -D - -o NUL <admin exec url>
```

## 7. Known Risks And Failure Points

### 7.1 Admin `/exec` 404

現時点の最大論点。

想定原因候補:

- Apps Script UI 上で deployment type が期待どおり `Web app` になっていない
- create/deploy の組み合わせと script type の相性問題
- Apps Script 側 propagation or deployment metadata mismatch

次担当者が確認すること:

1. Apps Script UI `Deploy > Manage deployments`
2. 対象 deployment が `Web app` であること
3. `Execute as` と `Who has access` を確認
4. 必要なら UI で Web app deployment を作り直す
5. 確定した URL を `HANDOVER.md` と `docs/09_DEPLOYMENT_POLICY.md` に追記

### 7.2 App shell split is incomplete

`App.tsx` は mode 分岐を入れたが、UI と view の完全分割ではない。

再確認が必要:

- admin shell で member menu が出ないか
- admin shell で member login tab が出ないか
- member shell で admin login tab が出ないか
- `Sidebar.tsx` の menu 構成が shell mode と整合するか

### 7.3 Shared backend remains single file

`backend/Code.gs` はまだ shared backend のまま。

これは今回の段階移行としては意図的だが、次の危険がある:

- app ごとに不要 action が物理的には残っている
- manifest scopes が広いまま
- `doGet` はまだ `member/public` のみ明示対応で、admin shell 用には未整理

### 7.4 Dirty working tree

この repo にはユーザー由来の既存差分がある。

次担当者は必ず:

- `git status --short`
- `git diff`

を見て、自分の作業範囲と既存差分を混同しないこと。

### 7.5 Response and performance guardrail

今回の分離作業は認可境界の固定が主目的だが、応答性能を悪化させないことも条件である。

現時点の判断:

- `fetchAllDataFromDbFresh_` の batch read 最適化は `v242` で production 反映済み
- 今回の split 作業で重い一覧取得を増やす変更は production には入れていない
- ただし shell split に伴う初期ロード増加や不要画面の混在は、admin/member それぞれの bundle と初期描画に悪影響を出し得る

次担当者が避けること:

- admin shell のために member 用データ取得を初期ロードで呼ばない
- member shell のために admin dashboard 系の初期データを先読みしない
- `fetchAllData` を split 動作確認のためだけに安易に増やさない
- shell split の途中で view を隠すだけにして、不要 state / effect を残さない

次担当者が確認すること:

- member shell 初回表示で admin 初期化処理が走っていないか
- admin shell 初回表示で member 用 profile / training apply 初期化処理が走っていないか
- `App.tsx` の mode 分岐が rendering だけでなく data-fetch path も分離できているか

## 8. Do Not Do

次担当者への禁止事項:

- production fixed deployment 2 本を今すぐ切り替えない
- `member` or `admin` の side-by-side project を production と誤認して `redeploy` しない
- `backend/` を分離用 build root に流用しない
- admin `/exec` が `404` のまま「動作した」と扱わない
- 実ブラウザ未確認のまま cutover を宣言しない
- `payload.memberId` ベースの認可へ戻さない

## 9. Next Step Order

次担当者はこの順で進めること。

1. `HANDOVER.md`, `docs/09_DEPLOYMENT_POLICY.md`, 本文書を読む
2. `gas/admin` の Apps Script UI を開いて deployment type を確認する
3. admin Web app URL を確定させる
4. admin shell の Google 管理者ログインを確認する
5. admin dashboard と `training-manage` の表示を確認する
6. admin shell から member menu が出ないことを確認する
7. 必要なら `Sidebar.tsx` と `App.tsx` の shell split を追加修正する
8. `doGet` の app 判定に `admin` を明示追加するか検討する
9. 次に `appsscript.json` の app 別 scope 最小化へ進む
10. その後にのみ cutover 計画を詰める

補足:

- admin `/exec` 404 の切り分けが終わる前に、UI の見た目調整へ深く入らない
- production fixed deployment に触るのは member/admin の side-by-side URL と主要導線が安定してから
- `Sidebar.tsx` の整理は必要だが、先に「admin URL が生きていること」を確定する

## 9.1 Exact handoff procedure for the next operator

次担当者の再開手順は、曖昧さを避けるため以下に固定する。

1. `HANDOVER.md`
2. `docs/09_DEPLOYMENT_POLICY.md`
3. `docs/archive/historical/112_HANDOVER_TASK_PROJECT_SPLIT_SIDE_BY_SIDE_2026-04-20.md`
4. `docs/111_IMPLEMENTATION_BLUEPRINT_PROJECT_SPLIT_2026-04-20.md`
5. `git status --short`
6. `git diff -- backend/Code.gs src/App.tsx src/components/Sidebar.tsx package.json vite.config.ts scripts/build-member-gas.mjs scripts/build-admin-gas.mjs docs/05_AUTH_AND_ROLE_SPEC.md docs/09_DEPLOYMENT_POLICY.md HANDOVER.md`
7. `npm run typecheck`
8. `npm run build:gas:member`
9. `npm run build:gas:admin`
10. `npx clasp deployments` in `gas/member`
11. `npx clasp deployments` in `gas/admin`
12. Apps Script UI で `gas/admin` の deployment type を確認

この順番を崩すと、次の誤認が起きやすい。

- production と side-by-side project の取り違え
- admin 404 を frontend 問題と誤認
- 既存未コミット差分と split 差分の混同
- response regression を split 不具合と混同

## 10. Recommended Verification Matrix

### 10.1 Member split

- member login
- profile view
- training apply view
- admin login rejected

### 10.2 Admin split

- `/exec` resolves
- Google admin login
- dashboard
- training manage
- annual fee manage
- system settings
- no member login tab
- no member-only sidebar route leakage
- no member-only preload or effect during first paint

### 10.3 Routing and `doGet` sanity

- `?app=public` -> public shell
- app omitted -> current integrated default remains stable
- admin split project serves expected HTML entry
- `doGet` fallback does not accidentally hide admin shell selection

## 11. Evidence Snapshot

Current evidence:

- `member` deployments: created and listed
- `member` login: user confirmed
- `member` admin login rejection: user confirmed with `unsupported_action`
- `admin` deployments: created and listed
- `admin` `/exec`: `404 Not Found`

This means:

- `member` side-by-side is usable enough for limited verification
- `admin` side-by-side is not yet a valid cutover candidate

## 11.1 Facts that must not be re-litigated

次担当者が前提として固定する事実:

- member split で管理者ログインが `unsupported_action` になるのは不具合ではなく仕様
- production fixed deployment は 2026-04-20 時点で `@247` のまま
- side-by-side project 作成済みであること自体は完了している
- 未完なのは admin Web app 到達性、shell/UI split の仕上げ、scope 最小化、cutover 設計である
- 今回フェーズでは rollback 前提の一発切替を採らない

## 12. Files Touched In This Phase

Primary files:

- `backend/Code.gs`
- `package.json`
- `vite.config.ts`
- `scripts/compress-html.mjs`
- `scripts/build-member-gas.mjs`
- `scripts/build-admin-gas.mjs`
- `index_admin.html`
- `gas/member/*`
- `gas/admin/*`
- `src/App.tsx`
- `src/components/Sidebar.tsx`
- `docs/05_AUTH_AND_ROLE_SPEC.md`
- `docs/09_DEPLOYMENT_POLICY.md`
- `docs/111_IMPLEMENTATION_BLUEPRINT_PROJECT_SPLIT_2026-04-20.md`
- `HANDOVER.md`

## 13. Completion Definition For The Next Phase

次フェーズ完了条件:

- admin `/exec` が正常解決する
- admin Google login が成功する
- member/admin 両 side-by-side URL の主要導線が通る
- shell mode による UI 混線がない
- 文書に確定 URL と deployment state が反映されている
- production へはまだ触れていない、もしくは触れたなら明示記録がある

未完了のまま残してよいもの:

- public cutover
- scope 最終最小化
- shared backend の物理分割

未完了のまま残してはいけないもの:

- admin `/exec` 404 の原因未整理
- member/admin shell の導線混線
- production と side-by-side の識別情報未記録
