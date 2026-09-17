# v376.89 リリース状態（2026-09-09）

## 1. 結論

U-27 の旧公開 API 6 本を本番から撤去した。公開ポータルの変更・退会は、現行の本人確認と変更申請キューだけを通る。スキーマ・認証方式・業務データの変更はない。

## 2. 変更内容

- `lookupMemberForPublicUpdate`
- `submitPublicMemberUpdate`
- `submitPublicBusinessUpdate`
- `addPublicStaffMember`
- `removePublicStaffByCmNumber`
- `submitPublicWithdrawalRequest`

上記を公開許可リスト、dispatch、実装本体から削除した。承認済み変更申請で必要な職員追加は、公開 API ではない `addApprovedStaffMember_` に分離して維持した。

## 3. デプロイ実績

| 対象 | version | fixed deployment |
|---|---:|---|
| integrated/public | @398 | 2 本 |
| member split | @156 | 1 本 |
| admin split | @253 | 1 本 |

`clasp push --force`、`clasp version`、`clasp redeploy` を各 split で完了し、`clasp deployments --json` で 4 本すべての同期を確認した。

## 4. 検証

- `npm run prerelease`: 31 suites PASS
- `npm run security:public-boundary`: PASS
- `npm run test:action-dispatch`: PASS（廃止 action の残存検出を追加）
- 公開 a11y: ホーム／入会申込／注意事項ステップの 3 view、fatal 0・違反 0
- 公開 responsive: 320〜1920px の 7 viewport、fatal・横スクロール・24px 未満の操作対象・console error がすべて 0
- 管理 responsive: 320〜1920px の 7 viewport × 8 console、fatal・画面遷移エラー・横スクロール・24px 未満の操作対象・console error がすべて 0

公開 a11y ハーネスは、設定読込み完了を待たずに開始していたため現行 UI の一部に未到達となる問題を修正した。v376.74 で廃止済みの重要事項モーダルではなく、会員種別選択後の注意事項ステップを検査する。

## 5. ロールバック

integrated/public @397 ×2、member @155、admin @252（v376.88）へ `clasp redeploy --versionNumber` で戻す。

## 6. GCP 移植メモ

Cloud Run の公開 API allowlist にも同じ 6 action を含めない。変更・退会・職員情報の公開導線は、本人確認後の変更申請キューを通し、Firestore への反映は管理者承認後に行う。
