# 公開入会申込バリデーション強化・論理削除化タスク

最終更新: 2026-04-22
状態: 本番反映済み（v258）

## 1. 背景

- 公開ポータルの事業所番号に入力制約がなく、期待する 10 文字の識別子として扱いにくかった。
- 事業所職員登録で同一メールアドレスを複数人に設定できず、共有代表アドレス運用と衝突していた。
- 空の職員カードがバリデーション対象になり、実務上の入力途中操作を阻害していた。
- 管理画面のデータ管理コンソールが物理削除前提であり、運用リスクが高かった。

## 2. 実装内容

### 2.1 公開入会申込

- `officeNumber` を **半角英数字 10 文字** に統一。
- フロントエンド:
  - `maxLength=10`
  - サポートテキスト追加
  - submit 時に `^[A-Za-z0-9]{10}$` を検証
- バックエンド:
  - `submitMemberApplication_` でも同じ正規表現で検証
  - 既存の重複事業所番号チェックは維持

### 2.2 事業所職員登録

- 共有メールアドレスを許容。**同一事業所内のメール重複チェックを撤去**。
- 完全空白の職員カードは `lastName / firstName / lastKana / firstKana / careManagerNumber / email` が全て空なら非存在として扱う。
- 一部でも入力されたカードは従来どおり必須バリデーション対象とする。
- submit payload でも空カードを除外し、フロントとバックの判定差異をなくした。

### 2.3 データ管理コンソール

- 物理削除 UI / 文言 / 確認テキストを廃止し、**論理削除**へ変更。
- 検索対象:
  - 個人会員
  - 賛助会員
  - 事業所会員
  - 事業所会員メンバー（代表者単体削除は不可）
- 論理削除の内容:
  - `T_会員`: `WITHDRAWN` + `削除フラグ=true`
  - `T_事業所職員`: `LEFT` + `削除フラグ=true`
  - `T_認証アカウント`: `アカウント有効フラグ=false` + `削除フラグ=true`
  - `T_管理者Googleホワイトリスト`: `有効フラグ=false` + `削除フラグ=true`
- 保持する履歴:
  - `T_ログイン履歴`
  - `T_研修申込`
  - `T_年会費納入履歴`
  - `T_年会費更新履歴`
- `T_削除ログ` は継続利用し、操作前スナップショットを保存する。

## 3. 一次ソースと採用方針

- OWASP Input Validation Cheat Sheet
  - allowlist、長さ制約、クライアント/サーバー双方での検証を採用
  - https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html
- デジタル庁デザインシステム β版「インプットテキスト（使い方）」
  - サポートテキストをラベル直下に置き、エラーテキストは具体的に記述
  - https://design.digital.go.jp/dads/components/input-text/usage/
- W3C WAI Forms Tutorial
  - ラベルと入力指示を明示し、グループ単位で理解しやすくする
  - https://www.w3.org/WAI/tutorials/forms/instructions/
  - https://www.w3.org/WAI/tutorials/forms/grouping/
- Google Cloud Storage Soft Delete
  - 誤削除耐性の観点から「復元不能な即時削除より保持と無効化を優先」の設計方針を採用
  - https://cloud.google.com/storage/docs/soft-delete

補足:
- 「共有メールアドレスを許容」は上記資料の明示要件ではなく、本案件の認証正本が `loginId + password` であり、通知先メールと認証子を分離している現行設計からの実装判断。

## 4. 実施済み検証と未実施

実施済み:

- `npm run typecheck`
- `npm run build`
- `npm run build:gas`
- `npm run build:gas:member`
- `npm run build:gas:admin`
- Apps Script への push / version / redeploy
- `npx clasp deployments --json`（統合 / member / admin）

未実施:

- 操作者による実ブラウザ確認
- `npx clasp run healthCheck`
- `npx clasp run getDbInfo`

補足:

- `npx clasp run healthCheck` / `getDbInfo` は 2026-04-22 時点でも `Unable to run script function. Please make sure you have permission to run the script function.` で未確認。
