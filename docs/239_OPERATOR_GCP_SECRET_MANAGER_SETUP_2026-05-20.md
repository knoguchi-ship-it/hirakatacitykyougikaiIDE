# 239. 操作者向け GCP Secret Manager セットアップ手順（v373.5）

更新日: 2026-05-20
対象リリース: **v373.5**
対象 operator: `k.noguchi@hcm-n.org`
所要時間: **30 分程度**
重要度: **HIGH**（実施しなくても fail-soft で Script Properties に倒れるため即座にログイン不能にはならないが、Secret Manager 統合完成のため必須）

## 0. 何が変わったか

v373.5 で `getPasswordPepper_()` は以下の階層で pepper を解決するようになりました:

1. **CacheService**（5 分以内なら即返却）
2. **Google Cloud Secret Manager**（新規）
3. **Script Properties** `PASSWORD_HASH_PEPPER_V1`（既存・fail-soft フォールバック）

本手順を実施することで、本番運用が Secret Manager 主導に切り替わります。**未実施でも従来通り Script Properties で動作します**（fail-soft）。

## 1. 前提条件

- GCP プロジェクト: `hcmn-member-system-prod`（プロジェクト番号: `88737175415`）
- 運用アカウント: `k.noguchi@hcm-n.org`
- 既存 Script Properties: `PASSWORD_HASH_PEPPER_V1` が integrated/public・member split・admin split の **3 つ全てに同一の強乱数で設定済み**であること

## 2. 手順（30 分）

### Step 1: Secret Manager API 有効化（5 分）

```bash
# gcloud にログイン（既にログイン済みならスキップ）
gcloud auth login k.noguchi@hcm-n.org
gcloud config set project hcmn-member-system-prod

# Secret Manager API 有効化
gcloud services enable secretmanager.googleapis.com
```

または GCP コンソール: https://console.cloud.google.com/apis/library/secretmanager.googleapis.com?project=hcmn-member-system-prod → 「有効にする」

### Step 2: Secret の作成 + 値投入（10 分）

**重要**: pepper 値は Script Properties に既に設定済みのものと **完全に同一**である必要があります。値を新しく生成してしまうと、既存パスワードの検証が全て失敗します。

#### 2-A. 既存値の確認（コピー）

1. Apps Script editor（admin split）を開く
2. プロジェクト設定 → スクリプト プロパティ
3. `PASSWORD_HASH_PEPPER_V1` の値をコピー（一時的にメモ帳等に保管）

#### 2-B. Secret 作成

```bash
# pepper 値を一時ファイルに保存（コピーした値を貼り付け）
echo -n "<paste-pepper-value-here>" > /tmp/pepper.txt

# Secret 作成
gcloud secrets create password-hash-pepper-v1 \
  --replication-policy="automatic" \
  --data-file=/tmp/pepper.txt

# ファイル即時削除（重要）
shred -u /tmp/pepper.txt
```

または GCP コンソール: https://console.cloud.google.com/security/secret-manager/create?project=hcmn-member-system-prod

- **Name**: `password-hash-pepper-v1`
- **Secret value**: コピーした pepper 値
- **Replication policy**: Automatic
- **Labels**: `purpose=password-hash-pepper`, `version=v1`（任意）
- 「シークレットを作成」

### Step 3: IAM 権限付与（5 分）

`k.noguchi@hcm-n.org` に `roles/secretmanager.secretAccessor` を Secret 単位で付与（プロジェクト全体ではなく **Secret に限定**でより最小権限）:

```bash
gcloud secrets add-iam-policy-binding password-hash-pepper-v1 \
  --member="user:k.noguchi@hcm-n.org" \
  --role="roles/secretmanager.secretAccessor"
```

または GCP コンソール: Secret Manager → `password-hash-pepper-v1` → 「権限」タブ → 「アクセス権を付与」
- **新しいプリンシパル**: `k.noguchi@hcm-n.org`
- **ロール**: `Secret Manager Secret Accessor`

### Step 4: ヘルスチェック（10 分）

#### 4-A. admin split で実行

1. admin Apps Script editor を開く: https://script.google.com/u/0/home/projects/1tlBJ-OJjqNQQxzb5tY3iRUlS4DmQD9sYqw5j842tXD1SPVHutBUeKTRi
2. **初回起動時に OAuth 再承認画面**が表示される可能性あり（`cloud-platform` scope 追加のため）→ 承認
3. 関数選択ドロップダウンから `healthCheckPasswordPepper` を選択
4. 「実行」ボタン → 実行ログを確認

期待される Logger 出力（値そのものは出ません。fingerprint は SHA-256 先頭 16 hex chars）:

```json
[
  {"source": "ScriptProperties", "present": true, "length": <number>, "fp": "<16-hex>"},
  {"source": "SecretManager",    "present": true, "length": <number>, "fp": "<16-hex>"},
  {"check": "fingerprint_match", "match": true},
  {"resolved_via": "SecretManager", "length": <number>}
]
```

- `fingerprint_match: true` であること → **Properties と Secret Manager の値が完全一致**
- `resolved_via: "SecretManager"` であること → **本番が Secret Manager 経由で解決**

#### 4-B. member split / integrated/public でも同様に実行

- member split editor: https://script.google.com/u/0/home/projects/<member-script-id>/edit
- integrated/public editor: https://script.google.com/u/0/home/projects/<integrated-script-id>/edit

各プロジェクトで OAuth 再承認 + `healthCheckPasswordPepper` の同等動作を確認（※ member/public では `healthCheckPasswordPepper` は build pruning で除外されるため、admin split のみで確認）。

代替検証: member/public で `healthCheck` 関数（既存）を実行して、エラーログに Secret Manager 障害が出ていないことを確認。

### Step 5: トラブルシューティング

#### 「Secret Manager HTTP 403」が出る

- 原因: IAM 権限不足
- 対処: Step 3 を再確認。`gcloud secrets get-iam-policy password-hash-pepper-v1` で binding を確認

#### 「Secret Manager HTTP 404」が出る

- 原因: Secret 名が不一致 or プロジェクト ID 不一致
- 対処: Secret 名は `password-hash-pepper-v1`（kebab-case、v1 suffix）であること、プロジェクトは `hcmn-member-system-prod` であること

#### 「Secret Manager HTTP 401」が出る

- 原因: OAuth スコープ未承認 or API 未有効化
- 対処: Step 1 で API 有効化、Apps Script editor で OAuth 再承認

#### `fingerprint_match: false` が出る

- 原因: Properties と Secret Manager の値が **一致していない**
- 対処: **絶対に運用に進まない**。Step 2-A から再実施し、Properties の値を Secret に正しくコピーする

#### Apps Script editor で関数一覧に `healthCheckPasswordPepper` が出ない

- 原因: clasp push 後にエディタを再読み込みしていない
- 対処: ブラウザを reload

## 3. ロールバック手順

### Secret Manager を使うのをやめる場合

- 各 Apps Script editor で「プロジェクト設定」→ 「スクリプト プロパティ」を確認し、`PASSWORD_HASH_PEPPER_V1` が引き続き同一値であることを確認
- Secret Manager の Secret は削除しなくて良い（getPasswordPepper_ は fail-soft で Properties にフォールバックする）
- 完全に切り戻すなら appsscript.json から `cloud-platform` scope を外し、3 split を redeploy

### Secret の値を更新する場合（pepper ローテーション、将来）

1. **絶対に既存 Secret を上書きしない**。新しい version を追加する: `gcloud secrets versions add password-hash-pepper-v1 --data-file=/tmp/new-pepper.txt`
2. 全 Apps Script editor の Script Properties も同時に更新（pepper ID `v1` のままなら旧 hash と互換）
3. **pepper ID を `v2` に変える場合**は migration が必要 — 別途設計が必要（既存 hash を旧 pepper で verify → 新 pepper で rehash → 段階移行）

## 4. 完了条件チェックリスト

- [ ] Secret Manager API 有効化済み
- [ ] Secret `password-hash-pepper-v1` 作成済み、Script Properties と同一値
- [ ] `k.noguchi@hcm-n.org` に `roles/secretmanager.secretAccessor` 付与済み
- [ ] admin split で `healthCheckPasswordPepper` 実行 → `fingerprint_match: true` + `resolved_via: "SecretManager"`
- [ ] member split のログインで認証が引き続き成功すること（本番ユーザーでテスト）
- [ ] public 入会申込で credential メール送信が引き続き成功すること

## 5. 関連ドキュメント

- `docs/171_PASSWORD_HASH_STANDARD_ALIGNMENT_2026-04-30.md` — v262 pepper 導入時の設計
- `docs/172_DEFERRED_SECURITY_BACKLOG_SECRET_MANAGER_KDF_2026-05-01.md` — 本タスクの起源
- `docs/240_DESIGN_CLOUD_RUN_ARGON2ID_2026-05-20.md` — 次の段階（外部 KDF 移行）の設計
- `gas-src/Code.full.gs` の `getPasswordPepper_()` / `fetchPepperFromSecretManager_()` / `healthCheckPasswordPepper()`
