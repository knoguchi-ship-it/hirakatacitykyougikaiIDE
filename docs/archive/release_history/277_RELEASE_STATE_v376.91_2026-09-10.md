# v376.91 リリース状態（2026-09-10）

## 1. 結論

公開ポータルの退会カード補助ラベルの白文字コントラストを WCAG 2.2 AA に適合させた。本人確認の修正を含む v376.90 をロールバックせず、表示色だけを続けて修正した。スキーマ・認証方式・業務データの変更はない。

## 2. 変更内容

- `src/public-portal/App.tsx` の退会カード補助ラベル背景を `amber-600` から `amber-700` へ変更。
- 公開/integrated、member、admin の HTML 生成物を再生成し、全 3 split を同一リリースへ同期。

## 3. デプロイ実績

| 対象 | version | fixed deployment |
|---|---:|---|
| integrated/public | @400 | 2 本 |
| member split | @158 | 1 本 |
| admin split | @255 | 1 本 |

`clasp push --force`、`clasp version`、`clasp redeploy` を各 split で完了した。

## 4. 検証

- `npm run prerelease`: PASS
- 公開 a11y: ホーム／入会申込／注意事項ステップの 3 view で critical / serious / moderate / minor すべて 0
- 公開 responsive: 320〜1920px の 7 viewport PASS
- public 固定 deployment は v376.91 の画面で a11y / responsive を実行して確認。

## 5. ロールバック

integrated/public @399 ×2、member @157、admin @254（v376.90）へ `clasp redeploy --versionNumber` で戻す。

## 6. GCP 移植メモ

Firebase Hosting の公開画面でも同じデザイントークンを用い、静的アクセシビリティ検査に加えて配信後の a11y 回帰を行う。
