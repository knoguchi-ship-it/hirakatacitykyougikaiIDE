# 実装設計ブループリント

作成日: 2026-04-20
対象: `public / member / admin` 分離の実装着手準備
前提: 公開ポータル URL は維持し、会員/管理者 URL は変更を許容する

## 1. この文書の目的

この文書は、`docs/109_THIRD_PARTY_ASSESSMENT_2026-04-20.md` と `docs/110_REMEDIATION_PLAN_PORTAL_URL_AND_AUTH_2026-04-20.md` を、次担当がそのまま実装に着手できる粒度へ落とすための実装設計書である。

対象は以下の3点。

- どこまで分離するか
- 現行コードのどこをどのアプリへ移すか
- 何から着手し、どの順で安全に切り替えるか

## 2. 本日確認した外部基準

2026-04-20 時点で、以下の一次ソースを基準として採用する。

- OWASP ASVS 5.0.0
  - 2025-05-30 公開の最新 stable
  - https://owasp.org/www-project-application-security-verification-standard/
- OWASP Authorization Cheat Sheet
  - deny-by-default、least privilege、server-side enforcement を採用
  - https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html
- OWASP Authentication Cheat Sheet
  - principal binding、session 管理、認証境界の分離を採用
  - https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
- OWASP Password Storage Cheat Sheet
  - Argon2id / scrypt / PBKDF2 の推奨値を採用
  - https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
- Google Apps Script Web Apps
  - deployment 単位の実行権限と公開設定を確認
  - https://developers.google.com/apps-script/guides/web
- Google Apps Script Manifest Structure
  - `oauthScopes` と `webapp` 設定の分離方針に利用
  - https://developers.google.com/apps-script/manifest
- Google Apps Script Authorization Scopes
  - 最小権限化の根拠
  - https://developers.google.com/apps-script/concepts/scopes
- Google Apps Script Best Practices
  - batch / cache / UI-heavy script の設計方針に利用
  - https://developers.google.com/apps-script/guides/support/best-practices
- Google Apps Script HTML Service Best Practices
  - HTML Service 配信面の責務分離に利用
  - https://developers.google.com/apps-script/guides/html/best-practices
- CISA Secure by Design
  - secure-by-default、radical transparency、blast radius 縮小の原則に利用
  - https://www.cisa.gov/resources-tools/resources/secure-by-design
- NIST CSF 2.0
  - Govern / Protect / Detect を設計受け入れ基準に利用
  - https://www.nist.gov/cyberframework

この文書内の判断は、上記基準と案件正本を突き合わせた結果である。

## 3. 実装上の最終到達点

最終的な配信面と責務は以下の3アプリに分離する。

### 3.1 public app

- 匿名公開専用
- 役割:
  - 公開トップ
  - 公開研修一覧
  - 非会員研修申込 / 取消
  - 新規入会申込
- 認証:
  - 原則匿名
- 許可 API:
  - `getPublicTrainings`
  - `getPublicPortalSettings`
  - `applyTrainingExternal`
  - `cancelTrainingExternal`
  - `submitMemberApplication`
- 禁止:
  - 会員一覧取得
  - member/admin 用 bootstrap
  - 全件データ取得
  - 本人更新
  - 管理系処理

### 3.2 member app

- 会員本人セルフサービス専用
- 役割:
  - 会員ログイン
  - 自分のプロフィール表示 / 更新
  - 自分の所属職員情報の範囲内の表示 / 更新
  - 自分の研修申込 / 取消
  - 自分の退会申請 / 取消
- 認証:
  - `loginId + password`
- 許可 API:
  - `memberLogin`
  - `memberLoginWithData`
  - `getMemberPortalData`
  - `updateMemberSelf`
  - `applyTraining`
  - `cancelTraining`
  - `withdrawSelf`
  - `cancelWithdrawalSelf`
  - `changePassword`
- 禁止:
  - 全件一覧
  - 管理者ダッシュボード
  - 管理設定
  - 横断検索

### 3.3 admin app

- 事務局管理専用
- 役割:
  - 管理者ログイン
  - 会員管理
  - 年会費管理
  - 研修管理
  - 一括メール
  - 名簿出力
  - 権限管理
  - システム設定
- 認証:
  - Google アカウント + whitelist
- 許可 API:
  - `checkAdminBySession`
  - `adminLoginWithData`
  - `getAdminDashboardData`
  - `fetchAllData`
  - `getAdminPermissionData`
  - `getTrainingManagementData`
  - `getAnnualFeeAdminData`
  - 管理系 write action 全般
- 禁止:
  - 匿名公開 action の混在
  - 一般会員用の画面 bootstrap を前提とした分岐

## 4. 現行実装から見た分離単位

現行は 1 つの Apps Script project に、公開・会員・管理者が同居している。実装着手時は、以下の単位で切り分ける。

### 4.1 配信面

- 現行:
  - `backend/Code.gs#doGet`
  - `backend/index.html`
  - `backend/index_public.html`
- 分離後:
  - public app は `index_public` のみを配信
  - member app は `index` のうち会員画面だけを配信
  - admin app は管理 UI だけを配信

### 4.2 API 入口

- 現行:
  - `processApiRequest(action, payload)` に全 action が集中
- 分離後:
  - 共通 dispatcher は持ってもよい
  - ただし action registry を `public / member / admin` で完全分離する
  - app ごとに allowlist を持ち、他 app の action は到達前に拒否する

### 4.3 principal 解決

- 現行:
  - 一部 action が `payload.loginId` や `memberId` を信頼
- 分離後:
  - public: principal 不要
  - member: server-verified member principal
  - admin: server-verified admin principal
  - write API は payload の識別子ではなく principal から対象を引く

### 4.4 manifest / scopes

- 現行:
  - `backend/appsscript.json` に広い scope が集約
  - `webapp.access = ANYONE_ANONYMOUS`
- 分離後:
  - public app:
    - 匿名公開を維持
    - 必要最小限の scopes のみ
  - member app:
    - 匿名公開にしない
    - 会員セルフサービスに必要な scopes に限定
  - admin app:
    - 管理機能に必要な scopes を保持

## 5. 実装方式の推奨

### 5.1 リポジトリ構成

次段階では、プロジェクト分離とコード再利用の両立のため、リポジトリは 1 つのまま保ちつつ、Apps Script 成果物を3系統へ出し分ける。

推奨構成:

```text
/src
  /public-portal
  /member-app
  /admin-app
  /shared
/gas
  /shared
  /public
  /member
  /admin
/backend
  # 現行互換。移行完了後に縮退
```

意図:

- フロントエンドは app ごとに entry を分ける
- GAS 側は共通関数と app 固有 entrypoint を分ける
- 共通コードをコピーせず、shared module を生成物へ束ねる

### 5.2 Apps Script project の分け方

推奨:

- `public-gas`
- `member-gas`
- `admin-gas`

理由:

- `PropertiesService` は script 間共有できないため、script 固有設定を app 単位で明確化できる
- `oauthScopes` を app 単位で最小化できる
- deployment / URL / access 設定を app 単位で持てる
- blast radius を app 単位で閉じ込められる

補足:

- DB は同一 Spreadsheet を継続利用してよい
- 共有設定は Spreadsheet または設定シートを正本に寄せる
- script property 依存値は app ごとに再設計する

## 6. 実装着手順

### Step 0: 論理境界の固定

対象:

- `backend/Code.gs:processApiRequest`
- `docs/05_AUTH_AND_ROLE_SPEC.md`
- `docs/02_ARCHITECTURE.md`

作業:

- action を `public / member / admin` に棚卸し
- 匿名許可 action を public 専用に固定
- member/admin の principal 必須 action を固定
- `fetchAllData` 系を member から切り離す

完了条件:

- action 所有表が確定
- deny-by-default が文書上確定

### Step 1: member principal の server-side 化

対象:

- `getMemberPortalData_`
- `updateMemberSelf_`
- `applyTraining_`
- `cancelTraining_`
- `withdrawSelf_`
- `cancelWithdrawalSelf_`

作業:

- `payload.loginId`, `payload.memberId`, `payload.staffId` 依存を外す
- ログイン成功時に server-side principal を短期セッション化する
- 以後の member API はその principal だけを信頼する

完了条件:

- 自己更新系 API が caller payload に依存しない

### Step 2: public の先行分離

対象:

- `src/public-portal/*`
- `backend/index_public.html`
- 公開 action 群

作業:

- public app を別 Apps Script project 化
- 既存公開 URL を切り替えず移管できるよう deployment を再設定
- public 側から member/admin action へ到達できない構造にする

完了条件:

- 公開 URL 維持
- public app に内部 action が存在しない

### Step 3: member と admin の分離

対象:

- `src/App.tsx`
- `src/components/*`
- `src/services/api.ts`
- 管理コンソール群

作業:

- member 用 entry と admin 用 entry を分ける
- admin bootstrap と member bootstrap を分離
- admin app を別 Apps Script project 化
- admin 専用 API registry を持たせる

完了条件:

- 会員 URL と管理 URL が分かれる
- admin のみが全件系 API に到達可能

### Step 4: manifest と scopes の最小化

対象:

- 各 app の `appsscript.json`

作業:

- public から不要な Gmail / Drive / deploy 系 scope を外す
- member から不要な管理系 scope を外す
- admin だけが運用上必要な scope を維持する

完了条件:

- 各 app の scope 理由が文書化されている

### Step 5: 認証基盤とパスワード保護の更新

対象:

- パスワード保存
- member session

作業:

- 現行の単発 SHA-256 + salt を PBKDF2-HMAC-SHA-256 以上へ移行
- login 時 rehash migration を導入
- session TTL / logout / invalidation 方針を文書化

完了条件:

- 旧ハッシュからの段階移行が可能
- 新規パスワード更新は新方式で保存

## 7. 現行コードの移管表

### 7.1 public app に残すもの

- `src/public-portal/App.tsx`
- `src/public-portal/components/*`
- `getPublicTrainings`
- `getPublicPortalSettings`
- `applyTrainingExternal`
- `cancelTrainingExternal`
- `submitMemberApplication`

### 7.2 member app に残すもの

- `src/App.tsx` のうち会員画面部分
- `src/components/MemberForm.tsx`
- `src/components/TrainingApply.tsx`
- `src/services/api.ts` の member 用関数
- `memberLogin`
- `memberLoginWithData`
- `getMemberPortalData`
- `updateMemberSelf`
- `applyTraining`
- `cancelTraining`
- `withdrawSelf`
- `cancelWithdrawalSelf`
- `changePassword`

### 7.3 admin app に残すもの

- 管理コンソール UI 一式
- `fetchAllData`
- `getAdminDashboardData`
- `getAdminInitData`
- `getTrainingManagementData`
- `getAdminPermissionData`
- `getAnnualFeeAdminData`
- `updateMember`
- `updateMembersBatch`
- `createMember`
- `withdrawMember`
- `scheduleWithdrawMember`
- `cancelScheduledWithdraw`
- `updateStaff`
- `removeStaffFromOffice`
- `convertMemberType`
- `saveTraining`
- `uploadTrainingFile`
- `sendTrainingReminder`
- `getTrainingApplicants`
- `sendTrainingMail`
- `getSystemSettings`
- `updateSystemSettings`
- `saveAdminPermission`
- `deleteAdminPermission`
- `saveAnnualFeeRecord`
- `saveAnnualFeeRecordsBatch`
- `getMembersForBulkMail`
- `sendBulkMemberMail`
- `getEmailSendLog`
- `getMembersForRoster`
- `generateRosterZip`
- 修復系 API 群

## 8. 実装時の重要注意点

### 8.1 URL を先に変えない

- public URL は固定
- member/admin は切替準備が整うまで旧導線を残してよい
- ただし canonical は文書で明示する

### 8.2 action 名を安易に再利用しない

- 分離後は app ごとの registry に移す
- 同名 action を残す場合でも app 側で明示登録する
- implicit fallthrough を作らない

### 8.3 キャッシュを app 単位で分ける

- 現行 cache key は全 app 混在の前提がある
- `public:`, `member:`, `admin:` prefix を導入する
- principal を含むレスポンスは共有キャッシュへ載せない

### 8.4 設定値の置き場を app 跨ぎで見直す

- `PropertiesService` は script 間共有できない
- app 共通設定は Spreadsheet 設定シートへ寄せる
- script property は app 固有設定だけに使う

### 8.5 HTML Service の配信責務を混ぜない

- public HTML に member/admin bootstrap を含めない
- admin HTML に public 用 script を含めない
- bundle の混在を避ける

## 9. 受け入れ基準

### 9.1 public

- 匿名で開ける
- 公開 action 以外は到達できない
- 会員/管理者データを返さない

### 9.2 member

- `loginId + password` でのみ入れる
- 自分のデータだけ取得・更新できる
- payload 側の `memberId` 改ざんでは他人へ触れない

### 9.3 admin

- Google アカウント + whitelist でのみ入れる
- 管理系 API は admin app からのみ到達する
- member app から管理 API 名を送っても拒否される

### 9.4 共通

- `oauthScopes` が app ごとに最小化されている
- `docs/09_DEPLOYMENT_POLICY.md`, `HANDOVER.md`, `docs/02_ARCHITECTURE.md`, `docs/05_AUTH_AND_ROLE_SPEC.md` が同期している

## 10. 次担当の最初の実装タスク

次回着手時は、以下をこの順で行う。

1. `processApiRequest` の action 棚卸し表をコード上へ反映する
2. `publicAllowedActions`, `memberAllowedActions`, `adminAllowedActions` を定数化する
3. `getMemberPortalData_` と `updateMemberSelf_` から client-supplied identifier 依存を外す
4. public app に残す action だけを切り出す
5. app 単位の manifest 雛形を作る

## 11. 先に作っておくべき準備物

- app ごとの `clasp.json` 管理方針
- app ごとの `appsscript.json` 雛形
- build 出力先の命名規則
- app ごとの deployment ID 管理表
- app ごとの runtime verification 手順
- app ごとの scope 理由書

## 12. この文書の位置づけ

- 方針: `docs/110_REMEDIATION_PLAN_PORTAL_URL_AND_AUTH_2026-04-20.md`
- 根拠評価: `docs/109_THIRD_PARTY_ASSESSMENT_2026-04-20.md`
- 実装着手用詳細: 本文書

この文書は release state ではなく、是正プロジェクトの実装正本である。

## 13. 2026-04-20 実装着手メモ

- 初手の実装は project 分離や URL 切替ではなく、既存 `backend/Code.gs` 上での認可境界固定を優先する。
- `processApiRequest` では `publicAllowedActions` / `memberAllowedActions` / `ADMIN_ACTION_PERMISSIONS` の登録外 action を `unsupported_action` で拒否する。
- 会員セルフサービスでは `loginId` から解決した `T_認証アカウント` の `会員ID` / `職員ID` を canonical principal とし、`payload.memberId` は後方互換入力としてのみ扱う。
- 当面は既存 UI と既存 deployment を壊さないことを優先し、wrapper で principal を正規化してから既存関数へ委譲する段階移行とする。

## 14. 2026-04-20 member GAS build scaffold

- `public` deployment の `backend/` 出力は変更せず、会員マイページ専用の side-by-side build root として `gas/member/` を追加した。
- `npm run build:gas:member` は `backend/Code.gs` / `backend/appsscript.json` / `dist/index.html` を `gas/member/` へコピーし、既存 public build と fixed deployment には影響させない。
- `gas/member/.clasp.json.example` を追加し、将来の member 専用 Apps Script project は `rootDir=gas/member` で接続する前提を明示した。
- `appsscript.json` の scope 最小化はまだ未着手とし、まずは side-by-side verification を優先する。

## 15. 2026-04-20 admin GAS build scaffold

- `npm run build:gas:admin` を追加し、管理者 UI 専用の `dist-admin/index_admin.html` を `gas/admin/` に出力できるようにした。
- frontend は `VITE_APP=admin` のとき管理者ログインを初期表示し、会員用 login tab を隠す。
- 既存 production build (`build:gas`) は変更せず、side-by-side の `member/admin` build だけを分岐する。
- `gas/admin/.clasp.json.example` と `gas/admin/README.md` を追加し、admin 専用 project の root を `gas/admin` として管理する前提を明示した。
- admin side-by-side project と deployment 自体は作成したが、`/exec` は `404 Not Found` のままであり、Apps Script UI での deployment 種別 / access 確認が必要。

## 16. 2026-04-27 v279 app boundary API gate

- 完全分立の Phase 1 として、各 `Code.gs` に `APP_SECURITY_BOUNDARY` を追加した。
- `backend/Code.gs` は `public`、`gas/member/Code.gs` は `member`、`gas/admin/Code.gs` は `admin` として動作する。
- `processApiRequest` は app 境界外の action を `unsupported_action` で拒否する。
- この段階では既存機能破損を避けるため、関数本体の削除は行っていない。
- 次フェーズでは action registry の物理分離、dead code 削除、manifest / scope 最小化、shared 生成設計の順で進める。

## 17. 2026-04-27 v280 member UI / action registry separation

- member shell の未認証画面は会員ログインフォームのみ表示する。管理者ログインタブ、管理者 Google 認証ボタン、管理者 Google 認証説明は表示しない。
- `processApiRequest` は `getActionRegistryForCurrentApp_()` を経由し、app ごとの allowlist だけを参照する。
- `scripts/build-member-gas.mjs` / `scripts/build-admin-gas.mjs` は `backend/Code.gs` コピー時に `APP_SECURITY_BOUNDARY` を app 別値へ置換する。これにより将来の個別 build で境界値が `public` に巻き戻る事故を防ぐ。
- この段階でも関数本体の dead code 削除は未実施。次は member/admin/public それぞれの `Code.gs` から境界外関数を段階削除し、最後に appsscript manifest と OAuth scope を最小化する。

## 18. 2026-04-27 v281 split action registry physical reduction

- `scripts/build-member-gas.mjs` は member artifact 生成時に `PUBLIC_ALLOWED_ACTIONS` / `ADMIN_LOGIN_ACTIONS` / `ADMIN_ACTION_PERMISSIONS` を `{}` に置換する。
- `scripts/build-admin-gas.mjs` は admin artifact 生成時に `PUBLIC_ALLOWED_ACTIONS` / `MEMBER_ALLOWED_ACTIONS` を `{}` に置換する。
- split 生成物の action registry は app 固有 action だけを保持する状態になった。
- 次フェーズでは、action registry ではなく関数本体の dead code を削除する。削除前に呼び出しグラフを作り、管理者機能から再利用されている shared helper を誤って削除しないこと。

## 19. 2026-04-27 v282 split action handler pruning

- `scripts/build-member-gas.mjs` は member allowlist 外の `processApiRequest` action handler 分岐を生成時に削除する。
- `scripts/build-admin-gas.mjs` は admin allowlist 外の `processApiRequest` action handler 分岐を生成時に削除する。
- member 生成物の `processApiRequest` は member action 9件のみを保持する。
- admin 生成物の `processApiRequest` は admin login / admin permission action のみを保持する。
- 関数本体はまだ削除していない。次は呼び出しグラフを作成し、shared helper を保護した上で関数単位削除へ進む。

## 20. 2026-04-27 v283 member function body pruning

- `scripts/build-member-gas.mjs` は member artifact 生成時にトップレベル関数の静的到達解析を行う。
- `doGet` / `processApiRequest` から到達不能なトップレベル関数宣言を `gas/member/Code.gs` 生成物から削除する。
- member 生成物は 576 関数から 115 関数へ削減した。
- ローカル関数宣言まで削除対象にすると構文破壊するため、pruning 対象はトップレベル関数のみに限定する。
- `checkAdminBySession_` は `updateMember_` 共用により静的到達として残存。次フェーズで member self-service 更新処理を admin 更新処理から切り離して削除する。

## 21. 2026-04-27 v284 member function pruning rollback

- v283 は `addPublicStaffMember_` 本体を削除した一方、後段の wrapper 代入 `var _origAddPublicStaffMember = addPublicStaffMember_;` を残し、会員マイページで `ReferenceError` を発生させた。
- 直前安定版 `@34` へ一時切り戻し後、`scripts/build-member-gas.mjs` の関数本体 pruning 実行を無効化した。
- 安全版 member split version `36` を作成し、fixed deployment を `@36` へ同期した。
- 単純な静的到達解析による GAS 関数本体 pruning は禁止。再開する場合は wrapper / alias / 再代入 / trigger / 直接実行関数を検出できる依存解析を先に実装する。
- 次フェーズは関数削除ではなく、`updateMemberSelf_` と `updateMember_` の責務分離に戻す。

## 22. 2026-04-27 v285 member self-service core split

- `updateMember_` は admin wrapper として残し、必要時のみ `checkAdminBySession_()` を実行する。
- 実保存処理は `saveMemberCore_` に分離した。
- `updateMemberSelf_` は `updateMember_` を通さず `saveMemberCore_` へ直接委譲する。
- これにより member self-service 経路から admin 認証 wrapper への直接依存を除去した。
- 次は `saveMemberCore_` 内の admin audit / role validation 依存を option で明示分岐し、member 生成物から admin-only helper への静的参照をさらに減らす。
# Latest Addendum: 2026-04-28 v286 explicit admin-only member core options

- `saveMemberCore_` に `enableAdminRoleValidation` / `enableAdminAudit` option を追加した。
- `updateMember_` は admin wrapper として両 option を `true` にし、代表者ロール遷移検証と管理者監査ログを維持する。
- `updateMemberSelf_` は両 option を渡さないため、会員セルフ更新では admin-only 検証・監査ログを実行しない。
- DB スキーマ、画面導線、ログイン仕様、保存仕様は変更していない。
- 今後も分割は「機能維持、境界明確化、最小権限化」の順で進める。v283 で破損した単純な関数本体 pruning は、wrapper / alias / 再代入 / trigger / Apps Script 直接実行関数を含む依存解析ができるまで禁止する。

# Latest Addendum: 2026-04-28 v287 member/admin physical function pruning

- member/admin split の生成時に、到達不能トップレベル関数と、それに依存するトップレベル文を同時に削除する方式へ進めた。
- member 生成物では admin 権限分岐を削除し、`checkAdminBySession_` など admin-only 関数の到達を断った。
- admin 生成物では member セッション分岐を削除し、member/public action 実体への到達を断った。
- v283 の失敗原因だった wrapper / 再代入の参照残りは、依存トップレベル文の同時削除で対策した。
- URL 維持条件により public deployment ID を別 Apps Script project へ移管することはできない。public の完全物理分離は、full source を別正本へ退避し、統合 project へ push する artifact を public 専用にする方式で進める。

# Latest Addendum: 2026-04-28 public portal remaining separation plan

- 次フェーズの正本計画は `docs/165_HANDOVER_PUBLIC_PORTAL_SEPARATION_PLAN_2026-04-28.md` とする。
- 目的は、現在の public URL を維持しながら integrated project の push artifact を public-only `Code.gs` に縮退し、admin/member の action registry、handler、認証処理、処理実体へ public から到達できないようにすること。
- 既存 web app deployment ID を別 Apps Script project へ移管することはできないため、「project 移管」ではなく「artifact 縮退」として進める。
- admin `@47` はホワイトアウト済みのため、admin physical pruning は原因特定と seed list 保護設計が完了するまで再デプロイしない。
