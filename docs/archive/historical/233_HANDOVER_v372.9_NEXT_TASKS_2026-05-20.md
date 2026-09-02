# 233. v372.9 next handover

更新日: 2026-05-20
対象: v372.9 本番反映後の残タスク整理と次担当者引継ぎ

## 1. 現行本番

- Current production: `v372.9`
- integrated/public: `@341` x2
- member split: `@99`
- admin split: `@145`
- 最新 release state: `docs/232_RELEASE_STATE_v372.9_ROSTER_S2_DRAG_DROP_2026-05-20.md`

## 2. 直近完了

- v372.7: Drive bytes / thumbnail proxy を `T_研修` 登録 fileId のみに制限。
- v372.8: 名簿出力 Visual Designer の列幅・配置・日付/数値書式をプレビュー / CSV に反映。
- v372.9: 名簿出力 Visual Designer の出力列 drag-drop を `@dnd-kit` で実装。

## 3. 次担当者の最初の確認

1. `git status -sb` で作業ツリーが clean であることを確認する。
2. `AGENTS.md` §0（シークレット保管）と §4（レスポンシブ必須）を読む。
3. `HANDOVER.md`、本書、`docs/232_RELEASE_STATE_v372.9_ROSTER_S2_DRAG_DROP_2026-05-20.md` を読む。
4. 本番ブラウザで admin → 名簿出力を開き、列追加、↑/↓、drag-drop、テンプレ保存、CSV 出力を確認する。
5. 可能ならキーボード操作で drag handle にフォーカスし、並び替えが可能か確認する。

## 4. 残タスク

| 優先度 | タスク | 種別 | 注意 |
|---|---|---|---|
| High | v372.9 本番ブラウザ確認 | 操作者確認 | 名簿出力 drag-drop / キーボード並び替え / 保存 / CSV |
| High | `setupPendingThumbnailsTrigger` 実行確認 | 操作者確認 | PDF サムネイル後追い trigger。未登録なら admin Apps Script editor で Run |
| High | `cleanupCorruptChangeRequestsV372` 実行確認 | 操作者確認 | v372.6 文字化け申請レコード soft-delete |
| Medium | 名簿出力 S3 | 開発 | 計算式・条件付き書式。eval 禁止、allowlist parser 方針を維持 |
| Medium | 名簿出力 S4 | 開発 | PDF 出力（window.print + @page CSS）。レスポンシブと印刷 CSS を両方確認 |
| Medium | 名簿出力 S5 | 開発 | Excel 再評価 + 旧 RosterExport 系削除。xlsx は v361 の `import.meta` 事故を再確認 |
| Medium | Secret Manager / 外部 KDF backlog | 設計 | `docs/172_DEFERRED_SECURITY_BACKLOG_SECRET_MANAGER_KDF_2026-05-01.md` を破棄しない |
| Low | 入会承認時 credential メールを `deliverMail_` 経由へ統合 | 開発 | v371 mail guard の既知制約 |

## 5. 進め方

- 本番変更は `build -> push -> version -> fixed deployment sync -> verification -> document update` を完了条件にする。
- public/member/admin の境界を混ぜない。admin だけの UI 変更なら admin split のみ更新する。
- `.env`、`.clasp.json`、auth/token/storageState 類の値は読まない、出さない、コミットしない。
- DB スキーマを変更する場合は `docs/03_DATA_MODEL.md` と migration / rebuild 手順を同ターンで更新する。
- 実ブラウザ確認が未実施の場合は、未確認範囲を release state と `HANDOVER.md` に残す。
