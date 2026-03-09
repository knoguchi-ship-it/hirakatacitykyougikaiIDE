# デプロイ標準（URL固定運用）

更新日: 2026-03-09

## 1. 目的
- 本番WebアプリURLを固定し、利用者影響を防ぐ。
- `/exec` の404再発を抑止する。
- 既存Deployment IDに対するVersion更新を標準化する。

## 1.1 原則
- 本番更新は「新しいVersionを作成」し、「既存の本番Deployment ID」に適用する。
- 上記運用では本番URLは変わらない。
- `New deployment` は原則禁止（URL変更が発生するため）。
- 例外的に `New deployment` を行うのは、既存IDで `/exec` 復旧不能な場合のみとし、実施時は本書の固定対象を即時更新する。

## 2. 固定対象
- 本番Deployment ID: `AKfycby8Uc8RMNpRrcQIV-DePe3ZzoDMglSnB9EBO5GXzTn3VNyJT1lUBcpEpjiodjqbzCpF`
- 本番URL: `https://script.google.com/macros/s/AKfycby8Uc8RMNpRrcQIV-DePe3ZzoDMglSnB9EBO5GXzTn3VNyJT1lUBcpEpjiodjqbzCpF/exec`

## 3. 今後の標準デプロイ手順（必須）
1. `npm run build:gas`
2. `npx clasp push --force`
3. `npx clasp version "<release note>"`
4. Apps Script UI -> `Deploy` -> `Manage deployments`
5. 上記の本番Deployment IDを編集し、Versionのみ最新へ更新
6. `Web app` 種別が有効であることを確認して保存
7. `/exec` を実ブラウザで確認（404でないこと）

## 4. 禁止事項
- 本番運用で毎回 `New deployment` を作ること（URLが変わるため）
- Web app確認なしで `clasp redeploy` のみで完了とすること
- 本番Deployment IDを事前合意なく変更すること

## 5. 障害時の標準切り分け
1. `npx clasp deployments` で本番Deployment IDの存在を確認
2. Apps Script UIで `Web app` 種別を確認
3. `curl -I <exec-url>` で 404/403 を判定
4. 404なら `Manage deployments` で同一IDを編集し再保存

## 6. 公式仕様（参照）
- Apps Script Deployments: https://developers.google.com/apps-script/concepts/deployments
- Apps Script Versions: https://developers.google.com/apps-script/guides/versions
- clasp: https://developers.google.com/apps-script/guides/clasp
- Apps Script API (deployments/versions): https://developers.google.com/apps-script/api/reference/rest
