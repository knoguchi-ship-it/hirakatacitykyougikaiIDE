# v376.139 リリース記録（2026-11-01）

本書は v376.139 のリリース記録である。本番は public @449×2 / member @207 / admin @306（commit `b813181`）。
ロールバック先は v376.138（public @448×2 / member @206 / admin @305）。スキーマ版は
`2026-10-25-screen-text-templates-v376.135` のまま、表・列の変更は無い（戻すときの事前処理は不要）。

## 1. 中身

| 項目 | 内容 | 正本・検査 |
|---|---|---|
| 会員・職員の移行（S46） | 書込み対象の全 9 表＋T_変更申請 を書く前に確かめる。本人に処理待ちの変更申請があれば止める。書込みは Sheets API の 1 回の一括更新（全部か無し）。操作IDで二重実行を防ぎ、応答が失われたら完了記録を照会する。往復（個人→職員→個人）で同じ会員IDの行に戻る | `docs/316`・`docs/317`、`test:officer-person` 57 |
| 往復の入会日（operator 決定 A） | 入会日は戻した日（年度の在籍判定に使うため）。上書き前の入会日と元の行の入会日を `T_人物統合ログ.詳細JSON.joinedDates` に残す | `docs/316` §2-6 |
| 会員IDの生成 | 1 始まりの 8 桁（10000000〜99999999）。以前は約 1 割が 0 始まりで、保存時に先頭の 0 が消えた。既存の 8 桁未満の 30 件は食い違い 0 件のためそのまま（operator 決定） | `docs/317` §9.3・§10.4 |
| 診断 | `describeDatabaseState_LOG` に `shortMemberIds`（件数のみ） | `test:db-state` |
| `docs/307` のローカル修正 | F24（名簿の取消行の取消日時・備考）・F44（活動報告の数量）・F45（削除の完了文）・F47（入会申込の確認画面に建物名）・F50（取得失敗時の再読み込み）・F53（LINE 投稿一覧の打切りの案内）・F54（印刷の件数表示）・F57・F58（操作できない理由の表示）・E7・S45（研修申込の確認メールの送信結果）・S33（職員上限の判定の共通化）・移行時の人物参照 | `docs/307` §2026-10-29 の検証整理 |
| テスト | 公開 responsive の要約が廃止済みの `noticeDialog` を見て常に ❌ だったのを `noticeStep` に直した（詳細の判定は以前から正しい） | `scripts/responsive-test.mjs` |

## 2. リリース前の確認

| 項目 | 結果 |
|---|---|
| 4 段階ビルド | 成功（`test:gas-build-sync` 合格） |
| 全ゲート | `npm run prerelease` exit 0（HEAD `b813181d`） |
| 隔離 E2E（実 GAS・一時スプレッドシート） | `e2eMemberConversionIsolated_APPLY` 20/20 合格（HEAD `2eab0ad8`・operator 承認） |
| スキーマ・認証 | `DB_SCHEMA_VERSION` とテーブル定義の差 0。パスワード・pepper まわりの変更なし |

## 3. デプロイ後の確認

| 項目 | 結果 |
|---|---|
| fixed deployment 4 本 | @449×2 / @207 / @306 へ redeploy（`release:verify` で確認） |
| 公開 a11y | 違反 0（critical / serious / moderate / minor すべて 0） |
| 公開 responsive | 7 VP × 3 画面すべて合格（横スクロール 0） |
| 管理画面の初回表示（MCP・デプロイ直後） | 15.9 秒・再試行の帯なし・console エラー 0 |
| 管理の読み取り API（MCP） | `getAdminDashboardData`・`getAdminInitData`・`getAdminPersonList`・`getOfficerManagementData`・`getAnnualFeeAdminData`・`getAdminChangeRequests` の 6 本とも success（3.9〜6.5 秒） |
| `test:responsive:admin` | **56/56 合格**（7 VP × 8 画面・横スクロール 0・24px 未満 0・はみ出し 0。2026-11-01 operator の再ログイン後） |
| 会員ポータルのログイン画面 | デプロイ直後の初回 88 秒、その後 4.7 秒・3.1 秒（初回だけ遅い既知の現象・`docs/302` §2） |

## 4. 未検証（完了に混ぜない）

- **会員移行の本番 DB での実行**（`docs/317` §10.2 S）。★テストデータで行い、作成と物理削除は毎回 operator 承認（`/dbops`）。
- 移行画面の「結果を確認できませんでした」表示の実ブラウザ確認。
- `docs/307` 修正分の本番画面での確認（F57・F58 ほか、各項目の「本番画面は未確認」）。
