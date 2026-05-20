# hcmn-password-hash-service

Argon2id password hashing/verification microservice. Called from Google Apps Script
(integrated/public, member split, admin split) via OIDC ID token authentication.

**Status**: design + skeleton only (本セッションでは deploy しない / 次セッション以降に operator 監視下で実機反映)

詳細は `docs/240_DESIGN_CLOUD_RUN_ARGON2ID_2026-05-20.md` を参照。

## ローカル起動（開発）

```bash
cd cloud-run/password-hash-service
npm install
EXPECTED_AUDIENCE="https://hcmn-password-hash-xxxxx-an.a.run.app" \
ALLOWED_INVOKERS="k.noguchi@hcm-n.org" \
npm start
```

## Cloud Run へのデプロイ（次セッション・operator）

```bash
gcloud run deploy hcmn-password-hash \
  --source . \
  --region asia-northeast1 \
  --no-allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 3 \
  --set-env-vars "EXPECTED_AUDIENCE=https://<service-url>,ALLOWED_INVOKERS=k.noguchi@hcm-n.org" \
  --service-account hcmn-password-hash-sa@hcmn-member-system-prod.iam.gserviceaccount.com
```

## API

| Endpoint | 説明 |
|---|---|
| `POST /v1/hash` | `{ password, pepper? }` → `{ phc, alg, params }` |
| `POST /v1/verify` | `{ password, phc, pepper? }` → `{ match, needsRehash }` |
| `GET /healthz` | health check |

すべての `/v1/*` は `Authorization: Bearer <OIDC ID Token>` 必須。
