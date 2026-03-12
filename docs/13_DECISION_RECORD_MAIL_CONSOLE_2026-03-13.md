# メール送信機能・管理コンソール連携 方針決定記録（2026-03-13）

## 1. 決定事項

1. 研修管理コンソールに、研修申込者（会員・非会員統合）への **一斉・個別メール送信機能** を追加する。
2. メール送信 API を `MailApp.sendEmail` から **`GmailApp.sendEmail`** に変更する（管理コンソール メール送信機能のみ。既存リマインダーは `MailApp` 維持）。
3. 送信元はスクリプトオーナー（k.noguchi@uguisunosato.or.jp）のアドレスまたは Gmail エイリアスとし、**Reply-To にログイン中管理者のメールアドレス**を自動設定する。
4. 会員管理コンソールと研修管理コンソールは **双方向ナビゲーション** で相互遷移可能とする。
5. `T_管理者Googleホワイトリスト` に登録されたアカウントは両コンソールに同一権限でアクセスできるルールとする。

---

## 2. 設計上の理由

### GmailApp 採用理由
- `MailApp.sendEmail` はエイリアス送信（`from` 指定）を**サポートしない**。
- `GmailApp.sendEmail` の `from` オプションは Gmail 設定済みエイリアスに対して有効（公式ドキュメント確認済み）。
- 既存リマインダー（`MailApp`）との**共存は可能**であり、影響範囲を最小化するため新機能のみ GmailApp を採用。

### MailApp との共存における注意事項
- `MailApp` と `GmailApp` はそれぞれ異なる OAuth スコープを要求する。`appsscript.json` の `oauthScopes` に `gmail.send` を追記し、両スコープを明示すること。
- スコープ追加後の初回デプロイ時に権限許可ダイアログが表示される（k.noguchi での承認が必要）。
- エラーハンドリングは両 API で統一し、ロジックの分散を避ける。既存リマインダーのエラー処理パターンに準拠すること。

### Reply-To 方式採用理由（「ログイン者アドレスから送信」の代替）
- GAS の実行モデル（`Execute as: Me`）上、`GmailApp` は常にスクリプトオーナーの Gmail として動作する。
- ログイン中管理者のアドレスを `from` に使うには `Execute as: User` への変更が必要となり、スプレッドシートアクセス権限・`checkAdminBySession_()` の動作に影響が及ぶため採用しない。
- `replyTo` に `Session.getActiveUser().getEmail()`（ログイン中管理者のメール）を設定する方式であれば、**受信者の返信は必ずログイン中管理者に届く**。業務メールとして許容範囲。
- 同一 Workspace ドメイン内では `Session.getActiveUser().getEmail()` が正しく返ることを確認済み（現行 `checkAdminBySession_()` が依存する仕組みと同一）。

### 双方向ナビゲーション設計理由
- 管理者は会員情報確認と研修管理を行き来する業務フローが想定される。
- 認証は `checkAdminBySession_()` で統一されており、追加の認証機構は不要。
- 「一度認証済みのセッションで両コンソールを使える」ことは UX 上の必然かつセキュリティ上も問題なし。

---

## 3. メール送信機能 仕様詳細

### 3.1 送信フロー
```
管理コンソール > 研修管理 > 研修を選択
  └─ 申込者一覧（会員＋非会員 統合表示）
       └─ メール送信画面
            ├─ 送信対象: 全員 / 個別チェック選択 / 個別除外
            ├─ 送信元: スクリプトオーナーのアドレス or Gmail エイリアス
            │    （GmailApp.getAliases() で選択肢を動的取得）
            ├─ Reply-To: ログイン中管理者のメール（自動・変更不可）
            ├─ 件名: 自由記述（{{氏名}} {{事業所名}} タグ使用可）
            ├─ 本文: 自由記述（{{氏名}} {{事業所名}} タグ使用可）
            ├─ 添付①: 共通ファイル（全対象に同一ファイルを添付）
            ├─ 添付②: 個別自動添付
            │    └─ Drive 指定フォルダ内のファイル名（拡張子除く）= 申込者氏名 で自動マッチング
            │         （管理画面で都度フォルダを指定）
            │         ※ 対象フォルダは k.noguchi@uguisunosato.or.jp が閲覧・編集権を持つこと
            ├─ プレビュー確認（タグ置換後の実際の送信内容を表示）
            └─ 送信実行
```

### 3.2 差し込みタグ仕様
| タグ | 置換内容 | 会員の場合 | 非会員の場合 |
|------|----------|------------|--------------|
| `{{氏名}}` | 申込者の氏名 | `T_会員.氏名` | `T_外部申込者.氏名` |
| `{{事業所名}}` | 申込者の事業所名 | `T_事業所.事業所名` | `T_外部申込者.事業所名` |

### 3.3 申込者一覧 表示項目（メール送信画面内）
| 列 | 内容 |
|----|------|
| 選択 | チェックボックス（送信対象・除外の切替） |
| 氏名 | 会員名 or 非会員入力氏名 |
| 事業所名 | 会員事業所名 or 非会員入力事業所名 |
| 区分 | 会員 / 非会員 |
| メールアドレス | 送信先確認用（表示のみ） |
| 個別添付 | 自動マッチングファイルの有無（あり / なし） |

---

## 4. 管理コンソール連携 仕様詳細

### アクセス経路
```
会員管理コンソール  ⇄  研修管理コンソール（双方向・再認証不要）
```

### 権限ルール
- `T_管理者Googleホワイトリスト` に `有効フラグ=true` で登録されたアカウント = 両コンソールアクセス可
- 会員ログイン（ID/PW）のみのアカウント = コンソールナビゲーションリンク非表示
- 認証判定は両コンソール共通で `checkAdminBySession_()` を使用

---

## 5. 実装時の同時整合性要件（RULEBOOK §3）

以下を**同一変更セット**で実装すること：

- `backend/Code.gs`
  - `getAdminEmailAliases_()` 新規追加
  - `sendTrainingMail_(payload)` 新規追加（`GmailApp.sendEmail` 使用）
  - `processApiRequest` に `getAdminEmailAliases`・`sendTrainingMail` ルーティング追加
- `backend/appsscript.json`
  - `oauthScopes` に `https://www.googleapis.com/auth/gmail.send` 追加
- フロントエンド（研修管理コンソール）
  - メール送信画面コンポーネント新設
  - 申込者一覧コンポーネントにメール送信ボタン追加
  - 両コンソール間ナビゲーションリンク追加

---

## 6. 受け入れ指標（DoD）

1. 研修管理コンソールで研修を選択すると、その研修の申込者（会員・非会員統合）一覧が表示される。
2. 申込者を全員・個別選択・個別除外の3パターンで送信対象を制御できる。
3. 送信元アドレスの選択肢にスクリプトオーナーのエイリアスが表示される。
4. 件名・本文の `{{氏名}}` `{{事業所名}}` が各申込者のデータで正しく置換されて送信される。
5. 共通添付ファイルが全送信対象に添付される。
6. Drive 指定フォルダ内のファイルが申込者氏名と一致した場合のみ個別添付される。
7. 送信前プレビューで置換後の内容が確認できる。
8. 送信メールの Reply-To にログイン中管理者のメールアドレスが設定される。
9. 会員管理コンソールから研修管理コンソールへ、その逆方向にも再認証なしで遷移できる。
10. 会員ログインのみのアカウントにはコンソール間ナビゲーションリンクが表示されない。

---

## 7. 参照した一次情報

1. [Class GmailApp | Apps Script | Google for Developers](https://developers.google.com/apps-script/reference/gmail/gmail-app)
2. [Class Session | Apps Script | Google for Developers](https://developers.google.com/apps-script/reference/base/session)
3. [Execute web app with Gmail access as user who executes the script](https://discuss.google.dev/t/execute-web-app-with-gmail-access-as-user-who-executes-the-script/96732)（Execute as: Me の制約確認）
4. [Get List of Email Aliases with Gmail API](https://www.labnol.org/code/20295-gmail-api-email-aliases)（GmailApp.getAliases() の動作確認）
