# 管理コンソール `unsupported_action` 再読込障害 修正記録

作成日: 2026-05-05
状態: v306 でリリース済み（2026-05-06 / admin split `@66`）

## 1. 背景

管理コンソールの年会費コンソールで保存後、画面全体が赤い `unsupported_action` 表示に置き換わり、メニュー移動では復旧せず再ログインが必要になる事象が報告された。

## 2. 原因

年会費保存 API 自体は admin split に登録済みであり、直接原因ではなかった。

保存後に `AnnualFeeManagement` から共通の `refreshAllData` が呼ばれ、管理者ロールでも member portal 再読込経路へ入れる状態管理になっていたことが原因。

- `loadAppData()` が全体データ読込後に `memberPortalLoaded` も `true` にしていた。
- `refreshAllData()` が `memberPortalLoaded` と `authenticatedContext.memberId` を見て、管理者ロールでも `getMemberPortalData` を呼び得る状態だった。
- admin split では member portal action を許可しないため、GAS 側で `unsupported_action` が返る。
- バックグラウンド再読込失敗でも `initError` に格納され、App 直下の fatal error 表示により画面全体が置き換わっていた。

## 3. 修正

`src/App.tsx` の共通読込制御を修正した。

- 管理者ロールでは `refreshAllData()` から member portal 再読込を呼ばない。
- `loadAppData()` は管理者ロールでは `memberPortalLoaded` を true にしない。
- `silent` 指定の全体データ再読込失敗では、画面全体を `initError` に落とさない。
- 管理者ロールの `refreshAllData()` 内の全体データ再読込は `silent` として扱い、保存後バックグラウンド更新で管理コンソール全体を落とさない。

## 4. 確認結果

- `npm run typecheck`: PASS
- `npm run build:gas:admin`: PASS
- `npm run security:admin-boundary`: PASS

注意: `npm run security:admin-boundary` を `build:gas:admin` と同時実行した初回は、artifact 再生成中の一時状態を読んで失敗した。ビルド完了後に単独再実行し PASS を確認した。

## 5. 操作者確認待ち

実ブラウザ確認は操作者側で実施する。

- 管理者ポータルでログイン後、会員詳細など全体データを読み込む画面へ移動する。
- 年会費コンソールへ戻り、年会費データを保存する。
- `unsupported_action` の全画面エラーにならず、再ログイン不要で操作を継続できることを確認する。
- 会員マイページの研修申込・キャンセル後の再読込が従来通り動くことを確認する。
