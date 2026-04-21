# システム設定画面 情報設計・UI再構成（2026-04-21）

## 1. 背景

管理者向けの「システム設定」画面に、公開ポータル文言、入会完了画面文言、帳票設定、事業所個別上限などの項目が単一カラムで積み上がり、運用担当者が目的の設定へ到達しにくくなっていた。

今回の目的は、既存機能を維持したまま、以下を満たす構成へ再編すること。

- 頻出設定と低頻度設定を視覚的に分離する
- 長文編集領域をまとめ、認知負荷を下げる
- 日本の行政・業務システム運用でも迷いにくい画面構成にする
- ハードコードではなく既存 state / save 処理をそのまま利用する

## 2. 採用方針

2026-04-21 時点で以下の一次ソースを参照した。

- デジタル庁デザインシステム β版
  - https://design.digital.go.jp/
  - https://design.digital.go.jp/dads/components/accordion/usage/
  - https://design.digital.go.jp/dads/components/textarea/
- W3C WAI
  - https://www.w3.org/WAI/tutorials/forms/
  - https://www.w3.org/WAI/tutorials/forms/grouping/
  - https://www.w3.org/WAI/tutorials/forms/instructions/

これを踏まえ、以下を UI 方針として採用した。

- 画面冒頭でページ目的と保存状態を要約する
- 関連項目はセクション単位でグルーピングする
- セクションは `details/summary` ベースのアコーディオンで実装する
- 長文項目は補助説明を付け、文言変更と表示切替を近接配置する
- 末尾の保存導線は常時視認できる sticky action bar にまとめる

## 3. 実装内容

対象ファイル: `src/App.tsx`

- `AdminSettingsSection` を追加し、`details/summary` ベースでセクションを共通化
- 画面上部に概要ヘッダ、保存状態カード、クイックジャンプを追加
- 既存の単一カード構成を以下の 5 セクションへ再編
  - 基本設定
  - 帳票・一括メール
  - 公開ポータル
  - 入会通知メール
  - 事業所ごとの個別上限
- 既存の state / save payload / backend API は変更せず、情報設計と見た目だけを再構成
- 画面下部の保存ボタンを sticky action bar 化し、未保存状態を常時表示

## 4. 検証

- `npm run typecheck`
- `npm run build`

いずれも成功。

## 5. 未実施

- Apps Script 反映
- 操作者による実ブラウザ確認
- 管理画面でのスクロール、折りたたみ、保存操作の実機確認
