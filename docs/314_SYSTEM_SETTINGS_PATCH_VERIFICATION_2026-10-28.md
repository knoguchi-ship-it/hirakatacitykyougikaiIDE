# システム設定の差分保存と clasp run 切り分け設計

作成: 2026-10-28

## 1. 目的

管理画面のシステム設定は項目数とメール本文を含むため、設定全体を JSON にして
Windows の `clasp run --params` へ渡すと、コマンド行の長さ上限や JSON の引用符解釈で失敗する。
この文書は、その制約を理由に設定検証を諦めず、次の2つを両立させる設計の正本である。

1. 画面保存では変更された設定だけを送って、不要な全量上書きと巨大なパラメータをなくす。
2. ローカル検証後にだけ使う、機能群別・無書込みの `clasp run` 診断を用意する。

設定値、メール本文、送信元、token その他の秘密値を fixture・ログ・戻り値へ含めない。

## 2. 範囲と非範囲

### 範囲

- `updateSystemSettings_` の差分保存
- `checkSystemSettingsPatch` の無書込み検証
- `core` / `publicPortal` / `mail` / `chat` の4機能群fixture
- JSONサイズ以外の回帰失敗を修正した後の本番検証条件

### 非範囲

- 楽観ロック、設定履歴、競合自動解決
- 全設定JSONを `clasp run` で送る経路の復旧
- 設定値を返す診断API
- operator 承認なしの本番deploy、DB更新、書込み試験

同じ設定キーを2人が同時に保存したときは後勝ちとする。異なるキーは差分保存により互いに上書きしない。

## 3. 保存の契約

### 3.1 クライアント

1. 設定取得直後の値を基準値として保持する。
2. 保存時に候補値と基準値を比較し、差分キーだけを `updateSystemSettings` に送る。
3. 保存成功時だけ、サーバーの返却値を新しい基準値に置く。

### 3.2 サーバー

1. 受信したキーだけを更新候補とする。
2. 未送信キーは現在の設定値で検証するが、更新候補へ入れない。
3. すべての入力・参照・権限を検証してから、ロックの中で一括書込みする。
4. 検証できない、必須文字列が空、選択IDが不存在・削除済み・用途不一致の場合は fail-closed で拒否し、書込みゼロにする。

メール件名・本文を含む必須の文面は、初期データ投入時以外は既定文面で補わない。保存時、読取り時、送信時のいずれも空欄を止める。

## 4. 無書込み診断action

`checkSystemSettingsPatch` は管理者専用の診断actionである。

| 項目 | 契約 |
|---|---|
| 呼出権限 | `MASTER` / `ADMIN` |
| 入力 | `{ suite: "core" }` のように機能群名だけ |
| 処理 | 現在値を同じ検証経路へ `__dryRun: true` として通す |
| 書込み | 禁止。`writes` は常に `0` |
| 戻り値 | suite名、妥当性、検証件数、予定件数、書込み件数のみ |
| 戻さないもの | 設定値、メール本文、送信元、認証情報、token |

診断actionは、書込みactionを代用するものではない。fixtureランナーは `checkSystemSettingsPatch` 以外のactionを拒否し、`success=true`、`valid=true`、`writes=0` のすべてを満たしたときだけ成功とする。

## 5. fixture

| suite | 対象 | ファイル |
|---|---|---|
| `core` | 基本設定、年会費、フォルダ、研修履歴など | `test-fixtures/clasp-system-settings/core.json` |
| `publicPortal` | 公開ポータルと入会完了画面の設定 | `test-fixtures/clasp-system-settings/public-portal.json` |
| `mail` | メール有効状態、件名・本文、送信制御など | `test-fixtures/clasp-system-settings/mail.json` |
| `chat` | Google Chat通知の設定 | `test-fixtures/clasp-system-settings/chat.json` |

実行は `npm run test:clasp-settings-fixtures`、一群に絞るときは `npm run test:clasp-settings-fixtures -- mail` とする。ランナーは `gas/admin/` を作業ディレクトリにして、ローカルの `@google/clasp` JavaScript entrypoint をNodeから直接起動し、`processApiRequest` を呼ぶ。`npx.cmd` / `cmd.exe` を経由しないため、WindowsでもJSONの二重引用符を失わない。

fixtureはGit管理できるが、機能群名と期待する真偽・書込みゼロだけを置く。実値・秘密値・テスト用ID/PW・セッション情報は置かない。

## 6. fixtureを使う条件

通常の `prerelease` には含めない。次のすべてを満たす場合だけに使う。

1. 変更に対応するローカルテスト、生成物同期テスト、`npm run prerelease` が成功している。
2. 全設定JSONを使う通常の `clasp run` 確認が、Windowsの引数長、引用符崩れ、またはExecution API経路の問題で失敗・実行不能になった。
3. その失敗を回避するために、設定値をログへ出したり巨大なJSONを再送したりしない。

| 結果 | 判定 | 次の行動 |
|---|---|---|
| 全fixture成功 | 機能群ごとのサーバー検証は成功。巨大JSONのWindows運搬が原因 | 設定値を変えず、Windows経路の制約として記録 |
| 一部fixture失敗 | 対象群のサーバー検証・認可・Execution APIが未確認 | suiteとエラー種別だけで調査。設定値を出力しない |
| 認証・実行基盤の失敗 | アプリの妥当性を判定できない | 認証または実行環境を復旧して再実行。成功扱いにしない |

`clasp run` は読取り・dry-runでもoperator確認の対象である。実行前に既存の承認手順へ従う。

## 7. JSONサイズ以外の回帰失敗を修正した後の本番検証

以前に通っていたローカル回帰テストが、WindowsのJSON引数長以外の理由で失敗した場合、ローカル修正だけでは完了にしない。以下をリリース完了条件とする。

1. 原因を実装、生成物、テストハーネス、環境に分類して記録する。
2. 修正後、失敗したテスト・関連テスト・生成物同期テスト・`npm run prerelease` を成功させる。
3. operator承認を得て通常のリリース手順で対象コードを本番へ反映する。
4. 影響した本番機能を必ず検証する。
   - 既定は読取りまたはdry-runである。
   - 設定保存経路は、必要に応じて該当fixtureを使い `writes=0` を確認する。
   - 実際の書込みでしか確認できないときは、`/dbops` の手順に従い、operator承認、前後スナップショット、★テストデータ、物理削除による後片付けを行う。
5. 本番検証を実施できない場合は、`HANDOVER.md` とリリース記録に「未検証」と残す。修正完了・リリース完了とは記載しない。

この要件は、Windowsの巨大JSON制約の有無にかかわらず、回帰失敗を直して本番へ反映するすべての設定変更へ適用する。

## 8. 関連文書

- 設定の空欄禁止と定型文の設計: `docs/313_SCREEN_TEXT_TEMPLATES_2026-10-25.md` §4.2
- リリース・承認・fixed deployment: `docs/09_DEPLOYMENT_POLICY.md`
- 本番DB書込みを伴う確認: Skill `/dbops`
- 現在の未完了状態: `HANDOVER.md`

## 9. 現在の導入状態

この設計は未リリースである。2026-10-28時点で、次をローカルで復旧した。

- `test:screen-text-templates` 14/14 PASS
- `test:gas-build-sync` 4/4 PASS（公開・会員・管理の生成物を正本から再生成）
- `test:feature-inventory` 4/4 PASS（`docs/288` を再生成）
- `test:action-dispatch` 4/4 PASS、`test:docs-single-source` PASS、`git diff --check` PASS
- fixtureランナーを、Windowsの `cmd.exe` / `npx.cmd` を通さずローカルclasp entrypointをNodeから直接起動する方式へ修正

本番へ4 fixtureを無書込みで実行した結果は、すべて `UNSUPPORTED_ACTION` だった。これは現行本番に
`checkSystemSettingsPatch` がまだ未リリースであることを示す期待どおりの事前結果であり、設定は変更していない。

**確認済み（2026-10-28）:** `npm run build`、`npm run build:gas`、`npm run build:gas:member`、`npm run build:gas:admin` の後に、生成物同期・関連回帰テストと `npm run prerelease` を exit 0 まで完走した。

**未検証:** operator承認を得たリリース後の本番 fixture。4 fixtureすべてで `FIXTURE_OK` と `writes=0` を確認して初めて導入完了とする。
