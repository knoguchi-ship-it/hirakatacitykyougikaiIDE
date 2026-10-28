# v376.138 リリース記録（2026-10-28）

本書は v376.138 のリリース候補の記録である。fixed deployment の実 version、デプロイ時刻、
本番検証の結果は同期後に追記する。スキーマ版は
`2026-10-25-screen-text-templates-v376.135` のまま、表・列の変更は無い。

## 1. 中身

| 項目 | 内容 | 再発防止・正本 |
|---|---|---|
| 設定の差分保存 | 管理画面は読み込み時の基準値との差分だけを送る。異なる設定キーの同時編集は互いを上書きせず、同じキーは operator 決定どおり後勝ち | `docs/313` §4.1〜§4.2、`test:screen-text-templates` |
| メール文面 | 件名・本文は空欄で保存できない。読取り・送信時もコード内の既定文面で補わず、設定不備なら送信を止める | `docs/307` D1、`test:mailrender` |
| 無書込み診断 | 管理専用の `checkSystemSettingsPatch` が現在の設定を機能群ごとに同じ検証経路へ通す。設定値を返さず、書込みは常に 0 | `docs/314`、`test:action-dispatch` |
| Windows fixture | fixture ランナーは Node からローカル clasp entrypoint を起動し、cmd.exe の JSON 引用符崩れを避ける。書込み action は受理しない | `docs/314` |
| 公開ポータル | プライバシーポリシーへのリンクに 24px 以上のタップ領域を付与 | `test:privacy-policy-link` |

## 2. リリース前の確認

| 項目 | 結果 |
|---|---|
| 4 段階ビルド | `npm run build` / `build:gas` / `build:gas:member` / `build:gas:admin` 成功 |
| 生成物・配線 | `test:gas-build-sync` 4/4、`test:action-dispatch` 4/4、`test:feature-inventory` 4/4 |
| 設定の回帰 | `test:screen-text-templates` 14/14、`test:mailrender` 成功 |
| 全ゲート | `npm run prerelease` exit 0 |
| 差分・文書 | `git diff --check` と `test:docs-single-source` 成功 |
| 現行 fixed deployment | v376.137（public @447×2 / member @205 / admin @304）を 3 project の個別読み取りで確認 |

## 3. デプロイ後の確認（未実施）

- 3 project の push → version → fixed deployment 4 本同期を記録する。
- `npm run test:clasp-settings-fixtures` は、4 fixture すべて `FIXTURE_OK` かつ `writes=0` を確認する。
- 公開ポータルの a11y / responsive を実行する。
- 管理・会員の書込み経路は、認証済み状態を用意できる場合に E2E を実行する。用意できない場合は未検証として明記する。
- 実際の設定保存を確認する必要が生じた場合は `/dbops` の承認・前後差分・★テストデータ・物理削除の手順に従う。

## 4. ロールバック

ロールバック先は v376.137（public @447×2 / member @205 / admin @304）。スキーマは同じで、
事前処理は不要。ただし v376.134 以前へ戻すと `T_画面文テンプレート` を失うため使わない。
