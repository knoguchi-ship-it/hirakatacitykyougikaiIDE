# デプロイ標準（2 Deployment 固定運用）

更新日: 2026-03-13

---

## 1. 目的

- 会員マイページ / 公開ポータルの URL を完全に分離し、利用者混同を防ぐ。
- 本番 URL を固定し `/exec` の 404 再発を抑止する。
- リリースのたびに 2 つの Deployment ID を同時更新する標準を確立する。

---

## 2. 固定 Deployment ID 一覧

| 用途 | Deployment ID | 本番 URL | 備考 |
|---|---|---|---|
| **会員マイページ** | `AKfycbzmnp5s0ulA9gWZuNUevcJirKXhpBU7mtwJLQDNb5dx1zEgdRZoEJweEPJlKOo4-AZa` | `.../exec` | デフォルト（?app=member） |
| **公開ポータル** | `AKfycbz7YRgNXIYyHTvE9OJGq1h6g-5W94LsfNLYReTTWTdlfcLhQFaG9CM2Ro_i9AJ7eWwl` | `.../exec?app=public` | 2026-03-13 発行 |

> 両 Deployment とも **@74** で同期済み（2026-03-13）。

---

## 3. デプロイ手順

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

### 2026-03-10（旧 ID 廃止）
- 旧本番 ID が `実行可能 API` 化し `/exec` が 404 となった。
- 標準復旧不能のため `New deployment` で再発行。
- 新 ID: `AKfycbzmnp5s0ulA9gWZuNUevcJirKXhpBU7mtwJLQDNb5dx1zEgdRZoEJweEPJlKOo4-AZa`（会員マイページ）

### 2026-03-13（clasp deploy --deploymentId 問題）
- `clasp deploy --deploymentId` 繰り返しで Web App → `実行可能 API` に変換された。
- **教訓**: `clasp deploy --deploymentId` 使用禁止。本番更新は必ず `Manage deployments` UI から。

---

## 7. 公式仕様（参照）

- Apps Script Deployments: https://developers.google.com/apps-script/concepts/deployments
- Apps Script Versions: https://developers.google.com/apps-script/guides/versions
- clasp: https://developers.google.com/apps-script/guides/clasp
