# メール設定整理 テスト計画（v376.60）

## 目的

自動通知の停止・宛先・送信元・テンプレート読込が、設定画面の表示と実際の送信経路で一致することを確認する。メール本文、メールアドレス、認証情報はテスト記録に出力しない。

## 対象仕様

- `false`（Boolean / 文字列）の通知設定は送信停止として扱う。
- 事業所入会申込の受付・承認・却下通知は、`REPRESENTATIVE` のメールアドレスだけを宛先にする。
- 自動通知は共通の送信元設定を使い、一括メールの送信元選択を上書きしない。
- 指定済み送信元が利用できない場合、実行者のアドレスへ黙って切り替えない。
- 通知をOFFにした状態でも、テンプレートの一覧・読込・編集に到達できる。
- テンプレートを読み込んだ後、画面下部の「設定を保存」で実際の通知設定に適用する。

## 自動テスト表

| ID | 確認内容 | 自動化 | 合格基準 |
|---|---|---|---|
| U-01 | Boolean `false` の読込 | `test:mail-settings` | `false` を空欄・既定ONへ変換しない |
| U-02 | 受付・承認・却下の停止 | `test:application-receipt` | Boolean / 文字列 `false` で停止 |
| U-03 | 自動通知の共通送信元 | `test:mail-settings` | 自動カテゴリだけに適用、一括メールは除外 |
| D-01 | テンプレート表と設定値の実DB監査 | `dryRunMailSettingsV376_60_LOG` | 本文・宛先を出力せず、表の可読性とカテゴリ件数を確認 |
| D-02 | 受付通知の宛先・停止 | `dryRunApplicationReceiptRoutingV376_59_LOG` | 代表者固定、送信・書込なし |
| E2E-01〜05 | 管理画面のメール通知設定 | `test:mail-settings:e2e` | OFF時編集導線、テンプレート管理、共通送信元表示 |
| R-01 | 公開アクセシビリティ回帰 | `test:a11y` | axe 違反 0 |
| R-02 | 公開レスポンシブ回帰 | `test:responsive` | 7 viewport 合格 |
| R-03 | 管理画面レスポンシブ回帰 | `test:responsive:admin` | 7 viewport 合格 |

## 実施順序

1. `npm run prerelease` と3 split build を実行する。
2. fixed deployment 4本を同一の新versionへ同期する。
3. admin project で2つのdryRunを実行する。どちらもメール送信・DB書込をしない。
4. Playwright E2E、公開 a11y / responsive、管理 responsive を実行する。
5. `npm run report:tests` を実行し、HTML記録を更新する。

## HTML記録

実行結果は [test-report.html](portal/test-report.html) に保存する。Playwrightの生データはローカルの `output/playwright/` に置き、認証情報・本文・メールアドレスは記録しない。
