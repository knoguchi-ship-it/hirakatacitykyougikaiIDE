# デプロイ標準（2 Deployment 固定運用）

更新日: 2026-03-26

---

## 1. 目的

- 会員マイページ / 公開ポータルの URL を完全に分離し、利用者混同を防ぐ。
- 本番 URL を固定し `/exec` の 404 再発を抑止する。
- リリースのたびに 2 つの Deployment ID を同時更新する標準を確立する。

---

## 2. 固定 Deployment ID 一覧

| 用途 | Deployment ID | 本番 URL | 備考 |
|---|---|---|---|
| **会員マイページ** | `AKfycbywpWoYxij6A-ZunIeBjG1Q8qX78PMMTsT3frx1cM5PJ2nAuZpz81KruXb5LIvWgbQx` | `.../exec` | 2026-03-20 Web app 再発行（v111 復旧後の現行固定） |
| **公開ポータル** | `AKfycbxyuUXgK1oHUDMahQjluiL-gcrMK0qV0FWLFYaYBqGxlRSg9NhvmbyQRyf0dvaqg7Zp` | `.../exec?app=public` | 2026-03-20 Web app 再発行（v111 復旧後の現行固定） |

> 両 Deployment とも **@130** で同期済み（2026-03-26）。
> `npx clasp deployments` の表示名が Apps Script UI の `Manage deployments` の表示と食い違うことがあるため、固定IDの最終確認は Apps Script UI を正とする。

---

## 3. デプロイ手順

### 3.0 事前チェック（毎回必須）

```bash
# 0-1. 作業ブランチ/差分確認
git status --short

# 0-2. ローカル静的確認
npm run typecheck
npm run build
npm run build:gas

# 0-3. 認証アカウント確認
npx clasp show-authorized-user

# 0-4. 既存 Deployment 状態確認
npx clasp deployments
```

事前チェックの判定:
- `npx clasp show-authorized-user` が運用アカウントを示していること。
- `npx clasp deployments` で固定 2 Deployment ID が存在すること。
- ローカルの `typecheck / build / build:gas` が成功していること。
- この時点で異常がある場合、先に `docs/17_ROOT_CAUSE_ERROR_RESPONSE_PLAYBOOK.md` に従って切り分ける。デプロイを先行しない。

### 3.1 通常リリース（バージョン更新）

```bash
# 1. ビルド・プッシュ
npm run build:gas
cd backend
npx clasp push --force
npx clasp version "リリースノート"

# 2. バージョン番号を控える（以下の確認で使う）
npx clasp versions
```

```
# 3. 同期確認（2 Deployment が同じバージョンであることを確認）
npx clasp deployments
```

確認ポイント：
- `会員マイページ Deployment ID @N` と `公開ポータル Deployment ID @N` の N が一致していること
- どちらも `Web app` 種別であること（`API Executable` になっていたら §5 参照）

```
# 4. Apps Script UI 操作（必須・2 回実施）
Deploy > Manage deployments
  → 会員マイページ Deployment ID を編集 → Version を最新へ更新 → 保存
  → 公開ポータル Deployment ID を編集 → Version を最新へ更新 → 保存

# 5. 疎通確認（2 URL とも確認）
curl -I https://script.google.com/macros/s/<会員ID>/exec
curl -I https://script.google.com/macros/s/<公開ID>/exec?app=public
```

```bash
# 6. GAS 疎通確認
npx clasp run healthCheck
npx clasp run getDbInfo
```

**上記 1〜6 が全て成功して初めて「本番完了」とする。**

### 3.1.1 完了判定チェックリスト（毎回必須）

- [ ] `npx clasp deployments` で固定 2 Deployment ID がともに同一 Version を指している
- [ ] Apps Script UI の `Manage deployments` で固定 2 Deployment ID がともに `Web app` である
- [ ] `/exec` が 404 でない
- [ ] `/exec?app=public` が 404 でない
- [ ] `npx clasp run healthCheck` が成功
- [ ] `npx clasp run getDbInfo` が成功
- [ ] 実ブラウザで会員側 / 公開側の最低 1 画面ずつ表示確認済み
- [ ] `HANDOVER.md` / 必要な正本ドキュメントを更新済み

---

### 3.2 公開ポータル Deployment ID 初回発行手順（一回限り）

1. Apps Script UI → `Deploy` → `New deployment`
2. 種別: `Web app`
3. 説明: `公開ポータル (prod)`
4. Execute as: `Me`
5. Who has access: `Anyone`
6. 最新バージョンを選択 → `Deploy`
7. 発行された Deployment ID を `docs/09_DEPLOYMENT_POLICY.md` §2 の表へ記入
8. `HANDOVER.md` と `CLAUDE.md` の固定 ID 記載も同時更新
9. `npx clasp deployments` で2つの ID が存在することを確認
10. Git コミット（対象: `docs/09_DEPLOYMENT_POLICY.md`, `HANDOVER.md`, `CLAUDE.md`）

---

## 4. 禁止事項

| 禁止操作 | 理由 |
|---|---|
| `clasp deploy --deploymentId` | Web App を `実行可能 API` に変換する既知バグあり |
| `clasp redeploy` のみで完了とする | Web app 種別確認ができないため |
| 本番 Deployment ID を事前合意なく変更 | URL が変わり利用者影響が発生するため |
| 2 Deployment のどちらか一方だけ更新 | バージョン乖離 → 動作差異が発生するため |
| 疎通確認なしで本番完了扱い | 404 見落とし防止 |

---

## 5. 障害時の切り分け手順

### 5.0 よくある再発パターンと最初の確認先

| 症状 | 最初に確認するもの | 主な原因 |
|---|---|---|
| `/exec` が 404 | Apps Script UI `Manage deployments` | `Web app` が消えている / 別 Version を参照 |
| `clasp run` が失敗 | `npx clasp show-authorized-user` / `docs/16_INCIDENT_clasp_run_permission_2026-03-14.md` | OAuth 認証崩れ / 組織ポリシー |
| `npx clasp deployments` と UI 表示が噛み合わない | Apps Script UI `Manage deployments` | CLI 表示名と UI 表示名の不一致 |
| デプロイ後に片系だけ古い | 固定 2 Deployment ID の Version | 会員側/公開側の片方だけ更新 |
| ドキュメント更新後に文字化け | エディタ保存時の UTF-8 形式 | 文字コード/BOM 不一致 |

### 5.1 /exec が 404 の場合

```bash
# 1. 両 Deployment の存在確認
npx clasp deployments

# 2. Apps Script UI で Web app 種別を確認
Deploy > Manage deployments > 該当 ID を確認

# 3. 404 の場合 → 同一 ID を編集して再保存（種別変更なし）
# 4. Web app 種別が消えている場合 → §5.2 例外手順へ
```

### 5.2 Web app 種別の復旧不能時（例外）

標準手順（5.1）で復旧不能と確認できた場合のみ、以下を実施：

1. 症状・実施した切り分け・復旧不能の根拠を記録する
2. `New deployment` で `Web app` を再発行する
3. 新 ID を §2 の表・`HANDOVER.md`・`CLAUDE.md` に即時反映する
4. Git コミット（対象: 本書・HANDOVER.md・CLAUDE.md）

---

## 6. 例外実績

### 2026-03-20（v111: webapp manifest 追加 + 新固定IDへ切替）
- `clasp redeploy` により旧固定 2 Deployment が `@109` を指した直後、`/exec` が 404 となり `getWebAppEndpointInfo().serviceEnabled=false` を確認。
- Playwright から Apps Script UI の `Manage deployments` へログイン済み状態で到達できず、標準 UI 更新がこのセッションでは実行不能だった。
- `appsscript.json` に `webapp.access=ANYONE_ANONYMOUS` / `executeAs=USER_DEPLOYING` を追記し、`@111` を作成。
- `clasp deploy --versionNumber 111` で新規 Deployment を 2 本発行し、実ブラウザで会員ログイン画面 / 公開ポータルトップの表示を確認。
- 新固定 ID:
  - 会員マイページ: `AKfycbywpWoYxij6A-ZunIeBjG1Q8qX78PMMTsT3frx1cM5PJ2nAuZpz81KruXb5LIvWgbQx`
  - 公開ポータル: `AKfycbxyuUXgK1oHUDMahQjluiL-gcrMK0qV0FWLFYaYBqGxlRSg9NhvmbyQRyf0dvaqg7Zp`

### 2026-03-10（旧 ID 廃止）
- 旧本番 ID が `実行可能 API` 化し `/exec` が 404 となった。
- 標準復旧不能のため `New deployment` で再発行。
- 新 ID: `AKfycbycE2_ythCYSPwmPxvyfRzNLhWM7J1cX41TA2wjYgZgdI-P2uknYfQGh3AHrecCQ1Gk`（会員マイページ）

### 2026-03-13（clasp deploy --deploymentId 問題）
- `clasp deploy --deploymentId` 繰り返しで Web App → `実行可能 API` に変換された。
- **教訓**: `clasp deploy --deploymentId` 使用禁止。本番更新は必ず `Manage deployments` UI から。

### 2026-03-15（固定2 Deployment の Version 同期漏れ予防）
- `npx clasp version` 後にコードは上がっていても、固定 2 Deployment ID が旧 Version のまま残ることがある。
- **教訓**: `clasp version` 完了だけでは本番反映完了にしない。必ず Apps Script UI の `Manage deployments` で固定 2 Deployment ID を同じ Version へ更新し、`npx clasp deployments` と実ブラウザで再確認する。

### 2026-03-26（v130 固定 deployment 更新）
- `npx clasp version "v130: final staff split, credentials ledger, and handover sync"` 実行時に version `130` が採番された。
- `npx clasp redeploy <deploymentId> --versionNumber 130` で固定 2 Deployment ID をともに `@130` へ更新した。
- `npx clasp deployments` で会員/公開ともに `@130` を確認した。
- `healthCheck`、`getDbInfo`、`inspectCredentialsTempJson`、`previewAllActiveCredentialPasswordReissueJson` を実行し、DB・認証台帳・deployment の整合性を確認した。

### 2026-03-15（ドキュメント更新時の文字化け）
- PowerShell/ツール経由の書き戻しで UTF-8 形式が崩れると、日本語の正本ドキュメントが文字化けすることがある。
- **教訓**: ドキュメント更新後は UTF-8 で再読込して確認し、文字化けが出た場合はその場で修正する。正本更新未確認のまま完了扱いにしない。

### 2026-03-14（公開取消不具合の緊急修正）
- 公開取消時に `申込状態コード` の入力規則違反エラーを確認。
- `cancelTrainingExternal_` のステータス書込値を `取消` から `CANCELED` に修正。
- `@76` を作成し、固定2 Deployment ID を同時に `@76` へ更新。

### 2026-03-14（申込状態コード整合修正）
- 公開申込の新規書込で `申込状態コード` が表示文言 `申込済` になっていたため、コード値 `APPLIED` に修正。
- `@77` を作成し、固定2 Deployment ID を同時に `@77` へ更新。

---

## 7. 公式仕様（参照）

- Apps Script Deployments: https://developers.google.com/apps-script/concepts/deployments
- Apps Script Versions: https://developers.google.com/apps-script/guides/versions
- clasp: https://developers.google.com/apps-script/guides/clasp
