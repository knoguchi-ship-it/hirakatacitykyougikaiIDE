# 枚方市介護支援専門員連絡協議会 会員管理システム

会員管理・研修申込・年会費管理を行う Web システム。従来の郵送・紙ベースの運用をデジタルへ移行し、事務局と会員双方の負担を軽減することを目的とする。

> **作業を始める人へ**: ルールと読む順序の正本は [`AGENTS.md`](AGENTS.md) です。**最初に `AGENTS.md` を読んでください。**
> 本書はリポジトリの概要だけを扱い、手順・運用値・仕様は各正本へのリンクにとどめます（同じことを二重に書かない）。

## 主な機能

- **公開ポータル**（匿名）— 入会申込、研修申込、登録情報の変更申請、退会申請
- **会員マイページ**（ログインID + パスワード）— 登録情報の確認・変更、年会費の納入状況、研修の受講履歴
- **管理者ポータル**（Google アカウント + ホワイトリスト）— 会員データベース、変更申請の承認、研修管理、年会費・帳票、一括メール送信
- **AI アシスト** — 研修案内メールの下書き生成（GAS サーバー側で Gemini API を呼ぶ。API キーは Script Properties 管理）

## 認証方針

- 会員機能は **Google アカウント不要**（ログインID + パスワード）
- 管理者ポータルは **Google アカウント認証**。`Session.getActiveUser()` で取得したメールを `T_管理者Googleホワイトリスト` と照合して権限を判定する
- **管理者と会員は完全に分離**する。管理者ポータルに会員マイページを表示しない（v250〜の確定事項。利便性を理由に覆さない）

詳細の正本は [`docs/spec/01_SOW.md`](docs/spec/01_SOW.md)（認証・認可・ロール別可否マトリクス）。

## 技術スタック

- **Frontend**: React 19 / TypeScript / Vite / Tailwind CSS v4 / Recharts
- **Backend**: Google Apps Script（3 split 構成：統合・公開 / 会員 / 管理者）
- **DB**: Google スプレッドシート
- **配信**: fixed deployment 4 本（統合・公開 ×2、会員 ×1、管理者 ×1）を毎リリース同一バージョンへ同期する

構成の正本は [`docs/spec/03_TRD.md`](docs/spec/03_TRD.md)。

## セットアップ

```bash
npm install
npx clasp login          # 運用アカウント k.noguchi@hcm-n.org
```

認証は 1〜2 日で切れる。作業開始時にまとめて通す手順は [`HANDOVER.md`](HANDOVER.md) §1 を参照。

## ビルドとリリース

`npm run build`（vite のみ）は **GAS 用の生成物を更新しない**。3 split それぞれに専用のビルドがある。

```bash
npm run prerelease        # リリース前の全ゲート。exit 0 が必須
npm run build:gas         # 統合・公開（backend/）
npm run build:gas:member  # 会員 split（gas/member/）
npm run build:gas:admin   # 管理者 split（gas/admin/）
```

リリース手順の正本は [`docs/09_DEPLOYMENT_POLICY.md`](docs/09_DEPLOYMENT_POLICY.md)。
**`clasp deploy` は全形式禁止**（URL が変わる）。固定 deployment の更新は `clasp redeploy` を使う。

## ドキュメント

| 目的 | 参照先 |
|---|---|
| ルール・読む順序 | [`AGENTS.md`](AGENTS.md) ← **入口** |
| 現況・次の作業・既知の罠 | [`HANDOVER.md`](HANDOVER.md) |
| 文書の索引 | [`docs/00_DOC_INDEX.md`](docs/00_DOC_INDEX.md) |
| 仕様の正本（5 文書） | [`docs/spec/README.md`](docs/spec/README.md) |
| リリース履歴 | [`docs/release-notes-2026.md`](docs/release-notes-2026.md) |
| ブラウザで読む資料 | [`docs/portal/index.html`](docs/portal/index.html) |
| 新規参加者向け | [`docs/ONBOARDING.md`](docs/ONBOARDING.md) |

`docs/archive/` は過去の記録置き場であり、現況や仕様の参照先にしない。
