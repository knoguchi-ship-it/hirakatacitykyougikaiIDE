# 決定記録（Decision Records）

> 個別ファイルに分かれていた 5 件の決定記録を 1 本に統合した（2026-09-02）。
> 原本は `docs/archive/historical/` に同名で保存してある。以降の決定はこのファイルに追記する。

| # | 決定 | 日付 | 原本ファイル |
|---|---|---|---|
| 1 | 認証方式 | 2026-02-28 | `06_DECISION_RECORD_AUTH_2026-02-28.md` |
| 2 | 公開ポータル | 2026-03-13 | `07_DECISION_RECORD_PUBLIC_PORTAL_2026-03-13.md` |
| 3 | メールコンソール | 2026-03-13 | `13_DECISION_RECORD_MAIL_CONSOLE_2026-03-13.md` |
| 4 | 年会費コンソール | 2026-03-15 | `18_DECISION_RECORD_ANNUAL_FEE_CONSOLE_2026-03-15.md` |
| 5 | 公開ポータル入会申込の統合 | 2026-03-17 | `19_DECISION_RECORD_PUBLIC_PORTAL_APPLICATION_INTEGRATION_2026-03-17.md` |

---

## GCP 移行の一旦中断と「GCP 移植可能性ゲート」（2026-09-03）

### 1. 決定事項

1. **GCP 移行作業を一旦中断**し、当面の新規仕様は本番リポジトリ（GAS）側で実装する。
2. 移行は**破棄ではなく再開前提**。したがって、これ以降に実装する仕様は
   **「GCP の確定構成（Firestore / Firebase Hosting / Firebase Auth / Cloud Run / Cloud Storage / Cloud Scheduler）でも同等に実装できること」を必須要件**とする。
3. **GAS では実現できるが GCP へ移行できない仕様は採用しない（NG）。** その形でしか要件を満たせない場合は実装前に停止し、
   代替設計を提示して operator の判断を仰ぐ。
4. 本指針は**本番リポジトリと GCP 作業場の両方に適用**する。正本は `AGENTS.md` §4.8、同期コピーを GCP 作業場 `AGENTS.md` §1-B に置く。

### 2. 設計上の理由

- 移行対象（`docs/250` §6.1）の未移行 write は現時点で 66 method ある。ここに「GCP で再現できない機能」を 1 つでも足すと、
  Phase 5（DB 移行）・Phase 6（切替）で**二重実装か機能削除の二択**を迫られる。実装前の確認が最も安いタイミングになる。
- 中断は「移行の放棄」と誤解されやすい。ゲートを明文化することで、中断中に積み上がる仕様が移行の妨げにならないようにする。
- 逆に、GCP 側で先に作るべき機能（大型の新規 write など）はこのゲートの検討過程で早期に判別できる（`AGENTS.md` §4.7）。

### 3. 判断基準（要約・詳細は `AGENTS.md` §4.8.2 / §4.8.3）

- **OK**: Firestore のドキュメントで表現できるデータ、REST で呼べる API、3 境界の認証、Cloud Storage に置ける添付、
  Cloud Scheduler + Cloud Run Job に載る定期処理、Firestore トランザクションで足りる排他制御。
- **NG**: シート数式・QUERY を機能の一部にする／行番号・A1 参照を業務キーにする／Drive 固有機能（`thumbnailLink`・Docs 差し込み）依存／
  `google.script.run` を UI から直接呼ぶ／Apps Script 固有 UI を業務フローに組み込む／シート直編集前提の運用／
  6 分制限前提の長時間バッチ／Script Properties を業務データの保存先にする。

### 4. 運用

- 仕様検討時に「GCP では何で実装するか」を 1 行で書けることを設計完了の条件とする。
- リリース時は release state 文書に「GCP 移植メモ」を残す。
- 既存機能は遡及適用しないが、改修時に NG パターンへ寄せてはならない。

---

## 認証方式（2026-02-28）

> 原本: `docs/archive/historical/06_DECISION_RECORD_AUTH_2026-02-28.md`（元タイトル: 認証/権限制御 方針決定記録（2026-02-28））

### 1. 決定事項
1. 会員ログインは `ログインID + パスワード` を採用する。
2. 管理者ログインは Google アカウント認証 + ホワイトリスト照合を採用する。
3. 管理者は `管理者ページ` と `会員マイページ` の両方を利用可能とする。
4. 年会費未納時は振込先口座情報を表示する。引き落とし機能は持たない。
5. 受付中研修は詳細本文と案内PDFを表示可能にする。

### 2. 設計上の理由
1. 認証方式を分離することで、会員向け運用（ID/PW）と管理者向け運用（Google）を明確化できる。
2. 管理者をGoogle主体で認証しつつ、業務データ側は会員IDに紐付けることで監査性を担保できる。
3. 未納時のみ振込先表示にすることで、誤解を生む「引き落とし」導線を排除できる。

### 3. 受け入れ指標（運用KPI）
1. 認証拒否率: ホワイトリスト外Googleアカウントの管理者ログイン成功率 0%。
2. 認証成功率: 正常な会員ID/PW入力時の成功率 99.9%以上（障害時除外）。
3. 権限表示: 管理者ログイン時のみ左メニューに `管理者ページ` が表示される。
4. 紐付け整合: 管理者ログインセッションの100%で `認証ID` と `会員ID` が取得できる。
5. 会費UI: 未納時のみ振込先口座が表示される（納入済では非表示）。
6. 研修UI: 受付中研修で詳細本文とPDFリンクが表示される。

### 4. 参照した一次情報
1. Google Identity: IDトークン検証要件（`aud` `iss` `exp` `hd`）
   - https://developers.google.com/identity/gsi/web/guides/verify-google-id-token
   - https://developers.google.com/identity/sign-in/web/backend-auth
2. Apps Script Web App 実行権限と実行主体
   - https://developers.google.com/apps-script/guides/web
   - https://developers.google.com/apps-script/manifest/web-app-api-executable
3. Apps Script Session 制約（メール取得が空になる条件）
   - https://developers.google.com/apps-script/reference/base/session
4. パスワード保管ベストプラクティス
   - https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html

---

## 公開ポータル（2026-03-13）

> 原本: `docs/archive/historical/07_DECISION_RECORD_PUBLIC_PORTAL_2026-03-13.md`（元タイトル: 公開ポータル追加 方針決定記録（2026-03-13））

### 1. 決定事項

1. 同一 GAS プロジェクト内に公開ポータル（非会員向け）を追加する。
2. 研修登録フォームは `src/shared/TrainingForm.tsx` として単一コンポーネント化し、両ポータルで共有する。
3. 非会員申込データは `T_外部申込者`（新設）に保管し、`T_研修申込` のポリモーフィック設計（`申込者区分コード` + `申込者ID`）で会員申込と統合管理する。
4. 定員は会員・非会員の申込を合算で管理する。
5. 管理者の研修登録は両ポータルから可能とし、認証は `checkAdminBySession_()` で統一する。
6. 公開フォームは個人情報保護法・医療介護関係事業者ガイダンス（2025年6月改正）に準拠する。

### 2. 設計上の理由

#### 同一 GAS を選択した理由
- DB（Spreadsheet）を共有するため、別 GAS にしても実質的な分離メリットがない。
- `checkAdminBySession_()` は GAS のセッション機構に依存するため、同一 GAS が信頼性上有利。
- 固定 Deployment ID 運用ルール（`docs/09_DEPLOYMENT_POLICY.md`）を維持できる。
- clasp・Deployment の管理対象を増やさない。
- 根拠調査：Vite multi-entrypoint + vite-plugin-singlefile の動作を調査エージェントで確認済み（2026-03-13）。

#### ポリモーフィック DB 設計を選択した理由
- NULL 列を持たない設計により、申込者数カウント・リマインダー送信ロジックを `申込者区分コード` での分岐のみで統一できる。
- 別テーブル方式（`T_会員申込` / `T_外部申込`）では GAS での集計コストが高い。
- 根拠：Background agent による DB 設計調査（2026-03-13）でポリモーフィック方式を推奨と確認。

#### 共有コンポーネント方式の根拠
- `src/shared/` + `@shared` エイリアスは Vite プロジェクトにおける標準的な共有設計。
- 追加ツールチェーン（Turborepo/nx 等）不要でプロジェクト規模に適合。
- 構造的に TrainingForm の乖離が不可能になる（両ポータルが同一ファイルを import）。

### 3. 個人情報保護法対応の決定内容

| 要件 | 実装方針 | 根拠 |
|------|----------|------|
| 利用目的の明示 | フォームに収集目的を日本語で明記 | APPI 第17条 |
| 同意チェックボックス | 送信ボタン前に必須配置 | APPI 第17・18条 |
| 保管期間 | 研修終了日の翌年4月1日に `削除フラグ=true` を自動適用 | APPI 第19条 |
| 同意日時の記録 | `T_外部申込者.同意日時` に保存 | 介護ガイダンス準拠 |
| 第三者提供禁止 | 外部提供なし。システム内のみ | APPI 第27条 |

### 4. スコープ変更

- `docs/archive/spec_history/10_SOW.md` §1 に公開ポータル追加を記載済み（2026-03-12）。
- 本決定記録が追加仕様の一次ソースとなる。

### 5. 実装時の同時整合性要件（RULEBOOK §3）

以下を**同一変更セット**で実装すること：

- `backend/Code.gs`
  - `マスタ定義` に `M_申込者区分` 追加
  - `テーブル定義` に `T_外部申込者` 追加・`T_研修申込` 変更（`申込者区分コード`・`申込者ID` 追加）
  - `マスタ初期値` に `M_申込者区分` 初期値追加
  - 新 API 関数：`getPublicTrainings_()`・`applyTrainingExternal_()`・`cancelTrainingExternal_()`・`getTrainingApplicants_()`
  - `doGet()` に公開ポータルルーティング追加
- `src/shared/types.ts`（`types.ts` から移動）
  - `ExternalApplicant` 型追加
  - `Training申込` 型の `applicantType` フィールド追加
- `src/shared/TrainingForm.tsx`（`components/TrainingManagement.tsx` から切り出し）
- `vite.config.ts` マルチエントリポイント設定
- `tsconfig.json` の `paths` に `@shared` 追加
- `index_public.html` 新設
- `src/public-portal/` 新設
- `rebuildDatabaseSchema()` 実行（本番 Spreadsheet へのスキーマ反映）

### 6. 受け入れ指標（DoD）

1. 公開ポータル（`?app=public`）で受付中研修一覧が認証なしで表示される。
2. 非会員が氏名・メール・電話番号・事業所名を入力して申込できる。
3. 申込確認メールが登録メールアドレスへ送信される。
4. 管理者が両ポータルから研修登録フォームを操作できる（同一 UI）。
5. 管理画面の申込一覧に会員・非会員が統合表示される。
6. 定員は会員・非会員の合算で管理される（超過時は申込不可）。
7. Honeypot フィールド入力がある申込はサーバー側で拒否される。
8. 個人情報の取り扱い同意チェックなしでは送信できない。プライバシーポリシーの正本は本サイト別建てとする。

### 7. 参照した一次情報

1. Vite multi-entrypoint + vite-plugin-singlefile 動作確認（Background agent, 2026-03-13）
2. 個人情報保護法ガイドラインQ&A：https://www.ppc.go.jp/personalinfo/faq/APPI_QA/
3. 医療・介護関係事業者ガイダンス（2025年6月改正）：https://www.ppc.go.jp/personalinfo/legal/iryoukaigo_guidance/
4. OWASP Input Validation Cheat Sheet：https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html
5. GAS multi-page serving セキュリティ考慮事項（Background agent, 2026-03-13）

---

## メールコンソール（2026-03-13）

> 原本: `docs/archive/historical/13_DECISION_RECORD_MAIL_CONSOLE_2026-03-13.md`（元タイトル: メール送信機能・管理コンソール連携 方針決定記録（2026-03-13））

### 1. 決定事項

1. 研修管理コンソールに、研修申込者（会員・非会員統合）への **一斉・個別メール送信機能** を追加する。
2. メール送信 API を `MailApp.sendEmail` から **`GmailApp.sendEmail`** に変更する（管理コンソール メール送信機能のみ。既存リマインダーは `MailApp` 維持）。
3. 送信元はスクリプトオーナー（k.noguchi@uguisunosato.or.jp）のアドレスまたは Gmail エイリアスとし、**Reply-To にログイン中管理者のメールアドレス**を自動設定する。
4. 会員管理コンソールと研修管理コンソールは **双方向ナビゲーション** で相互遷移可能とする。
5. `T_管理者Googleホワイトリスト` に登録されたアカウントは両コンソールに同一権限でアクセスできるルールとする。

---

### 2. 設計上の理由

#### GmailApp 採用理由
- `MailApp.sendEmail` はエイリアス送信（`from` 指定）を**サポートしない**。
- `GmailApp.sendEmail` の `from` オプションは Gmail 設定済みエイリアスに対して有効（公式ドキュメント確認済み）。
- 既存リマインダー（`MailApp`）との**共存は可能**であり、影響範囲を最小化するため新機能のみ GmailApp を採用。

#### MailApp との共存における注意事項
- `MailApp` と `GmailApp` はそれぞれ異なる OAuth スコープを要求する。`appsscript.json` の `oauthScopes` に `gmail.send` を追記し、両スコープを明示すること。
- スコープ追加後の初回デプロイ時に権限許可ダイアログが表示される（k.noguchi での承認が必要）。
- エラーハンドリングは両 API で統一し、ロジックの分散を避ける。既存リマインダーのエラー処理パターンに準拠すること。

#### Reply-To 方式採用理由（「ログイン者アドレスから送信」の代替）
- GAS の実行モデル（`Execute as: Me`）上、`GmailApp` は常にスクリプトオーナーの Gmail として動作する。
- ログイン中管理者のアドレスを `from` に使うには `Execute as: User` への変更が必要となり、スプレッドシートアクセス権限・`checkAdminBySession_()` の動作に影響が及ぶため採用しない。
- `replyTo` に `Session.getActiveUser().getEmail()`（ログイン中管理者のメール）を設定する方式であれば、**受信者の返信は必ずログイン中管理者に届く**。業務メールとして許容範囲。
- 同一 Workspace ドメイン内では `Session.getActiveUser().getEmail()` が正しく返ることを確認済み（現行 `checkAdminBySession_()` が依存する仕組みと同一）。

#### 双方向ナビゲーション設計理由
- 管理者は会員情報確認と研修管理を行き来する業務フローが想定される。
- 認証は `checkAdminBySession_()` で統一されており、追加の認証機構は不要。
- 「一度認証済みのセッションで両コンソールを使える」ことは UX 上の必然かつセキュリティ上も問題なし。

---

### 3. メール送信機能 仕様詳細

#### 3.1 送信フロー
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

#### 3.2 差し込みタグ仕様
| タグ | 置換内容 | 会員の場合 | 非会員の場合 |
|------|----------|------------|--------------|
| `{{氏名}}` | 申込者の氏名 | `T_会員.氏名` | `T_外部申込者.氏名` |
| `{{事業所名}}` | 申込者の事業所名 | `T_事業所.事業所名` | `T_外部申込者.事業所名` |

#### 3.3 申込者一覧 表示項目（メール送信画面内）
| 列 | 内容 |
|----|------|
| 選択 | チェックボックス（送信対象・除外の切替） |
| 氏名 | 会員名 or 非会員入力氏名 |
| 事業所名 | 会員事業所名 or 非会員入力事業所名 |
| 区分 | 会員 / 非会員 |
| メールアドレス | 送信先確認用（表示のみ） |
| 個別添付 | 自動マッチングファイルの有無（あり / なし） |

---

### 4. 管理コンソール連携 仕様詳細

#### アクセス経路
```
会員管理コンソール  ⇄  研修管理コンソール（双方向・再認証不要）
```

#### 権限ルール
- `T_管理者Googleホワイトリスト` に `有効フラグ=true` で登録されたアカウント = 両コンソールアクセス可
- 会員ログイン（ID/PW）のみのアカウント = コンソールナビゲーションリンク非表示
- 認証判定は両コンソール共通で `checkAdminBySession_()` を使用

---

### 5. 実装時の同時整合性要件（RULEBOOK §3）

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

### 6. 受け入れ指標（DoD）

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

### 7. 参照した一次情報

1. [Class GmailApp | Apps Script | Google for Developers](https://developers.google.com/apps-script/reference/gmail/gmail-app)
2. [Class Session | Apps Script | Google for Developers](https://developers.google.com/apps-script/reference/base/session)
3. [Execute web app with Gmail access as user who executes the script](https://discuss.google.dev/t/execute-web-app-with-gmail-access-as-user-who-executes-the-script/96732)（Execute as: Me の制約確認）
4. [Get List of Email Aliases with Gmail API](https://www.labnol.org/code/20295-gmail-api-email-aliases)（GmailApp.getAliases() の動作確認）

---

## 年会費コンソール（2026-03-15）

> 原本: `docs/archive/historical/18_DECISION_RECORD_ANNUAL_FEE_CONSOLE_2026-03-15.md`（元タイトル: Decision Record: 年会費管理コンソール追加）

更新日: 2026-04-09（§9 追補）/ 初版: 2026-03-15
対象: 枚方市介護支援専門員連絡協議会 会員システム

### 1. 背景
- 既存システムは `T_年会費納入履歴` を保持しているが、管理者が Web 画面から登録・更新する導線がない。
- 会員マイページでは年会費の直近表示のみ行っており、年度別の完全履歴や管理用の更新操作には対応していない。
- スプレッドシートを直接編集する運用は、権限逸脱・入力揺れ・監査性不足のリスクが高い。

### 2. 決定
以下を採用する。

1. 管理者専用の `年会費管理コンソール` を追加する。
2. 年会費管理は「入金確認の記録」に限定し、引き落とし・オンライン決済は実装しない。
3. 管理 UI は `対象年度 / 納入状況 / 会員種別 / 会員検索` による絞り込み一覧を提供する。
4. 管理 UI は対象年度ごとに全会員を一覧表示し、各行で `会費納入状態コード / 納入確認日 / 備考` を直接編集・保存できる形にする。
5. `新規作成` ボタンや別フォームは設けず、未作成レコードも一覧行の保存で新規作成する。
6. 金額は `M_会員種別.年会費金額` を正とし、画面入力で変更させない。
7. `会員ID + 対象年度` は論理的一意とし、GAS 側で重複を禁止する。
8. 年会費更新時は `T_年会費更新履歴` へ監査ログを記録する。
9. 管理コンソール用データは専用 API で取得し、会員マイページの `annualFeeHistory` とは分離する。
10. 保存処理では `LockService` を用いて競合更新を抑止する。
11. 読み込み改善のため、対象年度単位のデータ取得と短時間キャッシュを採用する。

### 3. 採用理由
- 管理者専用 UI に集約することで、認証・認可を既存の `checkAdminBySession_()` に統一できる。
- 年度単位で一覧を返すことで、GAS のレスポンス量とシート走査量を抑えられる。
- 一覧直接編集にすることで、管理者の主作業である「納入確認の更新」を最短操作にできる。
- `T_年会費更新履歴` を持つことで、「誰がいつ何を変えたか」の追跡が可能になる。
- `LockService` により、スプレッドシート特有の同時更新競合を抑えられる。

### 4. 不採用案
#### 4.1 スプレッドシート直接編集を継続
- 不採用理由:
  - 入力揺れが起きやすい
  - 監査ログが残らない
  - 管理画面との整合を保ちにくい

#### 4.2 `updateMember` に年会費更新を混在させる
- 不採用理由:
  - 会員基本情報更新と年会費更新は業務責務が異なる
  - バリデーションと監査要件が異なる
  - API 影響範囲が不必要に広がる

#### 4.3 CSV 一括取込を初期実装に含める
- 不採用理由:
  - 検証コストと事故リスクが高い
  - まずは単票登録・更新の確立が優先

### 5. 実装ルール
- 管理者認証は `processApiRequest` 側で必須化し、年会費処理関数では不要な再認証を避ける。
- `PAID` の場合は `納入確認日` 必須とする。
- `UNPAID` の場合は `納入確認日` を空にできる。
- 金額は `M_会員種別.年会費金額` を参照し、保存時もその値を使用する。
- 保存後は会員マイページの簡易履歴表示に反映されること。通常は直近2年度、当年度未納補完を先頭追加した場合は最大3件まで表示する。

### 6. 反映対象
- `docs/archive/spec_history/01_PRD.md`
- `docs/archive/spec_history/02_ARCHITECTURE.md`
- `docs/03_DATA_MODEL.md`
- `docs/04_DB_OPERATION_RUNBOOK.md`
- `docs/archive/spec_history/05_AUTH_AND_ROLE_SPEC.md`
- `backend/Code.gs`
- `src/App.tsx`
- `src/components/*`
- `src/services/api.ts`
- `src/types.ts`

### 7. 2026-03-28 追補
- 年会費対象者は「対象年度の支払対象会員」に限定し、退会年月日が前年度末以前の会員は一覧・保存対象から除外する。
- 未作成レコードは内部的には `exists=false` を保持するが、UI 表示上は独立した状態を作らず「未納」に統一する。
- ダッシュボード集計は対象年度の保存済み正本データを基準とし、個人会員・事業所会員・賛助会員ごとに納入済み件数/未納件数と金額を表示する。
- 一覧操作は行単位保存を廃止し、主操作を `変更を保存` の単一導線に統一する。
- 年度切替、サイドバー遷移、ログアウト、ブラウザ再読み込み時には、未保存変更がある場合のみ警告する。

### 8. 2026-03-30 追補
- 一括保存 UI は維持し、各行の選択肢にドラフト専用の `前年度末退会` を追加する。
- `前年度末退会` は `T_年会費納入履歴.会費納入状態コード` には保存しない。
- 一括保存時に `前年度末退会` が選択された行は、`T_会員` に対して以下を行う。
  - `会員状態コード = WITHDRAWN`
  - `退会日 = 対象年度の前年度末`
  - `退会処理日 = 実行日`
- 同年度の年会費レコードが存在する場合は論理削除し、年会費一覧・集計の対象外にする。
- 年会費監査ログには `WITHDRAW` 操作として記録する。

### 9. 2026-04-09 追補（v180〜v185 実装確定仕様）

#### 9.1 デフォルト年度
- GAS バックエンド: `resolveAnnualFeeSelectedYear_()` は `getCurrentFiscalYear_()` を直接返す（DB 最終年度への依存を廃止）。
- フロントエンド: `CURRENT_YEAR` は `month < 3 ? year - 1 : year`（4月始まり会計年度）で算出する。
- 効果: 新年度開始直後にレコードが存在しない場合でも、当年度（例: 2026）がデフォルト表示される。

#### 9.2 デフォルトフィルタ・ソート
| 項目 | デフォルト値 | 理由 |
|---|---|---|
| 納入状況フィルタ | 未納（UNPAID） | 処理が必要な会員を即表示する |
| 会員種別フィルタ | 全て（ALL） | 全種別一覧が出発点として適切 |
| ソートキー | 年度処理（status） | 未納を先頭に並べるため |
| ソート方向 | 昇順 | UNPAID=0, PAID=1 の優先度マップで未納が最上位 |

#### 9.3 状態変更時の自動入力（v185 確定）
| 変更後の状態 | 入金日（confirmedDate） | 備考 |
|---|---|---|
| 納入済み（PAID） | **本日の日付を自動入力** | YYYY-MM-DD 形式。表示欄も YYYY/MM/DD で即時反映。手動変更可。 |
| 未納（UNPAID） | クリア | — |
| 前年度末退会（WITHDRAW） | クリア | バックエンドで退会処理を実行 |

#### 9.4 対象会員の定義（変更なし）
- 年会費対象は `isAnnualFeeEligibleMemberForYear_` が `true` を返す会員のみ。
- 退会年月日が対象年度の開始（4/1）より前の会員は除外。
- 未作成レコードは UI 上「未納」として扱い、保存時に新規レコードを作成する。

#### 9.5 `PAID` バリデーション
- 保存時: `draft.status === PAID` かつ `confirmedDate` が空の場合は保存エラー。
- 自動入力（§9.3）により通常は空になり得ないが、手動で消した場合に備えてバックエンド側バリデーションも維持する。

---

## 公開ポータル入会申込の統合（2026-03-17）

> 原本: `docs/archive/historical/19_DECISION_RECORD_PUBLIC_PORTAL_APPLICATION_INTEGRATION_2026-03-17.md`（元タイトル: 公開ポータル統合 方針決定記録（2026-03-17））

### 1. 決定事項

1. 新規入会導線は管理コンソールから削除し、公開ポータルへ統合する。
2. 公開ポータルの名称を「枚方市介護支援専門員連絡協議会お申込みポータル」とする。
3. 公開ポータルの初期画面で、「研修申込」と「新規入会申込」を選択できるトップ画面を設ける。
4. `submitMemberApplication` は未認証で実行できる公開 API とする。
5. Deployment 構成は変更せず、既存の公開ポータル URL（`?app=public`）のまま提供する。

### 2. 採用理由

#### 2.1 管理コンソールから切り離す理由
- 入会申込は「誰でも使えること」が前提であり、管理者認証配下に置くと要件と矛盾する。
- 研修申込と同様に公開導線へ寄せることで、利用者が「ログイン前の申込窓口」を一箇所で認識できる。
- 受付窓口を公開ポータルへ一本化することで、管理画面は運営用、公開ポータルは利用者用、という役割分離が明確になる。

#### 2.2 同一 SPA 内でトップ選択式にする理由
- React 公式の conditional rendering パターンに従い、単一の公開ポータル内で表示を切り替える構成とする。
- 新たなルータ依存を追加せず、既存の Vite + singlefile + GAS 配信構成を維持できる。
- 画面遷移の中心が 2 系統（研修 / 新規入会）に整理されており、状態ベースの分岐で十分に管理できる。

#### 2.3 既存公開 URL を維持する理由
- `docs/09_DEPLOYMENT_POLICY.md` の固定 Deployment ID 運用を維持する必要がある。
- 公開 URL を増やさず、既存の `?app=public` を「お申込みポータル」として拡張する方が運用負荷と利用者混乱が少ない。

### 3. 実装要件

- `src/public-portal/App.tsx`
  - 初期画面をトップ選択画面へ変更
  - 研修申込フローと新規入会フローを同居させる
- `src/components/application/MemberApplicationForm.tsx`
  - 公開ポータル用の文言差し替えを可能にする
- `src/App.tsx`
  - 管理コンソールから新規入会導線を削除
- `backend/Code.gs`
  - `submitMemberApplication` を管理者限定アクションから除外
- 正本更新
  - `docs/archive/spec_history/01_PRD.md`
  - `docs/archive/spec_history/02_ARCHITECTURE.md`
  - `docs/00_DOC_INDEX.md`

### 4. 参照した一次情報

1. React 公式 Conditional Rendering: https://react.dev/learn/conditional-rendering
2. React 公式 Preserving and Resetting State: https://react.dev/learn/preserving-and-resetting-state
3. Apps Script Deployments 公式: https://developers.google.com/apps-script/concepts/deployments

---
