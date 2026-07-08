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

| 項目 | 決めること |
|---|---|
| ログイン試行ロック仕様 | 現行「5 回連続失敗→無期限ロック（管理者解除）」を**限定承認（2026-07-08・operator 決定）**のまま Phase B を進める。ロック判定はパスワード検証前のため Argon2 有効化後も Cloud Run 呼び出しは 1 アカウント最大 5 回で頭打ち。**GCP 本番環境オープン時（Phase 6 切替前）に再検討必須**: 閾値 3 回化・時限自動解除（15 分等）・正規会員締め出し DoS とのバランス |
| GCP frontend hosting | Firebase Hosting / Cloud Run static / Cloud Storage + CDN のどれを使うか |
| Browser auth | Firebase Auth / Google OAuth / custom session のどれを使うか |
| DB | Firestore / Cloud SQL / hybrid のどれを使うか |
| Mail / Drive | GAS bridge を残すか、GCP 側へ置換するか |
| DNS / public URL | 既存 GAS URL 併用期間と GCP URL の公開方法 |
| Cost guard | 500 円 budget alert の継続、min instances 設定可否。**公開段階（Phase 1 以降）の追加設計必須（2026-07-08 operator 指摘）**: IAM で閉じた現行 Cloud Run と異なり、公開 frontend / API は未認証リクエストも全て課金対象に到達する。max instances 上限・予算アラート強化・Cloud Armor 等のレート制限/WAF・reCAPTCHA/App Check・ログイン試行ロック再設計（上記行）をセットで決めてから公開する |

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
- [ ] **Cloud Run max instances 上限**: 同時起動数を制限し課金天井を構造的に固定（現行 password-hash は max 3）。min instances 0 で待機課金ゼロを維持。
- [ ] **Cloud Armor（WAF + レート制限）**: エッジで閾値ベース遮断。Managed Protection Plus 契約時は "Bill Protection"（DDoS 起因課金の保護）付き。
- [ ] **コスト意識型レート制限**: リクエスト数だけでなくトークン/リソース消費量ベースで絞る（すり抜け型対策）。
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

## 12. 関連資料

- `HANDOVER.md`
- `docs/09_DEPLOYMENT_POLICY.md`
- `docs/172_DEFERRED_SECURITY_BACKLOG_SECRET_MANAGER_KDF_2026-05-01.md`
- `docs/240_DESIGN_CLOUD_RUN_ARGON2ID_2026-05-20.md`
- `docs/248_THIRD_PARTY_EVALUATION_2026-07-01.md`
- `docs/archive/historical/33_GCP_MIGRATION_SPEC.md`（historical。現正本ではない）
- `C:\VSCode\CloudePL\hirakatacitykyougikaiGCP\README.md`
