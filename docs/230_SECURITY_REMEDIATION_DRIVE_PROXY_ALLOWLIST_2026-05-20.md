# 230. Drive proxy allowlist security remediation

更新日: 2026-05-20
対象: 第三者評価 2026-05-20 指摘 #1（Drive bytes / thumbnail proxy の任意 fileId 化リスク）
本番反映: `v372.7` / integrated-public `@341` x2 / member split `@99` / admin split `@143`

## 1. 背景

`getFileThumbnail_()` / `getFileBytes_()` は Drive fileId を受け取り、GAS WebApp の実行者権限で Drive ファイルを取得する。
public / member / admin の各境界で利用されるため、任意 fileId を proxy しないよう、取得対象を `T_研修` に登録済みの研修案内ファイルへ限定する。

## 2. 実装

- `gas-src/Code.full.gs` に `isTrainingGuideDriveFileAllowed_(fileId)` を追加。
- 許可対象は `T_研修.案内状URL` または `T_研修.案内状サムネイルURL` から抽出できる Drive fileId のみ。
- public 境界では `getPublicTrainings_()` と同じく申込受付中の研修だけを許可し、下書き・非公開・受付外研修の fileId は proxy 対象外。
- `getFileThumbnail_()` は未許可 fileId の場合、既存 UI を壊さないよう placeholder を返す。
- `getFileBytes_()` は未許可 fileId の場合、`{ base64: null, error: 'access_denied' }` を返す。
- DB 読込エラー時は fail-closed とし、Drive 取得に進まない。

## 3. 影響範囲

- 公開ポータル、会員マイページ、管理者ポータルの案内 PDF サムネイル / プレビュー。
- 既存の `T_研修` に紐づく PDF URL・PNG サムネイル URL は引き続き表示対象。
- `T_研修` に未登録の Drive fileId は表示対象外。

## 4. 検証

2026-05-20 ローカル検証:

- `npm run build:gas` PASS
- `npm run build:gas:member` PASS
- `npm run build:gas:admin` PASS
- `npm run security:public-boundary`
- `npm run security:split-boundary`
- `npm run typecheck`
- `npm run test:search`
- `npm run prerelease` PASS

2026-05-20 本番反映:

- integrated/public: `npx clasp push --force` → `npx clasp version "v372.7 Drive proxy allowlist"` → version `341`
- integrated/public legacy fixed deployment: `@341`
- integrated/public official fixed deployment: `@341`
- member split: `npx clasp push --force` → version `99` → fixed deployment `@99`
- admin split: `npx clasp push --force` → version `143` → fixed deployment `@143`
- `npx clasp deployments --json` で上記 fixed deployment の `versionNumber` と description `v372.7 Drive proxy allowlist` を確認済み。
- operator による本番ブラウザ確認で、研修 PDF サムネイル / lightbox 表示に破綻がないことを確認済み。

## 5. 残確認

- Apps Script runtime 上で、未許可 fileId が `getFileThumbnail` では placeholder、`getFileBytes` では `access_denied` になることの直接確認。
