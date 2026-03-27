# 引継ぎ Task テンプレート

更新日: 2026-03-27

## 位置づけ

- この文書は引継ぎ task の**書式テンプレート**であり、現況の正本ではない。
- 現在状態は `HANDOVER.md`、`docs/20_NEXT_INSTRUCTIONS_FOR_CLAUDECODE_2026-03-19.md`、必要時のみ `docs/30_TEST_SPEC_v136_v140_INLINE_STAFF_EDIT.md` セクション8に記録する。
- task 単位の作業開始前メモ、途中更新、引継ぎメモはこのテンプレートを複製して使う。

## 必須項目

- `対象ケースID`
- `対象 deployment/version`
- `前提ログイン`
- `期待する正本データ`
- `終了条件`
- `evidence`

## Task カード雛形

```md
### Task: <短い名前>

- 対象ケースID:
- owner:
- status: `todo | doing | blocked | done`
- 対象 deployment/version:
- 対象 URL:
- 前提ログイン:
- 関連正本:
  - `HANDOVER.md`
  - `docs/20_NEXT_INSTRUCTIONS_FOR_CLAUDECODE_2026-03-19.md`
  - `<必要なら追加>`

#### 期待する正本データ
- <例: 野口 健太の区分は「管理者」が正>
- <例: 固定2 deployment はともに @141>

#### 実施前チェック
- [ ] `git status --short` を確認した
- [ ] 必要な deployment/version を確認した
- [ ] テスト後に戻すデータを控えた
- [ ] 終了条件を具体化した

#### 実施手順
1. <操作>
2. <操作>
3. <操作>

#### evidence
- 日付:
- 実施者:
- deployment/version:
- PASS/FAIL:
- 実ブラウザ確認:
- 取得ログ/スクリーンショット:
- データ復旧:

#### 終了条件
- [ ] 正本データに戻っている
- [ ] 必要な UI / API 確認が完了した
- [ ] 結果を正本へ転記した

#### 引継ぎメモ
- 状況:
- 未了理由:
- 次担当者の最初の一手:
- ブロッカー:
```

## 記入ルール

- 日付は相対表現ではなく絶対日付で書く。
- deployment は Deployment ID ではなく、必ず `@141` のような version も併記する。
- `PASS/FAIL` だけで終わらせず、何を確認し何を元に戻したかまで残す。
- task 完了後は、このテンプレート内だけで閉じず、正本へ転記してから完了扱いにする。
