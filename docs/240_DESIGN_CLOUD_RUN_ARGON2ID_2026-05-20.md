# 240. Cloud Run Argon2id 外部 KDF 設計書 + 実装雛形

更新日: 2026-05-20
状態: **設計 + 雛形のみ・本番未反映**
契機: docs/172（必須・破棄禁止 backlog）+ docs/109 §5.3 (パスワード保護不足の高リスク指摘)
本番反映予定: **次セッション以降・operator 監視下で段階的に実施**

## 0. 設計判断サマリ

| 判断点 | 採用 | 不採用 | 理由 |
|---|---|---|---|
| 外部 KDF サービス | **Cloud Run + argon2 (Node.js)** | Cloud Functions / Cloud Build only | コールドスタート 1-2s 許容、Express で path routing 容易、`argon2` npm は libsodium バック実績豊富 |
| アルゴリズム | **Argon2id** (m=19 MiB, t=2, p=1) | bcrypt / scrypt / PBKDF2 拡張 | OWASP 2025 推奨第一位、memory-hard + GPU 耐性 + side-channel 耐性 |
| 認証 | **OIDC ID Token** (`ScriptApp.getIdentityToken()`) | Service Account Key / API Key | service account key は 2026 best practice で deprecated。OIDC は audience 検証で nonce 不要・key rotation 不要 |
| caller allowlist | `EXPECTED_AUDIENCE` + `ALLOWED_INVOKERS` env vars | IAM のみ | 多層防御。Cloud Run の `--no-allow-unauthenticated` + IAM `roles/run.invoker` + アプリ層 email allowlist |
| pepper の渡し方 | **request body 平文**（HTTPS within GCP private network） | 別 header / Secret Manager から service が直接読む | service は stateless 化、pepper rotation を Apps Script 側だけで完結可能。pepper は 1 request の lifetime のみメモリ滞在 |
| pepper 適用方法 | **HMAC-SHA256(password, pepper) → argon2id wrap** | argon2 の追加 input (additional data) | OWASP「peppered hashing」標準パターン。Argon2 の AD は実装間互換性に課題 |
| 移行戦略 | **rehash-on-login** (旧 PBKDF2 → 新 Argon2id) | 一括 migration | パスワード平文を保存していないため一括変換不可。既存方式の `needsRehash` 機構をそのまま利用 |
| ハッシュ形式 | **PHC string** (`$argon2id$v=19$m=19456,t=2,p=1$<salt>$<hash>`) | 自前 prefix 形式 | argon2 npm の標準形式。`argon2.verify()` がパラメータ自動抽出、`argon2.needsRehash()` でパラメータ更新検知が動作 |

## 1. アーキテクチャ概観

```
┌─────────────────────────────────────────────────────────────────┐
│ Google Apps Script (admin/member/public 3 split)                  │
│                                                                   │
│  hashPasswordPbkdf2_(password, salt)  ──┐ ←─ legacy (PBKDF2)      │
│  verifyPassword_(password, salt, h)   ──┤                         │
│                                          ↓                         │
│  hashPasswordArgon2_(password, salt)  ──┐ ←─ v373.6+ (新規予定)   │
│  verifyPasswordArgon2_(password, h)   ──┤                         │
│                                          ↓                         │
│         ScriptApp.getIdentityToken()                              │
│         + UrlFetchApp POST                                        │
│         + getPasswordPepper_() (Secret Manager)                   │
└──────────────────────┬────────────────────────────────────────────┘
                       │ HTTPS + Bearer OIDC ID Token
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│ Cloud Run: hcmn-password-hash (asia-northeast1)                   │
│                                                                   │
│  - audience verification (`verifyIdToken`)                        │
│  - email allowlist (k.noguchi@hcm-n.org)                          │
│  - HMAC(password, pepper) → argon2id                              │
│  - PHC string return                                              │
│                                                                   │
│  GET  /healthz                                                    │
│  POST /v1/hash      { password, pepper? } → { phc }               │
│  POST /v1/verify    { password, phc, pepper? } → { match, ... }   │
└─────────────────────────────────────────────────────────────────┘
```

## 2. ファイル構成（既存）

```
cloud-run/password-hash-service/
├─ package.json          # argon2 + express + google-auth-library
├─ Dockerfile            # node:22-bookworm-slim multi-stage
├─ .gcloudignore         # node_modules / .env を除外
├─ README.md             # ローカル起動 + deploy コマンド
└─ src/
   └─ index.js           # Express app（hash / verify / healthz）
```

## 3. 認証フロー

```
1. Apps Script:
   var idToken = ScriptApp.getIdentityToken();
   // 注: openid scope が appsscript.json に必要（OIDC 発行用）

2. Apps Script → Cloud Run:
   UrlFetchApp.fetch('https://hcmn-password-hash-xxx.run.app/v1/hash', {
     method: 'post',
     headers: { 'Authorization': 'Bearer ' + idToken, 'Content-Type': 'application/json' },
     payload: JSON.stringify({ password, pepper }),
     muteHttpExceptions: true,
   });

3. Cloud Run service:
   - google-auth-library で ID token を verify
   - audience が service の URL であること
   - iss が https://accounts.google.com であること
   - email が ALLOWED_INVOKERS に含まれること
   → 通過したら argon2id 実行
```

## 4. Apps Script 統合（次セッションで実装）

`gas-src/Code.full.gs` に追加する関数（**現時点では未追加・本セッションでは雛形のみ**）:

```javascript
var CLOUD_RUN_HASH_SERVICE_URL_PROPERTY = 'CLOUD_RUN_HASH_SERVICE_URL';
var ARGON2_ENABLED_PROPERTY = 'ARGON2_ENABLED'; // 'true' で有効化（feature flag）

function isArgon2Enabled_() {
  return String(PropertiesService.getScriptProperties().getProperty(ARGON2_ENABLED_PROPERTY) || '').toLowerCase() === 'true';
}

function getCloudRunHashServiceUrl_() {
  return String(PropertiesService.getScriptProperties().getProperty(CLOUD_RUN_HASH_SERVICE_URL_PROPERTY) || '').trim();
}

function hashPasswordArgon2_(password, salt) {
  var url = getCloudRunHashServiceUrl_();
  if (!url) throw new Error('Cloud Run hash service URL not configured');
  var pepper = getPasswordPepper_();
  var response = UrlFetchApp.fetch(url + '/v1/hash', {
    method: 'post',
    contentType: 'application/json',
    headers: { 'Authorization': 'Bearer ' + ScriptApp.getIdentityToken() },
    payload: JSON.stringify({ password: password, pepper: pepper }),
    muteHttpExceptions: true,
  });
  if (response.getResponseCode() !== 200) {
    throw new Error('Argon2 hash service HTTP ' + response.getResponseCode());
  }
  var body = JSON.parse(response.getContentText());
  // salt は PHC 内に含まれるため使わない。形式互換のため prefix を付ける:
  return 'argon2id:v1:' + body.phc;
}

function verifyPasswordArgon2_(password, storedHash) {
  if (storedHash.indexOf('argon2id:v1:') !== 0) {
    throw new Error('not an argon2id hash');
  }
  var phc = storedHash.substring('argon2id:v1:'.length);
  var url = getCloudRunHashServiceUrl_();
  var pepper = getPasswordPepper_();
  var response = UrlFetchApp.fetch(url + '/v1/verify', {
    method: 'post',
    contentType: 'application/json',
    headers: { 'Authorization': 'Bearer ' + ScriptApp.getIdentityToken() },
    payload: JSON.stringify({ password: password, phc: phc, pepper: pepper }),
    muteHttpExceptions: true,
  });
  if (response.getResponseCode() !== 200) {
    throw new Error('Argon2 verify service HTTP ' + response.getResponseCode());
  }
  return JSON.parse(response.getContentText());
}

// 既存 verifyPassword_() を拡張:
//   - storedHash が 'argon2id:v1:' で始まれば verifyPasswordArgon2_ を呼ぶ
//   - そうでなければ既存 PBKDF2 path
//   - 旧形式でログイン成功 + isArgon2Enabled_() なら needsRehash=true を返し、login 側で hashPasswordArgon2_ で再ハッシュ
```

`appsscript.json` に `openid` スコープ追加が必要:

```json
"oauthScopes": [
  ...
  "openid"  // ScriptApp.getIdentityToken() に必須
]
```

## 5. デプロイ手順（次セッション・operator）

### Step 1: Cloud Build / Cloud Run API 有効化

```bash
gcloud services enable run.googleapis.com cloudbuild.googleapis.com
```

### Step 2: Service Account 作成（caller の email としても利用）

```bash
gcloud iam service-accounts create hcmn-password-hash-sa \
  --display-name "HCMN password hash service runtime"
```

### Step 3: Cloud Run service deploy

```bash
cd cloud-run/password-hash-service

gcloud run deploy hcmn-password-hash \
  --source . \
  --region asia-northeast1 \
  --no-allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 3 \
  --service-account hcmn-password-hash-sa@hcmn-member-system-prod.iam.gserviceaccount.com \
  --set-env-vars "ALLOWED_INVOKERS=k.noguchi@hcm-n.org"
# deploy 後に出力される service URL を控える
```

### Step 4: EXPECTED_AUDIENCE 環境変数を設定

deploy 後に出力される URL を audience として再 deploy:

```bash
SERVICE_URL="https://hcmn-password-hash-XXXXXXXX-an.a.run.app"
gcloud run services update hcmn-password-hash \
  --region asia-northeast1 \
  --update-env-vars "EXPECTED_AUDIENCE=${SERVICE_URL}"
```

### Step 5: IAM `roles/run.invoker` を deploying user に付与

```bash
gcloud run services add-iam-policy-binding hcmn-password-hash \
  --region asia-northeast1 \
  --member "user:k.noguchi@hcm-n.org" \
  --role "roles/run.invoker"
```

### Step 6: Apps Script 側 Script Properties

3 split それぞれの editor で:
- `CLOUD_RUN_HASH_SERVICE_URL` = `https://hcmn-password-hash-XXXXXXXX-an.a.run.app`
- `ARGON2_ENABLED` = `false`（初期値・段階移行用 feature flag）

### Step 7: appsscript.json に `openid` scope 追加 + 3 split push/redeploy

### Step 8: 段階移行

1. `ARGON2_ENABLED=false` のまま、新規登録ユーザーから Argon2id ハッシュ作成のテスト（既存ユーザーは引き続き PBKDF2）
2. dryRun 関数で argon2 hash → verify の往復が成功することを確認
3. `ARGON2_ENABLED=true` に切り替え → 既存ユーザーが次ログイン時に PBKDF2 → Argon2id rehash
4. 90 日後に「全ユーザー Argon2id 化済み」を確認し、PBKDF2 path を削除（v374 系）

## 6. fail-closed / rollback 方針

### fail-closed

- Cloud Run service 障害時、`hashPasswordArgon2_` / `verifyPasswordArgon2_` は throw する
- ログイン path で例外発生 → ログイン拒否 + ユーザーに「一時的な障害」エラー
- credential 発行 path で例外発生 → アカウント作成失敗（巻き戻し or ステータス FAILED）

### rollback

- `ARGON2_ENABLED=false` に戻すだけで新規 hash は PBKDF2 に倒れる
- 既に Argon2id 化された hash は `verifyPasswordArgon2_` で検証されるが、`ARGON2_ENABLED=false` 中でも verify path は alg 自動判別なので問題なし
- Cloud Run service 自体を削除する場合は、事前に全 Argon2id hash を PBKDF2 に戻す必要がある（実質的に不可能 = 一方通行）

## 7. セキュリティ評価

| 観点 | 評価 |
|---|---|
| OWASP Password Storage Cheat Sheet 2025 準拠 | ✅ Argon2id (m=19 MiB, t=2, p=1) は推奨値 |
| pepper 漏洩耐性 | ✅ peppered hashing (HMAC wrap → argon2) で DB 単独漏洩では復元不能 |
| service account key 不使用 | ✅ OIDC ID Token のみ |
| caller allowlist 多層防御 | ✅ Cloud Run `--no-allow-unauthenticated` + IAM `roles/run.invoker` + アプリ層 email allowlist |
| pepper の lifetime | ✅ 1 request 内のメモリのみ。Cloud Run service は stateless |
| log への漏洩 | ✅ index.js は password/pepper をログに出さない |
| OWASP ASVS 5.0.0 password storage | ✅ Level 2 達成見込み |
| NIST SP 800-63B | ✅ memorized secret + memory-hard KDF |

## 8. 残作業（次セッション以降）

| # | 内容 | 担当 |
|---|---|---|
| 1 | `cloud-run/password-hash-service/` のコードレビュー | reviewer |
| 2 | Cloud Run API / Cloud Build API 有効化 | operator |
| 3 | Service Account 作成 + IAM 設定 | operator |
| 4 | Cloud Run deploy | operator |
| 5 | Apps Script に `hashPasswordArgon2_` / `verifyPasswordArgon2_` を追加 + `verifyPassword_` の alg 自動判別を拡張 | developer |
| 6 | appsscript.json に `openid` scope 追加 + 3 split push/redeploy | developer |
| 7 | Script Properties 設定（URL + ARGON2_ENABLED=false） | operator |
| 8 | dryRun で hash/verify 往復確認 | operator + developer |
| 9 | ARGON2_ENABLED=true 切替（rehash-on-login 開始） | operator |
| 10 | 90 日後の monitoring と PBKDF2 path 削除（v374 系） | developer + operator |

## 9. リスク評価

| リスク | 影響 | 軽減 |
|---|---|---|
| Cloud Run cold start で login 遅延 | 中（1-2s 追加） | `--min-instances 1` 設定（コスト増だが allow） |
| Cloud Run 障害で全 login 不能 | 高 | feature flag `ARGON2_ENABLED=false` で即時切り戻し可能 |
| OIDC token 検証失敗で login 不能 | 中 | EXPECTED_AUDIENCE 設定ミスが最大要因。deploy 直後の dryRun でカバー |
| pepper の network 送信 | 低 | GCP 内 HTTPS、Cloud Run 側は ALLOWED_INVOKERS で email 制限 + audience 検証 |
| argon2 native module の Cloud Run でのビルド失敗 | 中 | Dockerfile multi-stage で `npm ci` を builder stage で実施、runtime に node_modules をコピー |
| 既存 PBKDF2 hash の段階移行中の混在状態 | 低 | `verifyPassword_()` で alg 自動判別、両方サポート |

## 10. 関連ドキュメント

- `docs/109_THIRD_PARTY_ASSESSMENT_2026-04-20.md` §5.3
- `docs/171_PASSWORD_HASH_STANDARD_ALIGNMENT_2026-04-30.md` (v262 PBKDF2 移行)
- `docs/172_DEFERRED_SECURITY_BACKLOG_SECRET_MANAGER_KDF_2026-05-01.md`
- `docs/239_OPERATOR_GCP_SECRET_MANAGER_SETUP_2026-05-20.md` (v373.5 前段)
- OWASP Password Storage Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
- Cloud Run service-to-service auth: https://docs.cloud.google.com/run/docs/authenticating/service-to-service
- Apps Script identity tokens: https://developers.google.com/apps-script/guides/services/cloud-run

## 11. 【追記 2026-07-06】Phase 0（GCP 側）完了記録と Phase B 引継ぎ

> 実施場所は GCP 作業場 `C:\VSCode\CloudePL\hirakatacitykyougikaiGCP`（独立 Git・状態の正本は同作業場 README）。
> 本節は「本設計書 §4-5 を Phase B で実装する開発者」向けの差分情報のみ記す。
> 2026-07-07 以降の **GAS 本番を維持した並走移行全体計画** は `docs/250_GCP_MIGRATION_PARALLEL_RUN_PLAN_2026-07-07.md` を正本とする。本書は password-hash service / Phase B の詳細設計であり、全体移行計画そのものではない。

### 完了状態（§8 残作業の #1-4・#7 前半に相当）

- サービス実装はレビュー是正済＋unit 5/5 PASS（`services/password-hash`・GCP 作業場）
- Cloud Run `hcmn-password-hash` デプロイ済・稼働中: **`https://hcmn-password-hash-axku24p5ja-an.a.run.app`**（asia-northeast1・`--no-allow-unauthenticated`・min 0/max 3・SA `hcmn-password-hash-sa`・invoker=`k.noguchi@hcm-n.org`・`EXPECTED_AUDIENCE`=上記 URL）
- Secret Manager `PASSWORD_HASH_PEPPER_V1` **登録完了（version 1 enabled・値は operator 投入・Script Properties と同一値）**
- 課金: 課金アカウントリンク済・予算アラート月 500 円（50/90/100% 通知）。ゼロスケール構成で恒常無料枠内見込み
- 検証済: 認証付き `GET /health` → 200、未認証 → 403（fail-closed）

### 実装差分（本文 §1-5 からの変更点・Phase B 実装時に注意）

1. **health エンドポイントは `/health`**（本文の `/healthz` から変更）。`/healthz` は run.app の Google Frontend 予約パスで、Cloud Run に届く前にエッジが 404 を返すことを実測確認（2026-07-06）。ヘルスチェック・監視 URL には `/health` を使うこと。
2. **【Phase B 着手前に要設計確定】identity token の audience 整合**: `ScriptApp.getIdentityToken()` が返すトークンの `aud` は **GAS プロジェクトに紐づく OAuth クライアント ID** であり、service URL ではない。一方 Cloud Run の IAM 層はデフォルトで `aud`=service URL を要求するため、**このままでは GAS からの呼び出しが IAM 層で 401 になる可能性が高い**。対応candidates:
   - Cloud Run の **custom audiences**（`gcloud run services update hcmn-password-hash --add-custom-audiences=<GAS OAuth クライアント ID>`）を設定し、アプリ側 `EXPECTED_AUDIENCE` も同値に更新する（推奨・追加のみで可逆）
   - GAS の OAuth クライアント ID は Apps Script プロジェクトの GCP 紐づけ（`hcmn-member-system-prod`）配下。3 split で ID が異なる場合は custom audiences に複数登録（カンマ区切り・最大 32）
   - 実トークンの `aud` 値は Phase B の dryRun 関数内で `getIdentityToken()` を decode（JWT payload の base64）して確認するのが確実（トークン自体はログ出力しない）
3. **【Phase B 着手前に要是正】Secret Manager secret 名の不一致**: 2026-07-07 実体確認では GCP に存在する secret は `PASSWORD_HASH_PEPPER_V1` のみ。一方、現行 `gas-src/Code.full.gs` は `PASSWORD_HASH_PEPPER_SECRET_NAME = 'password-hash-pepper-v1'` を参照している。このままでは Secret Manager 経路は 404 になり Script Properties fallback に倒れる。Phase B では secret 名を一致させる、または Script Property で secret 名を明示設定できるようにする。
4. **【Phase B 着手前に要設計確定】email claim と invoker の整合**: 本書の Cloud Run app は `ALLOWED_INVOKERS` による email allowlist を前提にしている。Apps Script identity token に email claim を含めるには `userinfo.email` scope が必要なため、現行 allowlist を維持するなら 3 split manifest に `openid` だけでなく `userinfo.email` も追加する。email claim に依存しない設計へ変える場合は、Cloud Run app 側の allowlist 仕様と unit test を先に更新する。Cloud Run IAM `roles/run.invoker` は dryRun で確認した caller principal に最小権限で付与し、`allUsers` / `allAuthenticatedUsers` は使わない。
5. §8 の残作業 #5-6・#7 後半（Script Properties）・#8-10 が Phase B スコープ（本番リポジトリの通常リリースフロー）。
