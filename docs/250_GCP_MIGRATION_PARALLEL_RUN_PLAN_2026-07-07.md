# 250. GCP Parallel Run Migration Plan

作成日: 2026-07-07
状態: **計画正本・実装前**
対象: 枚方市介護支援専門員連絡協議会 会員システム

## 0. 結論

GCP 移行期も、現行 GAS 本番環境は維持する。

この移行は「GAS を止めて GCP へ一括切替」ではない。現行本番を稼働させたまま、GCP 側を段階的に追加し、互換 API・検証・ロールバック条件が満たされた範囲だけを移す。

作業場所の役割を分ける。

| 場所 | 役割 |
|---|---|
| `C:\VSCode\CloudePL\hirakatacitykyougikaiIDE` | 現本番の正本。移行計画、API 互換仕様、切替条件、ロールバック条件を管理する |
| `C:\VSCode\CloudePL\hirakatacitykyougikaiGCP` | GCP 側実装作業場。Cloud Run / Secret Manager / 将来の GCP API を実装する |

本書は前者、つまり本番正本側に置く。GCP 作業場は本書を参照し、本番 GAS / Spreadsheet / fixed deployment を直接変更しない。

## 1. 現状

### 1.1 現行本番

- Frontend: React SPA を GAS HtmlService で配信
- API transport: `google.script.run` -> `processApiRequest`
- Backend: Google Apps Script
- DB: Google Spreadsheet
- 境界: public / member / admin の 3 split
- 正本: `HANDOVER.md`, `docs/09_DEPLOYMENT_POLICY.md`

現行本番は移行期間中も利用者向けの主系とする。

### 1.2 GCP Phase 0

GCP 側 Phase 0 は完了済み。

- GCP project: `hcmn-member-system-prod` (`88737175415`)
- Cloud Run service: `hcmn-password-hash`
- URL: `https://hcmn-password-hash-axku24p5ja-an.a.run.app`
- Region: `asia-northeast1`
- Secret Manager: `PASSWORD_HASH_PEPPER_V1` version 1 enabled
- Cloud Run unauthenticated `/health`: 403
- Cloud Run service status: Ready

ただし、2026-07-07 時点で次の未解決点がある。

| 項目 | 現状 | 必須対応 |
|---|---|---|
| Secret 名 | GCP 側は `PASSWORD_HASH_PEPPER_V1`、GAS コードは `password-hash-pepper-v1` | Secret 名を一致させる、または Script Property で明示設定可能にする |
| OIDC audience | Cloud Run は service URL を `EXPECTED_AUDIENCE` にしている | GAS の `ScriptApp.getIdentityToken()` の `aud` を dryRun で確認し、Cloud Run custom audiences とアプリ側検証を合わせる |
| Apps Script scope | `openid` 未追加。Cloud Run app は email allowlist も見る設計だが、`userinfo.email` は admin split のみ | Phase B で `openid` と email claim 方針を確定する。現行 `ALLOWED_INVOKERS` を維持するなら 3 split に `userinfo.email` も追加する |
| Argon2 呼び出し | GAS 側未実装 | `ARGON2_ENABLED=false` から段階導入する |

## 2. 最新一次情報に基づく制約

2026-07-07 時点で確認した一次情報は以下。

- Apps Script から Google Cloud service へ接続する公式手順では、`ScriptApp.getIdentityToken()` を使い、`openid` scope と `script.external_request` scope が必要とされている。また、Cloud service 側はその identity token を受け入れるように設定する必要があり、Cloud Run の場合は script client ID を custom audience に登録できる。  
  Source: <https://developers.google.com/apps-script/guides/services/cloud-run> (Last updated 2026-04-20)
- Cloud Run は IAM 保護された service への呼び出しで ID token の `aud` が受信 service の `*.run.app` URL と一致することを基本とし、必要に応じて custom audiences を service level で設定できる。custom audiences の変更は新 revision を作る。  
  Source: <https://cloud.google.com/run/docs/configuring/custom-audiences> (Last updated 2026-06-29)
- Cloud Run は revision ごとの traffic split / gradual rollout / rollback を持つ。rollback は previous revision に 100% traffic を戻す方式で行える。traffic 切替中の in-flight request は即時中断されない。  
  Source: <https://cloud.google.com/run/docs/rollouts-rollbacks-traffic-migration>
- Secret Manager は IAM で保護され、最小権限、環境分離、secret-level IAM binding / IAM Conditions を推奨している。  
  Source: <https://cloud.google.com/secret-manager/docs/best-practices>
- OWASP Password Storage Cheat Sheet は Argon2id を推奨し、`m=19456, t=2, p=1` を推奨構成の一つとして挙げる。work factor は実サーバ性能で検証し、rehash-on-login が一般的な更新方式。  
  Source: <https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html>

## 3. 移行原則

1. 現行 GAS 本番を移行期間の主系とする。
2. GCP 側は追加のみ。既存本番 resource を変更・削除しない。
3. Frontend は `ApiClient` interface を境界にし、GAS transport と GCP transport を並列に持つ。
4. 本番ユーザー向けの書込正本は、明示切替まで Spreadsheet / GAS とする。
5. GCP 側で先に作る API は GAS API と互換にし、画面側の業務ロジックを分岐させない。
6. Secret value、token、session、OAuth client secret は Git / docs / log / chat に出さない。
7. 切替は feature flag / config / traffic split で戻せる単位だけ行う。
8. 書込移行は read shadow と reconciliation が通るまで行わない。
9. 失敗時の rollback path がない phase は本番に出さない。

## 4. Target Architecture

### 4.1 移行期

```
Browser
  -> GAS WebApp frontend
    -> GasApiClient
      -> google.script.run
        -> GAS processApiRequest
          -> Spreadsheet DB
          -> Cloud Run password-hash only when enabled

Browser
  -> GCP hosted frontend
    -> GcpApiClient
      -> Cloud Run API
        -> GCP datastore or compatibility backend
```

移行期は両方の frontend が存在してよい。ただし、同一画面コンポーネントは `ApiClient` contract の上で動かす。画面が `google.script.run` や Cloud Run URL を直接知ってはいけない。

### 4.2 最終形候補

```
Browser
  -> GCP hosted frontend
    -> Cloud Run API
      -> Firestore / Cloud SQL
      -> Secret Manager
      -> Mail / Drive replacement or controlled GAS bridge
```

最終形は別途判断する。Firestore / Cloud SQL / GAS bridge の採否は、本書の Phase 2 以降で実測と設計判断を行う。

## 5. Phase Plan

### Phase 0: GCP 基盤 / password-hash service

状態: 完了済み。ただし本番接続前の是正あり。

完了済み:
- Cloud Run service 作成
- Secret Manager secret 作成
- API 有効化
- 予算アラート
- 未認証 403

本番接続前ゲート:
- Secret 名不一致を解消する
- Cloud Run `EXPECTED_AUDIENCE` と custom audiences の方針を確定する
- Cloud Run app の `ALLOWED_INVOKERS` が email claim を前提にするかを確定する。前提にする場合は、3 split manifest に `userinfo.email` を追加し、dryRun で email claim の有無だけを確認する
- Cloud Run IAM `roles/run.invoker` の付与先を dryRun で確認した caller principal と一致させる。`allUsers` / `allAuthenticatedUsers` は使わない
- `/health` を正とし、`/healthz` を使わない

### Phase B: GAS -> Cloud Run password-hash 接続

目的: 現行 GAS 本番のまま、password KDF だけ Cloud Run Argon2id へ段階移行する。

実施場所:
- 実装: `hirakatacitykyougikaiIDE`
- Cloud Run 設定変更: `hirakatacitykyougikaiGCP` / gcloud

手順:
1. 3 split に `openid` scope を追加する。
2. 現行 Cloud Run app の `ALLOWED_INVOKERS` を維持する場合は、3 split に `userinfo.email` scope も追加する。email claim に依存しない設計へ変える場合は、Cloud Run app 側の allowlist 仕様を先に文書化し、unit test を追加する。
3. token 自体をログ出力せず、dryRun で `ScriptApp.getIdentityToken()` payload の `aud`, `iss`, `email` 有無、caller principal の種別だけ確認する。値そのものはログ・チャット・docs に出さない。
4. Cloud Run custom audiences に GAS OAuth client ID を追加する。
5. Cloud Run IAM `roles/run.invoker` を、dryRun で確認した caller principal に最小権限で付与する。
6. Cloud Run app 側 `EXPECTED_AUDIENCE` を複数 audience 対応にする。少なくとも service URL と GAS OAuth client ID を許可し、許可外 audience を拒否する unit test を追加する。
7. Secret 名を `PASSWORD_HASH_PEPPER_V1` に合わせる、または Script Property `PASSWORD_HASH_PEPPER_SECRET_NAME` で設定可能にする。
8. `CLOUD_RUN_HASH_SERVICE_URL` と `ARGON2_ENABLED=false` を 3 split Script Properties に設定する。値は表示・記録しない。設定済みかどうかだけ dryRun で確認する。
9. `hashPasswordArgon2_` / `verifyPasswordArgon2_` を追加する。
10. dryRun で hash -> verify を実 DB 非破壊で確認する。
11. `ARGON2_ENABLED=false` のまま release し、既存 PBKDF2 login が壊れていないことを確認する。
12. operator 承認後、限定時間に `ARGON2_ENABLED=true` を切替え、rehash-on-login を開始する。

Rollback:
- `ARGON2_ENABLED=false` に戻す。
- Cloud Run 障害時も既存 PBKDF2 hash の検証を維持する。
- 既に Argon2id 化された user がいる場合、Argon2 verify path は残す。Cloud Run を完全停止する rollback は不可逆に近いため、Argon2 有効化前に十分な dryRun を必須にする。

### Phase 1: Frontend transport 分離

目的: 同じ frontend を GAS と GCP の両 runtime で動かす基盤を作る。

着手前ブロッカー:
- Browser -> GCP API の認証方式を確定する。admin / member / public の境界を混ぜない方式が決まるまで、GCP runtime の本番向け API 実装に進まない。
- GCP frontend hosting の候補を決める前に、GAS 配信中の現行 frontend に影響しない runtime config 注入方式を確定する。

現状:
- `src/services/api.ts` は `GasApiClient` 固定。
- `google.script.run` 前提。

方針:
- `ApiClient` interface を正本にする。
- `GasApiClient` は既存本番用として温存する。
- `GcpApiClient` を新規追加する。
- `createApiClient(config)` で runtime を選ぶ。
- GAS 配信時は `window.__APP_CONFIG__.apiRuntime='gas'` を server side injection する。
- GCP 配信時は build env または runtime config で `apiRuntime='gcp'` と `apiBaseUrl` を与える。

禁止:
- React component から `google.script.run` を直接呼ばない。
- React component から Cloud Run URL を直接参照しない。
- GAS 本番用 URL / GCP URL を同じ定数に混ぜない。

完了ゲート:
- GAS runtime で既存 E2E がすべて通る。
- GCP runtime では read-only mock / compatibility endpoint で同じ screen が起動する。
- API transport 差替で UI state, auth state, error handling が分岐しない。

### Phase 2: GCP API compatibility layer

目的: GAS `processApiRequest(action, payload)` と互換の GCP API を作る。

方針:
- 最初は read-only endpoint から始める。
- `action` 互換でも REST でもよいが、frontend `ApiClient` から見える contract は同一にする。
- response envelope は `{ success, data, error }` 互換から始め、後で整理する。
- admin/member/public の境界は GCP 側でも分離する。

完了ゲート:
- read-only actions の contract test が GAS / GCP 両方に対して通る。
- authz は server side で強制する。
- GCP API は未許可 action を deny-by-default にする。

### Phase 3: Read shadow / read-only 並走

目的: GCP 側が本番 traffic を受ける前に、読取結果の差分を測る。

方式:
- GAS 本番を主系にしたまま、GCP read endpoint を shadow 実行する。
- 差分は件数、ID、重要フィールド hash だけを記録する。
- PII や secret はログに出さない。

完了ゲート:
- 主要 read actions で差分 0、または許容差分が文書化済み。
- 360px mobile / desktop で両 runtime の UI が破綻しない。
- GCP 側障害時も GAS 本番に影響しない。

### Phase 4: 限定書込移行

目的: 低リスクな書込から GCP へ移す。

前提:
- idempotency key を導入する。
- audit log を GAS / GCP の両方で照合できる。
- write rollback または compensating action を定義する。

候補:
- 監査ログなど user impact が低いもの
- 非同期ジョブ
- dryRun 可能な処理

禁止:
- 会員作成・更新・削除、年会費、研修申込など主要 write を最初に移すこと。
- Spreadsheet と GCP DB の dual-write を reconciliation なしで始めること。

### Phase 5: DB 移行 / 同期

目的: Spreadsheet 依存を縮小する。

選択肢:
- Firestore: document 指向、スケールしやすい。FK はアプリ制約。
- Cloud SQL: リレーション制約とトランザクション重視。運用と費用は増える。

判断軸:
- 参照整合性を DB 制約で解きたいなら Cloud SQL 優先。
- 運用軽さと段階移行を優先するなら Firestore 優先。
- 本案件は Spreadsheet の FK 不在が主要リスクなので、DB 選定前にリレーション制約表を作る。

完了ゲート:
- 全テーブル mapping
- `docs/03_DATA_MODEL.md` と `gas-src/Code.full.gs` のテーブル定義から、列単位の移行表を作る
- Spreadsheet 上の主キー・外部キー相当・soft delete / archive / audit log の扱いを明記する
- dual-write を始める場合は、idempotency key の保存先、重複時の扱い、再試行、補償処理を事前に定義する
- migration dryRun
- row count / checksum / referential integrity report
- rollback 手順
- 書込停止時間の明示

### Phase 6: 切替 / GAS 縮退

目的: GCP を主系化し、GAS を縮退または撤去する。

条件:
- GCP read/write E2E が本番同等に通る。
- 直近 rollback 先が明確。
- operator が DNS / URL / deployment の切替手順を実施できる。
- 現行 GAS fixed deployment は一定期間 fallback として残す。

旧 GAS URL の転送化（2026-07-11 operator 決定・**Phase 6 の最終ステップ＝現行 GAS 本番の撤去時にのみ実施**）:
- GAS は HTTP 302 リダイレクト不可（doGet はヘッダー/ステータス制御不可、iframe 配信のため `<meta refresh>` も親ページに効かない）。
- 代替として、3 split の `doGet` を **JS 自動転送ページ**に差し替える: `window.top.location.replace(新URL)` + JS 無効時フォールバックの `target="_top"` リンク。`e.parameter` のクエリは新 URL へ引き継ぐ。
- これにより旧 URL（ブックマーク・配布済みリンク）は恒久窓口として生き続ける。差分は転送時の GAS 起動待ち（1〜数秒）のみ。
- **この転送化を実施するまでは旧 GAS URL・fixed deployment を一切変更しない**。転送化＝GAS アプリ本体の廃止を意味するため、GCP 側の本番安定確認と operator 承認を前提とする。

## 6. API Contract 方針

`ApiClient` を frontend の唯一の backend 境界にする。

本章の短い一覧だけを移行範囲とみなしてはならない。次担当者は `src/services/api.ts` の `ApiClient` interface から全 method を棚卸しし、各 method を次のいずれかに分類してから GCP API 実装に入る。

- Phase B 対象: password-hash / Secret Manager / Cloud Run 接続のみ
- Phase 1/2 read-only 対象
- Phase 3 read shadow 対象
- Phase 4 以降の write 対象
- 移行期は GAS 残留
- 廃止候補

最低 Contract test 対象:
- `memberLogin`
- `checkAdminBySession`
- `getMemberPortalData`
- `getAdminInitData`
- `getTrainingManagementData`
- `applyTraining`
- `updateMemberSelf`
- `changePassword`
- `requestPasswordReset`
- `completePasswordReset`

追加で必ず棚卸しする重要領域:
- 会員作成・更新・削除、退会、職員更新、会員種別変換
- 研修作成・更新・削除、申込、キャンセル、受講者名簿、出欠
- 年会費、支払履歴、役員・請求・口座情報
- メール送信、メールテンプレート、送信ログ
- 公式LINE投稿依頼、添付ファイル、Drive 連携
- 公開ポータル申込、会員マイページ、管理者権限・RBAC
- 共有メモ、帳票、名簿出力、修復・診断系 dryRun

各 method について以下を固定する。

- input schema
- output schema
- error code / user-facing message
- auth requirement
- side effect
- idempotency
- rollback / compensation

GCP API は GAS API を無理に永続化しない。ただし移行期は frontend から見える contract を一致させる。

### 6.1 ApiClient 全 method 棚卸し分類表（Phase 3 §7-5・2026-07-19 作成）

`src/services/api.ts` の `ApiClient` interface 全 **125 method** を機械抽出し分類した（分類のみ・実装しない）。公開ポータルが `src/shared/api-base.ts` の `callApi` で直接呼ぶ interface 外 action は表末尾の補遺に記載。

分類の凡例:
- **✅済**: Phase 3 で GCP read 実装済（portal-api allowlist）
- **P3-shadow**: read-only。member/admin read の shadow 候補（member 系は Firebase Auth カスタムトークン設計 §12.3 が前提、admin 系は IAP 設計が前提）
- **P4-write**: Phase 4 以降の write 対象
- **GAS残留**: 移行期は GAS 残留（GAS 固有サービス依存: Drive / Gmail / Gemini / シート直結修復。最終処遇は Phase 4 入口で再判定）
- **廃止候補**: 置換予定（§12 確定構成で不要になる）
- **transport内部**: API ではなくクライアント内部 setter

| # | method | 分類 | 備考 |
|---|---|---|---|
| 1 | setMemberSessionToken | transport内部 | session token 保持のみ・サーバー到達なし |
| 2 | fetchAllData | 廃止候補 | 全件フルスキャン（325KB・遅さの主因 §12.6）。§12 の細粒度 read へ置換 |
| 3 | getMemberPortalData | P3-shadow (member) | 会員マイページ主 read。認証設計 §12.3 先行が前提 |
| 4 | getAdminDashboardData | P3-shadow (admin) | |
| 5 | getAdminInitData | P3-shadow (admin) | dashboard+settings 統合 read |
| 6 | getTrainingManagementData | P3-shadow (admin) | |
| 7 | updateMember | P4-write | |
| 8 | updateMemberSelf | P4-write | member 認証必須 |
| 9 | changePassword | P4-write | Phase B（password-hash Cloud Run）連携 |
| 10 | getMemberAuthAccounts | P3-shadow (admin) | 認証メタのみ・hash 値は返さない |
| 11 | adminResetMemberPassword | P4-write | 平文初期 PW 発行経路＝§0 規律の最重要 write |
| 12 | adminIssueMemberCredential | P4-write | 同上 |
| 13 | requestPasswordReset | P4-write | メール送信副作用（移行期の送信自体は GAS MailApp） |
| 14 | completePasswordReset | P4-write | |
| 15 | getSystemSettings | P3-shadow (admin) | |
| 16 | updateSystemSettings | P4-write | |
| 17 | getAnnualFeeAdminData | P3-shadow (admin) | |
| 18 | saveAnnualFeeRecord | P4-write | |
| 19 | saveAnnualFeeRecordsBatch | P4-write | |
| 20 | memberLogin | P4-write（認証置換） | §12.3 Firebase Auth カスタムトークンへ置換予定 |
| 21 | checkAdminBySession | GAS残留→認証置換 | Google セッション依存。§12.3 IAP 直付けへ置換予定 |
| 22 | getAdminPermissionData | P3-shadow (admin) | |
| 23 | saveAdminPermission | P4-write | |
| 24 | deleteAdminPermission | P4-write | |
| 25 | listRoles | P3-shadow (admin) | |
| 26 | saveRole | P4-write | |
| 27 | deleteRole | P4-write | |
| 28 | duplicateRole | P4-write | |
| 29 | saveTraining | P4-write | |
| 30 | softDeleteTraining | P4-write | |
| 31 | restoreTraining | P4-write | |
| 32 | uploadTrainingFile | GAS残留 | Drive 保存。GCS 置換は Phase 4 入口で判定 |
| 33 | getFileThumbnail | GAS残留 | Drive thumbnail proxy（hotlink 回避） |
| 34 | regenerateThumbnailForTraining | GAS残留 | Drive 依存 |
| 35 | applyTraining | P4-write | Contract test 必須（§6 冒頭） |
| 36 | cancelTraining | P4-write | |
| 37 | getTrainingApplicants | P3-shadow (admin) | |
| 38 | getAdminEmailAliases | GAS残留 | GmailApp alias 列挙に依存 |
| 39 | sendTrainingMail | GAS残留 | Gmail 送信。メール基盤移行は Phase 4 以降の独立判断 |
| 40 | getTrainingRosterDetail | P3-shadow (admin) | |
| 41 | saveAttendance | P4-write | |
| 42 | saveAttendanceBatch | P4-write | |
| 43 | addRosterEntry | P4-write | |
| 44 | addGuestRosterEntry | P4-write | |
| 45 | cancelRosterEntry | P4-write | |
| 46 | updateRosterEntry | P4-write | |
| 47 | getTrainingStats | P3-shadow (admin) | |
| 48 | withdrawMember | P4-write | |
| 49 | withdrawSelf | P4-write | |
| 50 | cancelWithdrawalSelf | P4-write | |
| 51 | submitMemberApplication | P4-write | 公開 write＝DoW ゲート §11-1 消化が前提 |
| 52 | removeStaffFromOffice | P4-write | |
| 53 | getAdminPersonList | P3-shadow (admin) | |
| 54 | updatePersonsBatch | P4-write | |
| 55 | convertMemberType | P4-write | |
| 56 | scheduleWithdrawMember | P4-write | |
| 57 | cancelScheduledWithdraw | P4-write | |
| 58 | updateStaff | P4-write | |
| 59 | generateTrainingEmail | GAS残留 | GAS サーバー側 Gemini API 呼び出し |
| 60 | getMembersForBulkMail | P3-shadow (admin) | |
| 61 | sendBulkMemberMail | GAS残留 | Gmail 送信・REDIRECT/allowlist 運用と一体 |
| 62 | getEmailSendLog | P3-shadow (admin) | |
| 63 | getMailingListTargets | P3-shadow (admin) | |
| 64 | generateMailingListExcel | GAS残留 | Drive 上の Excel 生成 |
| 65 | getCredentialEmailTemplates | P3-shadow (admin) | |
| 66 | saveCredentialEmailTemplate | P4-write | |
| 67 | deleteCredentialEmailTemplate | P4-write | |
| 68 | listMailTemplates | P3-shadow (admin) | |
| 69 | saveMailTemplate | P4-write | |
| 70 | deleteMailTemplate | P4-write | |
| 71 | getBulkMailTemplates | P3-shadow (admin) | |
| 72 | saveBulkMailTemplate | P4-write | |
| 73 | deleteBulkMailTemplate | P4-write | |
| 74 | searchMembersForDelete | P3-shadow (admin) | MASTER 専用 |
| 75 | previewDeleteMember | P3-shadow (admin) | read（プレビュー）・MASTER 専用 |
| 76 | executeDeleteMember | P4-write | 不可逆系＝§9 rollback 設計必須・MASTER 専用 |
| 77 | getDeleteLogs | P3-shadow (admin) | |
| 78 | repairDuplicateStaffRecords | GAS残留 | シート直結の修復運用ツール（MASTER） |
| 79 | repairTrainingApplicationApplicantIds | GAS残留 | 同上 |
| 80 | repairMemberCareManagerDuplicates | GAS残留 | 同上 |
| 81 | getOfficerMasterData | P3-shadow (member/admin) | |
| 82 | saveOrganization | P4-write | |
| 83 | deleteOrganization | P4-write | |
| 84 | saveOfficerRole | P4-write | |
| 85 | deleteOfficerRole | P4-write | |
| 86 | savePaymentType | P4-write | |
| 87 | deletePaymentType | P4-write | |
| 88 | saveWorkCategory | P4-write | |
| 89 | deleteWorkCategory | P4-write | |
| 90 | getOfficerManagementData | P3-shadow (admin) | |
| 91 | assignOfficer | P4-write | |
| 92 | resignOfficer | P4-write | |
| 93 | updateOfficerLinkage | P4-write | |
| 94 | updateOfficerRecord | P4-write | |
| 95 | getAdminBankAccount | P3-shadow (admin) | 口座情報＝機微。shadow 時も値非ログ規律を維持 |
| 96 | saveAdminBankAccount | P4-write | |
| 97 | deleteAdminBankAccount | P4-write | |
| 98 | getPaymentHistory | P3-shadow (admin) | |
| 99 | savePayment | P4-write | |
| 100 | deletePayment | P4-write | |
| 101 | getMyOfficerStatus | P3-shadow (member) | |
| 102 | saveMyBankAccount | P4-write | |
| 103 | getMyClaims | P3-shadow (member) | |
| 104 | submitClaim | P4-write | |
| 105 | deleteMyClaim | P4-write | |
| 106 | uploadClaimAttachment | GAS残留 | Drive 添付 |
| 107 | removeClaimAttachment | GAS残留 | Drive 添付 |
| 108 | getClaims | P3-shadow (admin) | |
| 109 | approveClaim | P4-write | |
| 110 | rejectClaim | P4-write | |
| 111 | adminDeleteClaim | P4-write | |
| 112 | getSharedMemo | P3-shadow (admin) | |
| 113 | saveSharedMemo | P4-write | 楽観ロック version 付き |
| 114 | getRosterFieldDictionary | P3-shadow (admin) | |
| 115 | getRosterDesignerData | P3-shadow (admin) | |
| 116 | loadRosterTemplatesV2 | P3-shadow (admin) | |
| 117 | saveRosterTemplateV2 | P4-write | |
| 118 | deleteRosterTemplateV2 | P4-write | |
| 119 | duplicateRosterTemplateV2 | P4-write | |
| 120 | listLinePostRequests | P3-shadow (admin) | |
| 121 | getLinePostRequest | P3-shadow (admin) | |
| 122 | saveLinePostRequest | P4-write | |
| 123 | uploadLinePostAttachment | GAS残留 | Drive 添付 |
| 124 | transitionLinePostRequest | P4-write | |
| 125 | deleteLinePostRequest | P4-write | |

集計: ✅済 0（interface 外の公開 2 action が済）／P3-shadow 41（member 4・admin 36・member/admin 1）／P4-write 66／GAS残留 15／廃止候補 1／transport内部 1／認証置換系 2（#20 #21 は P4-write・GAS残留に重複計上）。

**補遺: interface 外の公開ポータル action（`src/shared/api-base.ts` `callApi` 直呼び）**

| action | 分類 | 備考 |
|---|---|---|
| getPublicTrainings | **✅済（v376.58）** | portal-api allowlist・shadow 済 |
| getPublicPortalSettings | **✅済（v376.58）** | 同上 |
| verifyMemberIdentityForPublic | P4-write（公開） | 本人確認 token 発行。DoW ゲート §11-1 前提 |
| getPublicAvailableStaffSlots | P3-shadow (public) | token 必須 read |
| getPublicEnrolledStaffList | P3-shadow (public) | token 必須 read |
| submitPublicChangeRequest | P4-write（公開） | DoW ゲート前提 |
| applyTrainingExternal | P4-write（公開） | DoW ゲート前提 |
| cancelTrainingExternal | P4-write（公開） | DoW ゲート前提 |
| getFileThumbnail（公開経路） | GAS残留 | Drive proxy（#33 と同一実装） |

## 7. Security / Auth 方針

### GAS -> Cloud Run

- `ScriptApp.getIdentityToken()` を使う。
- `openid` scope を manifest に追加する。
- token 自体はログ出力しない。
- dryRun は JWT payload の `aud`, `iss`, `email` 有無だけを記録する。
- Cloud Run は `--no-allow-unauthenticated` を維持する。
- Cloud Run IAM は `roles/run.invoker` を最小化する。
- Cloud Run custom audiences は GAS OAuth client ID を追加する。

### Browser -> GCP API

方式は Phase 1 着手前に別途決定する。これは未決事項ではなく、GCP runtime の本番向け API 実装に進む前のブロッカーである。候補:
- Google Identity / OAuth
- Firebase Auth
- session cookie + server side verification

**設計原則（2026-07-08 operator 合意）**: admin 境界は **IAP / Cloud Run IAM 等の Google エッジ認証を第一候補**とする。無権限アクセスがコンテナ到達前に遮断され課金ゼロとなり、現行 GAS `access: DOMAIN` と同じコスト特性を維持できる（アプリ内 OAuth 実装だと全アクセスが課金対象になる）。member（ID/PW・不特定多数）は必然的にアプリ層認証＝全アクセス課金となるため、§11 Cost guard の公開前必須設計とセットで決める。
**付与単位の原則（同日追記）**: IAP / IAM の権限は**管理者グループ（Google Group）単位の最小付与**とし、**ドメイン（Workspace 組織）全体への付与は禁止**する。これにより Workspace 内の無権限アカウントも組織外と同様にエッジで遮断（課金ゼロ・アプリ未到達）となり、現行 GAS `DOMAIN`（組織内全員が doGet まで到達し whitelist 判定がスクリプト内で走る）より厳格になる。アプリ層 RBAC は二重防御として維持。拒否ログは Cloud Audit Logs で監査。

いずれも以下を満たすこと。

- admin / member / public 境界を混ぜない。
- server side authz を必須にする。
- frontend のメニュー非表示だけに依存しない。
- CORS は許可 origin を限定する。
- token / cookie はログに出さない。

### Password

- Argon2id は `m=19456, t=2, p=1` を初期値とする。
- 実サービスで 1 回あたりの hash / verify latency を測定する。
- rehash-on-login を使う。
- PBKDF2 path は全ユーザー移行確認まで残す。
- pepper は Secret Manager を正とし、Script Properties fallback は期限付きにする。

## 8. Observability

移行期は次を記録する。ただし PII / secret / token は記録しない。

- runtime: `gas` or `gcp`
- action
- success / error code
- latency bucket
- request ID
- auth principal type
- Cloud Run revision
- feature flag state

GCP 側は Cloud Run revision と traffic split を必ず release 記録に残す。

## 9. Rollback

| 障害 | 即時対応 |
|---|---|
| Cloud Run password-hash 障害 | `ARGON2_ENABLED=false` |
| Cloud Run new revision 障害 | previous revision へ 100% traffic rollback |
| GCP frontend 障害 | GAS frontend URL を案内継続。GCP frontend traffic を止める |
| GCP read API 差分 | GCP read を停止し、GAS 主系のみ継続 |
| GCP write API 障害 | write flag を off。compensation 手順を実行 |
| DB migration 差分 | 切替中止。Spreadsheet 主系を継続 |

本番利用者に影響が出る rollback は、原因調査より復旧を優先する。

## 10. 直近の実行順序

1. 本書を正本として合意する。
2. `HANDOVER.md` に「GCP 並走移行の正本は本書」と追記し、次担当者の入口を本書に切り替える。
3. `docs/240` に本書への参照と Secret 名不一致の注意を追記する。
4. GCP 作業場 README に「全体移行計画の正本は本書」と追記する。
5. Phase B 着手前設計を確定する。
   - `ALLOWED_INVOKERS` を維持するか、email claim 非依存へ変えるか
   - `userinfo.email` を 3 split に追加するか
   - Cloud Run IAM `roles/run.invoker` をどの principal に付与するか
   - `EXPECTED_AUDIENCE` の複数 audience 実装と拒否 test
6. Phase B dryRun を作る。
   - identity token payload 診断
   - Secret Manager name 診断
   - Cloud Run `/health` 診断
   - hash/verify 非破壊診断
7. Phase B 実装前に `npm run prerelease` が clean であることを確認する。
8. `openid` / `userinfo.email` scope 追加に伴う再同意影響を operator に説明し、承認後に 3 split release する。

## 11. 未決事項

> **2026-07-11 operator 決定**: DB / Browser auth / hosting を確定（下記 §12）。残る未決は Mail/Drive・DNS のみ。

| 項目 | 状態 / 決めること |
|---|---|
| **DB** | ✅ **確定＝Firestore**（2026-07-11・§12）。理由・コスト・キャッシュ/同時編集設計は §12 |
| **Browser auth** | ✅ **確定**（§12）: admin=IAP 直付け（Cloud Run）／member=Firebase Auth カスタムトークン（既存 Cloud Run Argon2 で検証）／public=匿名+App Check |
| **GCP frontend hosting** | ✅ **確定**（§12）: member/public=Firebase Hosting（クラシック）／admin=Cloud Run（SPA+API）に IAP 直付け |
| ログイン試行ロック仕様 | 現行「5 回連続失敗→無期限ロック（管理者解除）」を**限定承認（2026-07-08）**のまま。**GCP 本番オープン時（Phase 6 前）に再検討必須**: 閾値 3 回化・時限自動解除・正規会員締め出し DoS とのバランス |
| Mail / Drive | **未決**: GAS bridge を残すか GCP 置換か。移行期は GAS bridge 維持で、Phase 4 以降に判断 |
| DNS / public URL | ✅ **確定（2026-07-11 operator 決定）**: ①独自ドメインは **Google Workspace 登録済みドメインをサブドメインで利用**: public=`portal.<ドメイン>`／member=`member.<ドメイン>`（Firebase Hosting カスタムドメイン・無料）。apex は Workspace メール（MX）が乗るため触らない。②**admin は `*.run.app` のまま**（Cloud Run ドメインマッピングの制約回避・IAP 直付け LB 不要構成の維持・利用者は管理者数名のみ）。③**周知は旧 URL の JS 自動転送で代替**（Phase 6 最終＝現行 GAS 本番の撤去時に転送ページ化・詳細は §5 Phase 6。それまで旧 URL に手を入れない。一斉周知・印刷物差替えは必須でなくなる。ヘビーユーザーへのブックマーク更新案内は任意）。**前提確認（Phase 1 中に実施）**: ドメインの DNS 管理画面（レジストラ）にアクセスでき、TXT/A レコードを追加できること |
| Cost guard | **公開段階（Phase 1 以降）の追加設計必須（2026-07-08）**: 未認証リクエストも課金対象に到達する。max instances 上限・予算アラート強化・Cloud Armor（Standard）・reCAPTCHA/App Check・ログイン試行ロック再設計をセットで（§11-1） |

## 11-1. Denial of Wallet / EDoS 対策（公開段階の必須設計・2026-07-08 Web 一次情報調査）

> **【優先事項指定（2026-07-08 operator）】GCP 移行後に仕様書を見直し・再検討する際は、本節を最優先の検討項目とする。** Phase 1（公開 frontend/API 設計）の設計レビューは本節チェックリストの消化を開始条件とする。

GCP 完全移行で public/member を GCP 上に公開した後は、従量課金を標的とする攻撃が現実的脅威になる。§11 Cost guard を具体化した公開前チェックリストを本節に置く。

### 脅威の種類

- **Denial of Wallet (DoW)**: 可用性ではなく課金を標的化。オートスケール＋従量課金を悪用し、サービスは正常動作したまま請求額のみ膨張させる（1 req $0.0001 でも数百万 req で数分〜数千ドル）。
- **EDoS (Economic Denial of Sustainability)**: DoW の上位概念。DoS/DDoS を課金枯渇の形へ転じたもの。
- **主ベクトル**: ①リクエスト洪水（インスタンス数・実行時間課金の膨張）②データ egress 悪用（割高な下り通信費）③ストレージ操作課金（※GCS は未認証 403 が非課金で AWS S3 より有利）④**レート制限すり抜け型**（従来のリクエスト数閾値の下を低速・分散でかいくぐり、可用性アラートを鳴らさず静かに予算を食う）⑤AI/トークン枯渇型（将来 LLM 機能追加時）。

### 対策（多層・公開前チェックリスト）

- [ ] **予算アラート → 自動 billing 無効化 killswitch**: GCP 予算アラートは通知のみ・最大 1 日遅延で自動停止しない。Pub/Sub + Cloud Function で予算超過時に請求アカウントを自動切断する killswitch を構成（公式手順あり）。※本番サービス停止の副作用を許容できる境界にのみ適用。
- [ ] **クォータ上限**: リソース使用量に上限（通常使用の少し上・暴走時の天井）。予算アラートより即効性のある安全網。
- [ ] **Cloud Run max instances 上限**: 同時起動数を制限し課金天井を構造的に固定（現行 password-hash は max 3）。min instances 0 で待機課金ゼロを維持。**→ 新 API サービスは max-instances=1 で確定（2026-07-11・§12.4。キャッシュ一貫性と課金天井を同時に解決）**。
- ~~Cloud Armor（WAF + レート制限）~~ **不採用（2026-07-11 決定）**: Cloud Armor は外部 Application LB が必須で Cloud Run 直付け不可と検証で判明（月 $18〜25 の LB 費用がコスト目標と矛盾）。代替 = App Check + max-instances=1 + 予算 killswitch + アプリ内レート制限。Firebase Hosting 静的配信は Google エッジの DDoS 吸収で元々保護あり。
- [ ] **コスト意識型レート制限（アプリ内実装）**: リクエスト数だけでなくトークン/リソース消費量ベースで絞る（すり抜け型対策）。Cloud Armor 不採用のため public API 内のレート制限実装は必須。
- [ ] **認証をエッジへ寄せる**: IAM/IAP で弾けるものは弾く（未認証はコンテナ未到達＝課金外）。admin 境界は §7 の原則どおり IAP/IAM + グループ最小付与。
- [ ] **egress 抑制**: 静的コンテンツは CDN キャッシュ、大容量ダウンロードに上限・認証。
- [ ] **異常検知**: Cloud Audit Logs / 課金メトリクスの急変監視・アラート。

### 参考（一次情報 2026-07-08 確認）

- Denial of Wallet 概説: <https://devsecopsschool.com/blog/denial-of-wallet-attack-complete-guide/>
- GCS は未認証 403 非課金（AWS S3 との差）: <https://medium.com/google-cloud/billed-for-unauthorized-requests-google-cloud-storage-vs-aws-s3-8d4d6551fe72>
- serverless DoW 包括レビュー（arXiv 2508.19284）: <https://arxiv.org/html/2508.19284v1>
- GCP 予算超過時の自動 billing 無効化: <https://docs.cloud.google.com/billing/docs/how-to/disable-billing-with-notifications>
- 予算・アラート（ハード上限ではない旨）: <https://docs.cloud.google.com/billing/docs/how-to/budgets>
- Cloud Armor レート制限: <https://codelabs.developers.google.com/codelabs/cloud-armor-rate-limiting>
- killswitch 構成例: <https://medium.com/google-cloud/how-to-avoid-a-massive-cloud-bill-41a76251caba>

## 12. 確定ターゲット構成（2026-07-11 operator 決定・後任向けハンドオフ）

> 2026-07-08〜11 の設計協議で、DB・認証・hosting・キャッシュ/同時編集方針を確定した。本節が Phase 1 以降の実装の入口。動機は **アプリのロード時間短縮**（整合性強化は主目的ではない）。

### 12.1 目的（最重要・判断の軸）

- **本当の動機＝速度（ロード時間）**。GAS が遅い原因は2つに切り分け済み:
  - **A. 画面配信**: HtmlService が SPA を iframe 配信＋起動時に圧縮バンドルを解凍。→ **Firebase Hosting/CDN で解決（無料・体感の主改善）**。
  - **B. データ取得**: `getRowsAsObjectsFromSheet_`（`sheet.getDataRange().getValues()`）が**毎回シート全体をフルスキャン**（Code.full.gs:4241 で実コード確認済）。→ **実DB＋サーバー共有キャッシュで解決**。
- 整合性(FK)は主目的でない。**現行スプレッドシートも FK 無し**なので、Firestore（アプリ担保）は GAS と同等レベルで機能パリティを満たす。

### 12.2 確定アーキテクチャ

```
admin  → Cloud Run(SPA+API・IAP 直付け※LB不要・追加費用なし) → Firestore ＋ 継続RBAC(docs/246)
member → Firebase Hosting(SPA) → Cloud Run(member API) → Firestore
          └ ログイン: 既存 Cloud Run Argon2(/v1/verify) で検証 → Firebase Auth カスタムトークン発行
public → Firebase Hosting(SPA) → Cloud Run(public API・匿名+App Check。Cloud Armor は不採用=LB 必須と判明・2026-07-11) → Firestore
DB          : Firestore（Native mode）
Backup(DR)  : ~~Firestore ネイティブ（PITR 7日＋スケジュールバックアップ 最大14週）~~ → **operator 決定（2026-07-19）: Phase 4 入口からは一旦除外し、バックアップは別設計で検討する**（PITR/スケジュールバックアップは無料枠対象外＝課金必須機能のため採否含め別途判断。Phase 4 で write を GCP へ移す前に代替バックアップ設計を確定させること＝write 移行の前提条件として残す）
Analytics   : BigQuery（任意・extension で増分ミラー・ログ/帳票/監査分析。※アプリ稼働DBには使わない）
Operator可読: ~~Spreadsheet 定期エクスポート（任意）~~ → **operator 決定（2026-07-19）で必須へ昇格**: 書込カットオーバー後は **Firestore を正本**とし、**日次 Firestore→Spreadsheet エクスポート**を「バックアップ兼 operator 可読コピー」として運用（§12.2 Backup 別設計の実体）。加えて**管理画面に即時エクスポートボタン**（オンデマンド実行）を設ける。Sheet→Firestore 方向の Scheduler 自動同期は**不採用**（移行期の使い捨てになるため。カットオーバーまでは現行の手動同期ツールを継続）
Secret      : Secret Manager（pepper 既存）
Mail/Drive  : 移行期は GAS bridge 維持（Phase 4 以降で置換判断）
```

### 12.3 認証（境界ごとに分離・混在禁止＝docs/109/111 準拠）

- **admin**: **IAP を Cloud Run に直接有効化**（2026 はワンクリック・LB不要・追加費用なし）。※IAP は Firebase Hosting 静的配信は保護できないため admin は Cloud Run 配信にする。IAP は「admin グループの一員か」の粗いゲートのみで、**メニュー単位 RBAC（docs/246）はサーバー側で継続強制**（ロール表を Firestore に保持）。付与は **Google グループ単位の最小付与・ドメイン全体付与禁止**（§7）。
- **member**: **Firebase Auth カスタムトークン**。loginID+パスワードを我々のデータ＋**既存 Cloud Run Argon2 サービス**で検証し、成功時にカスタムトークン発行（uid=会員ID）。クラシック Firebase Auth は無料。※新 member API の SA を hash サービスの `ALLOWED_INVOKERS`＋custom audiences に追加（追加のみ）。PBKDF2 は Node ローカル・argon2 は hash サービス委譲で現 `verifyPassword_` と等価に。
- **public**: 匿名＋App Check/reCAPTCHA＋max-instances=1 の課金天井＋予算 killswitch＋アプリ内レート制限（DoW 対策・§11-1）。**Cloud Armor は不採用**（2026-07-11 検証: Cloud Armor は外部 Application LB にしか付けられず Cloud Run 直付け不可。LB は月 $18〜25 でコスト目標と矛盾。Firebase Hosting の静的配信は Google エッジで DDoS 吸収されるため元々保護あり）。

### 12.4 DB＝Firestore：コスト・キャッシュ・同時編集の確定方針

- **コスト**: Firestore はドキュメント単位課金（フィールド数無関係）。無料枠 1日 読取5万/書込2万/削除2万・保存1GB。**本規模＋サーバー共有キャッシュなら実質 ¥0〜数百/月**。固定の月額下限が無いのが Cloud SQL との差。**有料強化（Redis・min-instances・外部検索・Cloud SQL）は"必須ではなく後付けオプション"**。
- **検索**: 現行かな検索（`src/utils/search.ts` `matchesSearchQuery`）は**純 JS・クライアント側フィルタ**（実コード確認済）で、DB 側検索を使っていない。**Firestore でも同方式がそのまま動く＝外部検索サービス不要**（この規模）。※以前「Algolia 等が必須級」と評価したが**実コード確認で過大と判明・訂正済**。
- **キャッシュ（必須）**: **クライアント側（PCごと）でなくサーバー側共有キャッシュ**（Cloud Run メモリ／必要なら Redis）を採用。閲覧の読取を実質0にする。300〜数千件はメモリに載る。
- **同時編集（operator 要件）**: 「DB ロック不可→後勝ち」は**誤解で、Firestore は楽観的トランザクション＋自動リトライを持つ**（現行 GAS も LockService で直列化済）。採用方針は:
  1. **フィールド単位の部分更新**（変更フィールドだけ書く）→ 別フィールドの同時編集は**両方生存・lost update なし・ロック不要**。「レコード丸ごと後勝ち」は採らない。
  2. 直列化は**レコード単位トランザクション**で（グローバル直列は不要）。
  3. 任意で**楽観的バージョンチェック**（`updated_at`/`version`）→ 同一フィールド衝突を"警告"（黙って上書きしない）。
- **インスタンス数（2026-07-11 operator 決定・セカンドオピニオン反映）**: API サービスは **max-instances=1 を採用**。理由: ①当初案の「Pub/Sub で他インスタンスへ更新通知」は **Pub/Sub push が1メッセージを1インスタンスにしか配送しないため全インスタンスへのブロードキャストにならず成立しない**（設計欠陥として検証で判明）。②1台固定ならメモリキャッシュが単一になり一貫性問題が構造的に消滅。③DoW の課金天井を兼ねる（§11-1）。④1インスタンスの同時実行数（既定80）で本規模（会員数百名）は十分。将来スケールが必要になった場合の選択肢は Firestore snapshot listener / 外部共有キャッシュ(Redis) / 短TTL+バージョン文書。
- **書込＋キャッシュの流れ**: ①DBに変更フィールドだけ書込（トランザクション）→ ②共有キャッシュ（単一インスタンス内メモリ）の該当レコード該当フィールドのみ差替え。max-instances=1 のためインスタンス間通知は不要。
- **コールドスタート時のウォームアップ（2026-07-22 operator 決定＝起動時一括ウォームアップ・実装済）**: scale-to-zero では起動毎に全件再読取（例 3,000 doc=3,000 読取。日数回なら無料枠内）が発生し初回リクエストが遅くなる。移行動機が速度のため **起動時一括ウォームアップを採用**（遅延ロード／min-instances=1 は不採用。前者は各画面初回が遅い・後者は待機課金が発生し「min=0 で待機課金ゼロ」方針と矛盾）。実装: `services/portal-api` の `index.js` が `listen` 前に `store.warmup(WARMUP_COLLECTIONS)` を実行（失敗時は getAll の遅延ロードにフォールバックし配信は継続）。実測（rev 00002・2026-07-22）: T_システム設定 110＋T_研修 5 を **848ms で一括プリフェッチ**、以後の read はキャッシュヒット。データ量が数百 doc のため無料枠内。体感問題が残る場合の後付けは min-instances=1（§12.9）。

### 12.5 移行順（リスク最小・パイロット先行）

1. **public/portal 先行**（完全匿名・read＋申込 write のみ・RBAC なし＝最小。read shadow で差分検証しやすい）
2. **member**（ID/PW 認証・書込あり）
3. **admin 最後**（メニュー RBAC・cascade 削除・帳票が最も複雑）

### 12.6 実測してから着手（✅ 実測完了 2026-07-11・v376.57 本番に対し Playwright 実測）

- 着手前に**現行の実データ量（各テーブル行数）と実ロード時間**を Playwright 等で計測し、①無料枠に収まるか ②遅さが A(画面配信)/B(データ取得) どちらか を数値確定する。A 支配なら Firebase Hosting 化だけで大半解決（低リスク・即効）。
- **実測結果（2026-07-11・計測スクリプト `.test-out/measure-perf-12-6.mjs`[gitignored]・件数/バイト/ms のみ記録・各2回実行）**:
  - **データ量**: 会員 **222**・事業所職員 **157**・研修 4（管理データ5）。bulk payload 最大は `fetchAllData` の **約 325KB**（`getAdminDashboardData` 115KB）。→ **①Firestore 無料枠（1日読取5万）に余裕で収まる**（全件でも数百 doc・サーバー共有キャッシュ併用なら実質ゼロ）。
  - **A（画面配信・boot）**: navigation→app 操作可能まで **public 約 3.0〜3.1s**／**admin 約 8.4〜11.6s**（2.4MB バンドルの解凍・マウント含む。splash 表示は public 3.0s / admin 4.1〜4.5s）。
  - **B（データ取得・`google.script.run` 1呼び出しの実測 RTT）**: **どんなに小さい payload でも 1 呼び出し 1.8〜5s**（`getPublicTrainings` 26 bytes で 1.8〜1.9s・`getSystemSettings` 10KB で 5.1s）。bulk は **`fetchAllData` 4.9s(ウォーム)〜11.1s(初回)**・`getAdminDashboardData` 5.1〜11.2s。
  - **②結論: A・B 両方が支配的**。B は「データ量」ではなく **GAS 呼び出しの固定オーバーヘッド＋シート全件スキャン**が原因（26 bytes でも ~2s）。→ Firebase Hosting/CDN で A を、Cloud Run(API)+Firestore+サーバー共有キャッシュで B を解消する確定構成（§12.2）の妥当性を数値で裏付け。Hosting 化「だけ」では admin の体感（B が 1 画面あたり数呼び出し×5s）は解決しない。

### 12.7 後任への実装ステップ（Phase 1 入口）

1. **Phase 1（非破壊・本リポジトリ）**: `src/services/api.ts` は既に `ApiClient` interface＋`GasApiClient`＋単一 `api` エクスポートで、component は `google.script.run` を直接呼ばない（確認済）。残りは `createApiClient(config)` factory と `GcpApiClient` の器、`window.__APP_CONFIG__.apiRuntime` 注入。**GasApiClient を既定に温存**し GAS E2E が通ることを完了ゲートに。
2. **Phase 2（GCP 作業場）**: Firestore データモデル設計（コレクション/文書・非正規化・cascade/soft-delete/archive[docs/249] 再実装）＋ read-only 互換 API。~~移行期に「スプレッドシートを読み続ける互換層」か「早期に Firestore を立てて同期」かは Phase 2 着手時に決める~~ → **operator 決定（2026-07-11）: 早期 Firestore＋一方向同期を採用**（スプレッドシート→Firestore のバッチ/手動同期で投入し read-only API は Firestore を読む。単一情報源は引き続きスプレッドシート＝write 正本、ドリフトは Phase 3 read shadow で検証。Sheets API 互換層は速度改善が限定的なため不採用）。**member/public の SPA→API は Firebase Hosting の rewrites で `/api/**` を Cloud Run へプロキシする方式を推奨**（同一オリジン化で CORS 不要・run.app URL の隠蔽・2026-07-11 セカンドオピニオン）。
3. **Phase 3〜5**: read shadow → 限定書込 → DB 移行（行数/チェックサム/参照整合レポート・dual-write・write-freeze・rollback）。スプレッドシートは整合証明まで write 正本。**operator 決定（2026-07-19・Phase 4 入口）: カットオーバー後の最終形は「Firestore=正本／Spreadsheet=日次エクスポート BK＋即時エクスポートボタン」**（§12.2 Operator可読 参照）。書込移行の詳細設計は GCP 作業場 `docs/PHASE4_DESIGN.md` を正本とする。
4. **公開前ゲート**: §11-1 DoW/EDoS 対策（Cloud Armor Standard・App Check・予算 killswitch・max instances）を必ず消化。

### 12.8 検証済みの事実（実コード確認・2026-07-11）

- 検索は純 JS・クライアント側フィルタ（`src/utils/search.ts`）。
- データ取得はシート全件フルスキャン（`getRowsAsObjectsFromSheet_`・Code.full.gs:4241）＝遅さの主因B。
- transport は `google.script.run` が api 層のみ（component 直呼びなし）。
- 現行は FK/整合性なし（スプレッドシート）＝Firestore と同レベル。
- 現行 GAS は LockService で書込直列化済（＝「DB ロック不可」は誤り）。

### 12.9 コスト早見（本規模・1$≈¥150 概算）

| 構成 | 月額 | 備考 |
|---|---|---|
| 最小（Firebase Hosting＋Cloud Run scale-to-zero＋Firestore 無料枠＋Firebase Auth＋自前JS検索） | **¥0〜数百** | GAS 相当＋速度改善を実質無料で。宿題=アイドル初回コールドスタート数秒 |
| ＋min-instances=1（コールドスタート除去） | ＋数千/月（要確認） | 体感問題が出たら後付け |
| ＋Memorystore Redis（厳密な多インスタンス一貫性） | ＋約¥5,300/月〜 | max-instances=1 採用（§12.4）につき不要。複数台化する時のみ検討 |
| ＋外部検索（Algolia/Typesense） | 本規模は**不要**（自前JS検索で足りる） | 数万件級になったら検討 |

## 13. 関連資料

- `HANDOVER.md`
- `docs/09_DEPLOYMENT_POLICY.md`
- `docs/172_DEFERRED_SECURITY_BACKLOG_SECRET_MANAGER_KDF_2026-05-01.md`
- `docs/240_DESIGN_CLOUD_RUN_ARGON2ID_2026-05-20.md`
- `docs/248_THIRD_PARTY_EVALUATION_2026-07-01.md`
- `docs/archive/historical/33_GCP_MIGRATION_SPEC.md`（historical。現正本ではない）
- `C:\VSCode\CloudePL\hirakatacitykyougikaiGCP\README.md`
