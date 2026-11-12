# v376.145 リリース記録（2026-11-12）

本番は public @455×2 / member @213 / admin @312（commit `5bcc65ff`）。
ロールバック先は v376.144（public @454×2 / member @212 / admin @311）。スキーマ版は
`2026-10-25-screen-text-templates-v376.135` のまま、表・列の変更は無い（戻すときの事前処理は不要）。DB への書き込みは無い。

## 1. operator の決定（2026-11-12）

| 決定 | 対応 |
|---|---|
| 作業の順番は「速さの改善を先に」（研修登録の段 2 はその後） | 手順 0b から着手 |
| 一度きりのツール 7 本の撤去は「0b のリリースにまとめる」 | この版で撤去 |
| リリース（operator が `clasp login` を実行して承認） | この版 |

## 2. 中身

| 項目 | 内容 | 検査 |
|---|---|---|
| 手順 0b の計測（3 split） | 依頼に `__profile: true` があり許可リストの action のときだけ、部品名と ms をログへ 1 行（応答は変えない・値は含めない）。`evalMs` で Code.gs の評価時間も取る。設計は `docs/325` §6.5。**段 1 のリリースで撤去する** | `test:load-performance`（sandbox に `apiProfileMark_`）・`test:feature-inventory`（計測の配線を共通の雑音として除外） |
| 一度きりのツール 7 本の撤去（admin maintenance.gs） | `previewTrainingLeftoverCleanup_LOG` / `executeTrainingLeftoverCleanup_APPLY` / `diagnoseTrainingFileFolder_LOG` / `previewTrainingFolderRunawayCleanup_LOG` / `executeTrainingFolderRunawayCleanup_APPLY` / `previewObsoleteMigrationSheetsDelete_LOG` / `executeObsoleteMigrationSheetsDelete_APPLY` と補助の関数・定数。使い終えた（`docs/326`） | `test:test-data-purge`（撤去済みであることを確かめる形に置換）・`test:operator-tool-guard` |

計測の 2 本（`profileLoadCost_LOG`・`profileStoreWriteCost_APPLY`）は残した（段 1 で外す）。

## 3. 検証

- prerelease PASS（HEAD 5bcc65ff）。3 split 生成物に計測が入り、撤去した 7 本が 0 であることを grep で確認（admin maintenance.gs も 0）。
- 公開: `test:a11y` 違反 0・`test:responsive` 7 VP すべて PASS。
- 管理: デプロイ直後の 1 回目でダッシュボードまで 24.1 秒（冷えた状態）。`getAdminInitData`・`getAdminChangeRequests`・`getSystemSettings` 各 3 回成功（応答の大きさは v376.144 と同じ 134,727 / 20,843 / 18,508 字）。
- 計測の結果は `docs/325` §6.6（Cloud Logging で `[apiProfile]` 9 件＋公開 6 件を読んだ）。

## 4. 未検証

- `test:responsive:admin`（storageState 未更新）。管理画面の変更は無い（計測は応答を変えない）。
- 会員 split の計測（会員マイページ未公開・テスト会員のログインが無い）。
- 計測ログを編集者以外が読めないこと（Cloud Logging の権限は GCP プロジェクトの IAM。変更していない）。
