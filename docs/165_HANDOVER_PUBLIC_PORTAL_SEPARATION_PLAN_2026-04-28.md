# Handover: Public Portal Code.gs Separation Plan

作成日: 2026-04-28
対象状態: `v287-partial`
完了状態: `v288` で integrated/public fixed deployments `@287` へ反映済み

## 1. 目的

現在の公開ポータル URL を変えずに、統合プロジェクト側へ残っている admin / member の処理機能を public から切り離す。

2026-04-28 追記: Phase 1 から Phase 4 は `v288` として完了。実装・検証・rollback 条件の正本は `docs/166_RELEASE_STATE_v288_2026-04-28.md` を参照する。

最終状態:

- public portal は公開ポータル機能だけを提供する。
- public portal の `Code.gs` から admin / member action へ到達できない。
- admin / member の処理実体は split project 側にのみ残す。
- 既存の canonical URL は変更しない。

## 2. 絶対条件

- URL は変更しない。
- deployment ID は変更しない。
- 会員ログインは `loginId + password` のみ。
- 管理者ログインは Google アカウント + whitelist 検証のみ。
- public / member / admin の境界を統合する案は採用しない。
- public 側に admin/member の action registry、action handler、wrapper、認証処理を戻さない。
- `seedDemoData` は production DB 破壊操作として扱い、完全バックアップと明示承認なしに実行しない。
- 実ブラウザ確認は操作者側が行う。agent は build、静的検証、clasp コマンド確認、取得できるログ調査、文書更新を担当する。

## 3. 現在の本番状態

`v287-partial`:

- integrated/public project: `@285` 維持。
- member split: `@39`。member 生成済み `Code.gs` は境界外関数を物理削除済み。
- admin split: `@46`。`@47` の admin 物理削除版はホワイトアウト発生により rollback 済み。

重要:

- admin `@47` は本番継続しない。
- admin の物理削除は原因特定まで再デプロイしない。
- member `@39` は操作者確認待ち。問題があれば member `@38` へ戻す。

## 4. 現在の問題

統合プロジェクトの public deployment は URL 維持のためそのまま使っているが、source artifact としては full backend `Code.gs` が残っている。

そのため現時点の課題は、別 project への URL 移管ではなく、統合プロジェクトへ push される artifact を public-only に縮退すること。

誤解してはいけない点:

- Apps Script の既存 web app deployment ID を別 Apps Script project へ移すことはできない。
- URL を変えないなら、public は現行 integrated project の fixed deployment ID を維持する必要がある。
- したがって public の完全分離は「project 移管」ではなく「現行 integrated project の `Code.gs` を public-only artifact にする」作業である。

## 5. 次の作業方針

### Phase 0: 安定状態の固定

目的: これ以上の破損を広げない。

作業:

- admin deployment が `@46` を指していることを `npx clasp deployments --json` で確認。
- member deployment が `@39` を指していることを確認。
- public deployment が `@285` を指していることを確認。
- 操作者に admin 表示復旧を確認してもらう。
- member `@39` のログイン・研修一覧・会員情報更新を確認してもらう。

完了条件:

- admin が表示される。
- member が主要導線で動く。
- 問題がある場合は member `@38`、admin `@46` へ戻してから原因調査する。

### Phase 1: source と artifact の分離

目的: full source を保持しつつ、public へ push する `Code.gs` だけを public-only にする。

推奨作業:

- 現在の full backend source を canonical source として明確化する。
- `backend/Code.gs` を直接編集前提にしない設計へ寄せる。
- 例: `gas-src/Code.full.gs` または同等の正本 source を用意し、build scripts がそこから `backend`, `gas/member`, `gas/admin` の artifact を生成する。
- ただし既存 build / deploy 影響が大きいため、最初は source copy と生成スクリプトだけを追加し、本番 push はしない。

完了条件:

- full source と public/member/admin artifact の関係が文書化される。
- `npm run build:gas`, `npm run build:gas:member`, `npm run build:gas:admin` が既存出力を再現できる。
- production には未反映。

### Phase 2: public-only artifact 生成

目的: integrated project の `backend/Code.gs` を public-only にする。

public に残す action:

- `getPublicTrainings`
- `getPublicPortalSettings`
- `getFileThumbnail`
- `applyTrainingExternal`
- `cancelTrainingExternal`
- `submitMemberApplication`
- `sendPublicOtp`
- `verifyPublicOtp`
- `lookupMemberForPublicUpdate`
- `submitPublicMemberUpdate`
- `submitPublicBusinessUpdate`
- `addPublicStaffMember`
- `removePublicStaffByCmNumber`
- `submitPublicWithdrawalRequest`
- `verifyMemberIdentityForPublic`
- `submitPublicChangeRequest`
- `getPublicAvailableStaffSlots`

public から削るもの:

- `MEMBER_ALLOWED_ACTIONS`
- `ADMIN_LOGIN_ACTIONS`
- `ADMIN_ACTION_PERMISSIONS`
- member action handler
- admin action handler
- `checkAdminBySession_`
- `memberLogin_`
- `updateMemberSelf_`
- `getMemberPortalData_`
- admin dashboard / admin settings / roster / bulk mail / delete console handlers

注意:

- public 変更申請承認時に admin 側が使う helper と public 申請作成時 helper を混同しない。
- public artifact から削る前に、public action から到達する helper を依存解析で一覧化する。
- `addPublicStaffMember_` のような wrapper / 再代入 / alias は v283 事故の再発要因。削る場合はトップレベル文も同時に扱う。

完了条件:

- public generated `Code.gs` で admin/member action 名を grep しても handler 実体が出ない。
- public generated `Code.gs` で `checkAdminBySession_`, `memberLogin_`, `updateMemberSelf_` が出ない。
- `npm run build:gas` が PASS。
- 一時 `.cjs` 構文確認が PASS。
- まだ production push しない。

### Phase 3: public-only artifact の side-by-side 検証

目的: production URL を変えず、push 前にローカルで破損を潰す。

作業:

- generated public `Code.gs` に残る action handler を一覧化。
- public HTML が必要とする `google.script.run` action を一覧化。
- 2つの一覧を照合し、足りない action がないことを確認。
- `doGet` が public HTML を返すことを確認。
- public から admin/member HTML を返さないことを確認。

完了条件:

- public HTML の全 action が public generated `Code.gs` に存在する。
- admin/member action は public generated `Code.gs` に存在しない。
- 差分を release note draft として記録する。

### Phase 4: public fixed deployment へ反映

目的: URLを変えず、public artifact を現行 integrated deployment へ同期する。

作業:

```bash
npm run build:gas
npx clasp push --force
npx clasp version "v288 public-only integrated artifact"
npx clasp redeploy AKfycbywpWoYxij6A-ZunIeBjG1Q8qX78PMMTsT3frx1cM5PJ2nAuZpz81KruXb5LIvWgbQx --versionNumber <n> --description "v288 public-only integrated artifact"
npx clasp redeploy AKfycbxyuUXgK1oHUDMahQjluiL-gcrMK0qV0FWLFYaYBqGxlRSg9NhvmbyQRyf0dvaqg7Zp --versionNumber <n> --description "v288 public-only integrated artifact"
npx clasp deployments --json
```

注意:

- fixed deployment 2本を片系だけ更新しない。
- public URL は変更しない。
- 失敗時は integrated/public を `@285` へ戻す。

復元:

```bash
npx clasp redeploy AKfycbywpWoYxij6A-ZunIeBjG1Q8qX78PMMTsT3frx1cM5PJ2nAuZpz81KruXb5LIvWgbQx --versionNumber 285 --description "rollback integrated to v286"
npx clasp redeploy AKfycbxyuUXgK1oHUDMahQjluiL-gcrMK0qV0FWLFYaYBqGxlRSg9NhvmbyQRyf0dvaqg7Zp --versionNumber 285 --description "rollback public to v286"
```

### Phase 5: admin physical pruning の再設計

目的: admin `@47` ホワイトアウト原因を特定し、安全に再挑戦する。

進め方:

- admin `@47` の再デプロイはしない。
- `@46` と generated `@47` 相当の差分を比較する。
- 初期表示に必要な `doGet`, HTML file, compressed HTML bootstrap, `adminLoginWithData`, `getAdminInitData` の依存を優先して確認する。
- pruning 対象から admin 初期表示 dependency を保護する seed list を追加する。
- 保護 seed を入れてローカル生成、構文確認、grep 確認、操作者確認の順で進める。

完了条件:

- admin がホワイトアウトしない。
- admin から member/public action handler は到達不可。
- admin に必要な管理機能は維持。

## 6. 次担当者の最初の一手

1. `HANDOVER.md` と本書を読む。
2. `npx clasp deployments --json` を integrated / member / admin の3箇所で実行し、`@285 / @39 / @46` を確認する。
3. 操作者に admin 復旧表示と member `@39` の確認結果を聞く。
4. admin が復旧していれば、public-only artifact 生成の設計から着手する。
5. admin が復旧していなければ、まず admin `@46` の deployment 状態とブラウザキャッシュを確認する。

## 7. 完了時に必ず更新する文書

- `HANDOVER.md`
- `docs/09_DEPLOYMENT_POLICY.md`
- `docs/00_DOC_INDEX.md`
- 新しい release state 文書
- 必要に応じて `docs/111_IMPLEMENTATION_BLUEPRINT_PROJECT_SPLIT_2026-04-20.md`

## 8. 判断基準

採用する:

- deny by default
- least privilege
- app ごとの action registry / handler / function body 分離
- URL と deployment ID の維持
- 失敗時に即 rollback できる小さな release

採用しない:

- public に admin/member action を残したままの運用
- public URL を変える案
- admin/member/public の境界統合
- function pruning の一括再挑戦
- 実ブラウザ未確認のまま release 完了扱い
