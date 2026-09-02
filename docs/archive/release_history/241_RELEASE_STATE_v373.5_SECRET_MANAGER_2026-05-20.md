# 241. v373.5 release state — パスワード pepper を Secret Manager 連携化

更新日: 2026-05-20
リリース: **v373.5**
反映対象: **3 split 全て**（integrated/public・member split・admin split）
契機: 第三者評価 docs/172（必須・破棄禁止 backlog）の第 1 弾完了

## 1. デプロイ結果

| 配信 | Deployment ID | Version | 状態 |
|---|---|---|---|
| **統合 public legacy** | `AKfycbywpWoYxij6A-ZunIeBjG1Q8qX78PMMTsT3frx1cM5PJ2nAuZpz81KruXb5LIvWgbQx` | **@342** | ✅ redeployed |
| **統合 public 正式** | `AKfycbxyuUXgK1oHUDMahQjluiL-gcrMK0qV0FWLFYaYBqGxlRSg9NhvmbyQRyf0dvaqg7Zp` | **@342** | ✅ redeployed |
| **member split** | `AKfycbxd_6HlH5aWLhxYOtLUHehI3ODiHg4fpc5SCzNdEBIDbDpaBuU3KTuqDRbeBmhWZxSQ_g` | **@100** | ✅ redeployed |
| **admin split** | `AKfycbwSCTTyvWY_cFG764XawdbqA8r0qxYbav4aDZ-BK9rRmvXHoUXrKQnQ9egRGqWcx4Os` | **@151** | ✅ redeployed |

## 2. 変更概要

第三者評価 `docs/109` §5.3（パスワード保護不足）の根本対応の第 1 段階として、**pepper の保管場所を Script Properties から Google Cloud Secret Manager に移行**する仕組みを実装。

### 2-1. `getPasswordPepper_()` 改修

3 階層の解決順:

1. **CacheService**（5 分以内なら即返却・API 呼び出し最小化）
2. **Secret Manager**（v373.5 新規）— `secretmanager.googleapis.com/v1` を OAuth token + UrlFetchApp で呼ぶ
3. **Script Properties** `PASSWORD_HASH_PEPPER_V1`（既存・**fail-soft フォールバック**）

Secret Manager 取得失敗時は Logger に警告（値は出さない）してから Properties に倒れるため、**GCP 障害でログイン全停止することはない**。

### 2-2. `fetchPepperFromSecretManager_()` 新規

- GCP Secret Manager v1 API `projects/<project>/secrets/password-hash-pepper-v1/versions/latest:access` を呼ぶ
- `Authorization: Bearer <ScriptApp.getOAuthToken()>`
- レスポンスの `payload.data` (base64) を decode して trim
- HTTP non-200 / JSON parse 失敗 / payload 欠落は全て throw（呼び出し側で fail-soft 判定）
- プロジェクト ID は Script Properties `PASSWORD_HASH_PEPPER_GCP_PROJECT` から取得（未設定なら `hcmn-member-system-prod` をデフォルト）

### 2-3. `healthCheckPasswordPepper()` 新規（admin split のみ top-level）

operator が Apps Script editor から手動実行する診断関数:

- Script Properties / Secret Manager 両方から取得
- 値そのものは出力せず、**SHA-256 fingerprint の先頭 16 hex chars** だけ Logger に出力
- `fingerprint_match: true/false` で両者一致性を検証
- `resolved_via: SecretManager/ScriptProperties` で実際の解決経路を表示

build pruning により member/public split からは除外される。

### 2-4. OAuth Scope 追加

3 project の `appsscript.json` に `https://www.googleapis.com/auth/cloud-platform` を追加（Secret Manager API 呼び出しに必須）。

**注意**: 初回起動時に各 Apps Script editor で OAuth 再承認画面が表示される可能性あり。

## 3. Web 検索（2026-05-20）に基づく根拠

| 観点 | 採用 | 根拠 |
|---|---|---|
| Secret Manager API 呼び出し方法 | OAuth token + UrlFetchApp | Google 公式 / labnol / dev.to で確立した標準パターン |
| OAuth scope | `cloud-platform` | Secret Manager 専用 scope は存在しない。Google 公式必須 |
| CacheService 5 min | 採用 | dev.to ベストプラクティス: API 呼び出し最小化 + 障害耐性 |
| fail-soft fallback | 採用 | AGENTS.md §4「fail-closed 方針」だが pepper 不在 = login 全停止のため、**段階移行期間中は fail-soft が妥当**。完全移行後に fail-closed に切替 |

## 4. 実装ファイル

| ファイル | 変更内容 |
|---|---|
| `gas-src/Code.full.gs` | `getPasswordPepper_()` 改修 + `fetchPepperFromSecretManager_()` 新規 + `healthCheckPasswordPepper()` 新規 + 関連定数追加 |
| `backend/appsscript.json` | `cloud-platform` scope 追加 |
| `gas/admin/appsscript.json` | `cloud-platform` scope 追加 |
| `gas/member/appsscript.json` | `cloud-platform` scope 追加 |
| `scripts/audit-admin-boundary.mjs` | `healthCheckPasswordPepper` を admin allowlist に追加 |
| `scripts/build-admin-gas.mjs` | `healthCheckPasswordPepper` を preserved + assertAllowed に追加 |
| `docs/239_OPERATOR_GCP_SECRET_MANAGER_SETUP_2026-05-20.md` | 30 分の operator セットアップ手順書 |
| `docs/240_DESIGN_CLOUD_RUN_ARGON2ID_2026-05-20.md` | 次段階（外部 KDF）の完全設計書 |
| `cloud-run/password-hash-service/` | 次段階の実装雛形（Node.js + Express + argon2、Dockerfile、README） |

## 5. テスト結果

| 項目 | 結果 |
|---|---|
| `npm run typecheck` | ✅ pass |
| `npm run test:formula` | ✅ 33/33 pass |
| `npm run test:search` | ✅ 16/16 pass |
| `npm run security:public-boundary` | ✅ PASS（public top-level: doGet, healthCheck, processApiRequest） |
| `npm run security:member-boundary` | ✅ PASS（member top-level: doGet, processApiRequest） |
| `npm run security:admin-boundary` | ✅ PASS（admin top-level に `healthCheckPasswordPepper` 追加確認） |
| `npm run build:gas` / `:gas:admin` / `:gas:member` | ✅ 全 pass |

実機動作確認は **operator タスク**（次節）。

## 6. 操作者の即時対応タスク（必須）

詳細手順: `docs/239_OPERATOR_GCP_SECRET_MANAGER_SETUP_2026-05-20.md`

```
[ ] 1. Secret Manager API 有効化 (5 分)
       gcloud services enable secretmanager.googleapis.com

[ ] 2. Secret 作成 + 値投入 (10 分)
       - admin Apps Script editor で PASSWORD_HASH_PEPPER_V1 の値をコピー
       - gcloud secrets create password-hash-pepper-v1 --data-file=...
       - tmpfile を即座に shred 削除

[ ] 3. IAM 権限付与 (5 分)
       gcloud secrets add-iam-policy-binding password-hash-pepper-v1 \
         --member="user:k.noguchi@hcm-n.org" \
         --role="roles/secretmanager.secretAccessor"

[ ] 4. ヘルスチェック (10 分)
       - admin editor で healthCheckPasswordPepper を実行
       - 結果: fingerprint_match: true + resolved_via: "SecretManager"
       - member/public は OAuth 再承認のみ実施
```

完了したら fail-soft でなく **Secret Manager 経由で正常解決** されている状態になります。

## 7. fail-soft の意味と完了後の挙動

| operator タスク状態 | pepper 解決経路 | 評価 |
|---|---|---|
| 未実施（現状） | Script Properties（既存）| ❌ 第三者評価対応未完 / 動作には影響なし |
| Step 1-3 のみ実施 | Secret Manager → Properties fallback (cache 5 min) | ⚠️ 部分対応 / 動作には影響なし |
| 全 Step 実施 | **Secret Manager 主導** | ✅ 第三者評価対応完了（Properties は緊急 fallback） |

`fingerprint_match` で Properties と Secret Manager の値が一致していることが確認できれば、運用に進めます。**fingerprint_match: false の場合は絶対に運用に進まない**（既存パスワード検証が全て失敗するため）。

## 8. 次段階（v373.6 以降）

`docs/240_DESIGN_CLOUD_RUN_ARGON2ID_2026-05-20.md` で完全設計済み:

- Cloud Run + Node.js argon2 service
- OWASP 2025 推奨 Argon2id (m=19 MiB, t=2, p=1)
- OIDC ID Token 認証（service account key 不要）
- feature flag `ARGON2_ENABLED` + rehash-on-login で段階移行
- **本セッションでは実装雛形のみ提供。本番反映は次セッション以降に operator 監視下で段階的に実施**

実装雛形:
- `cloud-run/password-hash-service/package.json`
- `cloud-run/password-hash-service/Dockerfile`
- `cloud-run/password-hash-service/src/index.js`
- `cloud-run/password-hash-service/README.md`

## 9. 完全 fail-closed への切替（将来）

operator 全タスク完了 + 1 ヶ月以上の安定稼働確認後:

1. `gas-src/Code.full.gs` の `getPasswordPepper_()` から Properties fallback を削除
2. Secret Manager のみを正本とする
3. Script Properties の `PASSWORD_HASH_PEPPER_V1` を空にする（GCP 障害時に旧値で動作しないように）
4. 各 Apps Script editor で Properties の値が空であることを確認

これにより、本来の **fail-closed** 方針（AGENTS.md §4）に到達。

## 10. ロールバック

万が一 Secret Manager 連携で問題が発生した場合:

```bash
cd 'C:\VSCode\CloudePL\hirakatacitykyougikaiIDE\gas\admin'
npx clasp redeploy AKfycbwSCTTyvWY_cFG764XawdbqA8r0qxYbav4aDZ-BK9rRmvXHoUXrKQnQ9egRGqWcx4Os --versionNumber 150 --description "Rollback v373.5→v373.4"
```

member / public も同様に旧 version (member @99 / public @341) に戻す。Script Properties はそのまま残しているため、ロールバック後も認証は継続動作。
