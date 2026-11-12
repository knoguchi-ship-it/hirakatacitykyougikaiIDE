# v376.143 リリース記録（2026-11-08）

本番は public @453×2 / member @211 / admin @310（commit `bb2d95a`）。
ロールバック先は v376.142（public @452×2 / member @210 / admin @309）。スキーマ版は
`2026-10-25-screen-text-templates-v376.135` のまま、表・列の変更は無い（戻すときの事前処理は不要）。

## 1. 既存のデモ研修の本番削除（2026-11-08・operator 承認）

`docs/319` §7.1 の決定（一度きりの専用ツール・2 段）どおり、v376.142 の管理 split で実行した（`/dbops`）。

| 段 | 内容 |
|---|---|
| 確認 | `previewDemoTrainingPurge_LOG`（clasp run・読むだけ）。研修 5 件（T001〜T004・T473A9682〔削除済み〕）・申込 8 行・止まる理由 0・指紋 `00c7f944…` |
| 承認 | operator が一覧を確かめて「承認します」 |
| 再確認 | 30 分の期限が切れていたので出し直し、指紋が承認時と同じこと・止まる理由 0 を確かめた |
| 実行 | `executeDemoTrainingPurge_APPLY`。消したのは T_研修 5・T_研修申込 8（T_研修申込_archive・T_外部申込者・T_メール送信明細は 0）。監査ログ `DEMO_TRAINING_PURGE` |
| 数え直し | 確認を出し直して対象 0、`describeDatabaseState_LOG` で T_研修・T_研修申込・T_研修申込_archive とも 0 行。T_外部申込者は 3 行（すべて論理削除済み・今回の対象外で変化なし） |

**残したもの（消していない）**: 研修の案内状ファイル 5 件（Drive）・LINE 投稿依頼 1 件（消えた研修を指す）・
送信ログ・監査ログ。案内状と LINE 投稿依頼を片付けるかは operator 判断。

## 2. 中身

| 項目 | 内容 | 検査 |
|---|---|---|
| 一度きりのツールの撤去（bb2d95a） | `previewDemoTrainingPurge_LOG` / `executeDemoTrainingPurge_APPLY` と `DEMO_*` を外した。研修の物理削除は印（★＋@example.invalid）のある研修だけで、mode の引数も無くした。**印の無い研修を消す経路は無い** | `test:test-data-purge`（撤去済みであること・印の無い研修は対象外） |

## 3. 確認

| 項目 | 結果 |
|---|---|
| 全ゲート | `npm run prerelease` exit 0（HEAD `bb2d95af`） |
| 生成物 | デモ用の 2 関数は admin の maintenance.gs から消え、残るのは撤去を記したコメントだけ。`previewTrainingTestDataPurge_LOG` は admin の maintenance.gs だけ |
| 向き先 | `release:verify` で 4 本と HANDOVER の一致を確認 |
| 本番の保守ツール | clasp run で `previewTrainingTestDataPurge_LOG` 成功（対象 0）・`previewDemoTrainingPurge_LOG` は「Script function not found」 |
| E2E | 公開: `test:a11y` 違反 0・`test:responsive` 7 画面幅 合格。管理: `test:responsive:admin` **56/56 合格**（7 画面幅 × 8 画面）。初回は 11-04 のログイン情報が切れて 7 画面幅とも開かず（MCP も Google のログイン画面）、operator の再ログイン後に流した |

## 4. リリース後に分かったこと（2026-11-08）

案内状 5 件・LINE 投稿依頼 1 件を片付けようとしたところ、研修ファイルの保存先フォルダを運用アカウントで開けず、
そのために**10 分ごとの定期処理が空の「研修案内状」フォルダを作り続けている**ことが分かった（この版で入った不具合ではない）。
調査結果と計画は `docs/324`。
