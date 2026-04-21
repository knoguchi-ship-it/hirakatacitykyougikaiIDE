# タスク: 公開ポータル入会完了画面の案内文・ログイン情報文言をシステム設定化

作成日: 2026-04-21
ステータス: IMPLEMENTED_LOCAL / 未デプロイ
優先度: High

## 目的

公開ポータルの入会申込完了画面に表示される以下 2 ブロックについて、ハードコード依存を減らし、管理者がシステム設定画面から変更できるようにする。

- 「今後のご案内」ブロック
- 「ログイン情報」ブロック

## 実装方針

- 文言は `T_システム設定` に保存し、公開ポータルは `getPublicPortalSettings_()` 経由で取得する
- React 側では文字列をそのまま描画し、HTML は解釈しない
- 複数行文言は `whiteSpace: 'pre-line'` で改行を保持する
- 旧キー `PUBLIC_PORTAL_COMPLETION_NO_CREDENTIAL_NOTICE` / `PUBLIC_PORTAL_COMPLETION_CREDENTIAL_NOTICE` は後方互換のため保持する
- 新キー未設定時は、旧キー + 既定追記文言からフォールバック生成する

## 追加した設定キー

- `PUBLIC_PORTAL_COMPLETION_GUIDANCE_VISIBLE`
- `PUBLIC_PORTAL_COMPLETION_GUIDANCE_BODY_WHEN_CREDENTIAL_SENT`
- `PUBLIC_PORTAL_COMPLETION_GUIDANCE_BODY_WHEN_CREDENTIAL_NOT_SENT`
- `PUBLIC_PORTAL_COMPLETION_LOGIN_INFO_BLOCK_VISIBLE`
- `PUBLIC_PORTAL_COMPLETION_LOGIN_INFO_BODY_WHEN_CREDENTIAL_SENT`
- `PUBLIC_PORTAL_COMPLETION_LOGIN_INFO_BODY_WHEN_CREDENTIAL_NOT_SENT`

## 画面仕様

### システム設定

- 「今後のご案内」ブロックの表示 ON/OFF
- 「今後のご案内」本文
  - メール送信 ON 時
  - メール送信 OFF 時
- 「ログイン情報」ブロックの表示 ON/OFF
- 「ログイン情報を画面に表示する」の ON/OFF
- 「ログイン情報」補足本文
  - メール送信 ON 時
  - メール送信 OFF 時

### 入会完了画面

- 「今後のご案内」ブロックは設定に応じて表示/非表示
- 「ログイン情報」ブロックは設定に応じて表示/非表示
- ログイン ID を実表示するかどうかは既存の `PUBLIC_PORTAL_COMPLETION_LOGIN_INFO_VISIBLE` を継続利用

## 確認項目

1. 管理者ポータルのシステム設定画面で新しいトグルと textarea が表示される
2. 保存後、再読み込みしても設定値が保持される
3. 公開ポータルの入会申込完了画面で「今後のご案内」ブロックの表示/非表示が切り替わる
4. 公開ポータルの入会申込完了画面で「ログイン情報」ブロックの表示/非表示が切り替わる
5. メール送信 ON/OFF に応じて各本文が切り替わる
6. ログイン情報表示 OFF 時でも補足本文だけ表示される

## 備考

- `npm run typecheck` 済み
- `npm run build` 済み
- `npm run build:gas` / `build:gas:member` / `build:gas:admin` 済み
- 実ブラウザ確認と Apps Script デプロイは未実施
