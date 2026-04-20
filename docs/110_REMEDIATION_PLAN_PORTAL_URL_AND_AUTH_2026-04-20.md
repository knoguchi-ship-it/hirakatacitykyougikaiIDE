# 是正計画書

作成日: 2026-04-20
対象: 公開ポータル URL 維持を前提とした認証・認可是正

## 1. この計画の前提

今回の是正では、URL 方針を以下で固定する。

- 公開ポータル URL は変更しない
- 既に公開済みの public fixed deployment URL を継続利用する
- 公開ポータルは引き続き `https://script.google.com/a/macros/hcm-n.org/s/AKfycbxyuUXgK1oHUDMahQjluiL-gcrMK0qV0FWLFYaYBqGxlRSg9NhvmbyQRyf0dvaqg7Zp/exec?app=public` でアクセス可能とする
- 会員/管理者 URL は変更を許容する
- 分離後の会員/管理者 URL は member fixed deployment `AKfycbywpWoYxij6A-ZunIeBjG1Q8qX78PMMTsT3frx1cM5PJ2nAuZpz81KruXb5LIvWgbQx/exec` を正規候補とする

補足:

- 公開ポータル利用者には URL 変更影響を出さない
- 会員/管理者についてのみ、切替告知・文書更新・導線修正を許容する

## 2. 目的

第三者評価 `docs/109_THIRD_PARTY_ASSESSMENT_2026-04-20.md` で指摘した重大所見のうち、特に以下を解消する。

1. 匿名公開 Web アプリに対して内部 API の認可境界が不足している問題
2. 会員向け自己操作 API がクライアント申告の識別子を信頼している問題
3. 公開ポータルと会員/管理者の attack surface が同一 deployment に混在している問題

## 3. 到達目標

### 3.1 URL / deployment 目標

- public fixed deployment:
  - 引き続き公開ポータル専用 deployment として使う
  - public URL は維持する
  - `?app=public` でのアクセスを維持する
- member fixed deployment:
  - 会員/管理者専用 deployment として再定義する
  - 必要に応じて会員/管理者の正規 URL をこちらへ切り替える

### 3.2 security 目標

- `processApiRequest` を deny-by-default に変更する
- 公開 API を allowlist 化する
- 会員 API は server-side principal に基づいて実行する
- 会員向け write API で `memberId` / `staffId` / `loginId` のクライアント信頼を廃止する

## 4. 基本戦略

URL 方針とリスクを両立するため、2段階で進める。

### Phase 1: 認可境界の先行是正

目的:

- URL を大きく変えず、まず重大な認可欠陥を塞ぐ

内容:

- `processApiRequest` の入口で action ごとの許可ポリシーを再定義
- `fetchAllData`, `getAdminDashboardData`, `getMemberPortalData`, `updateMemberSelf`, `applyTraining`, `cancelTraining`, `withdrawSelf`, `cancelWithdrawalSelf` を server-side principal 必須へ変更
- 公開許可 action は `getPublicTrainings`, `getPublicPortalSettings`, `applyTrainingExternal`, `cancelTrainingExternal`, `submitMemberApplication` に限定
- member/admin UI が呼ぶ API クライアントも、principal 解決前提の payload に揃える

備考:

- この段階では public URL を変えない
- member/admin URL も直ちに変えなくてよいが、分離前提のコード整理は始める

### Phase 2: deployment と入口の分離

目的:

- 公開ポータルと会員/管理者の Web アプリ配信面を分離する

内容:

- public fixed deployment は `index_public` 専用とする
- member fixed deployment は `index` 専用とする
- `doGet()` の分岐を deployment 単位または明示的 route 判定に整理する
- 会員/管理者向け正規 URL を member fixed deployment 側へ移す
- 既存文書・認証情報メール・運用手順・案内文言を更新する

備考:

- public URL は維持
- member/admin 側のみ URL 切替告知が必要

## 4.1 構成案の比較

今回の論点は「何個の Apps Script に分けるべきか」ではなく、`public / member / admin` の3境界をどこまで物理分離するかである。

### 案A: 1プロジェクト運用

- public / member / admin を同一 Apps Script に置く
- route, API, 認可でのみ分離する

評価:

- 現状に近く、改修量は最小
- ただし匿名公開面と内部面が同居し続ける
- 境界事故が起きた時の blast radius が最大
- 本案件の第三者評価所見を踏まえると、是正後の目標構成としては弱い

判定:

- 暫定延命なら可
- 推奨しない

### 案B: 2プロジェクト運用

- public を単独 Apps Script に分離する
- member と admin は同一 Apps Script に残す

評価:

- 匿名公開面を内部面から切り離せる
- 今回の最大リスクである「匿名側から内部 API へ触れる」問題に最短で効く
- 一方で member と admin の混在リスクは残る
- ただし両者は匿名境界をまたがず、いずれも認証後 UI であるため、public 同居よりは危険度が下がる

member と admin を同居できる条件:

- `processApiRequest` が `member` と `admin` を action 単位で明確に分離している
- admin 一覧系 API を member から物理的に呼べても、server-side authorization で必ず拒否される
- 初期ロードデータを member 用と admin 用で分け、member に `fetchAllData` 系を返さない
- route 共通化ではなく、画面 bootstrap と API クライアントも role-aware に分ける

弱点:

- 管理機能追加のたびに member 側との権限境界確認が必要
- バンドル共有、共通 API、共通キャッシュで混線しやすい
- 将来の機能増加時に再分離コストが残る

判定:

- 短中期の現実解としては成立
- ただし最終形としてはやや弱い

### 案C: 3プロジェクト運用

- public, member, admin をそれぞれ別 Apps Script に分離する

評価:

- 最も明確な境界を持てる
- 匿名公開、会員セルフサービス、管理機能の blast radius を分離できる
- URL, deployment, appsscript manifest, runtime surface を役割単位で整理できる
- 認可ミスが起きても他領域へ波及しにくい

弱点:

- ビルド、デプロイ、設定同期、共通コード管理が最も重い
- manifest, clasp, release 手順、ドキュメント更新の運用コストが増える
- 共通コードの切り出し設計が甘いと保守負荷が上がる

判定:

- セキュリティ上の最終推奨
- 将来の機能拡張を考えると最も説明可能性が高い

## 4.2 推奨結論

本案件では、最終目標は案Cの `3プロジェクト運用` とするのが妥当である。

理由:

- user 指摘どおり、member と admin も本質的には別の security boundary である
- admin は横断閲覧、設定変更、監査、全件更新など高権限操作を持つため、一般会員 UI と同じ配信面に置き続ける合理性が薄い
- 今後の拡張で最も増えやすいのは admin 機能であり、そのたびに member 側との境界検証を続けるより、早期に切り出した方が将来コストが低い

したがって、設計の到達点は次の3本とする。

- public app: 匿名公開専用
- member app: 会員本人のセルフサービス専用
- admin app: 事務局管理専用

## 4.3 実行順序の推奨

ただし、実装順は一気に3本へ分けるのではなく、事故を避けるため段階化する。

### Step 1

- 現行コード内で `public / member / admin` の action 境界を完成させる
- deny-by-default と server-side principal を先に導入する

目的:

- 物理分離前に論理分離を完成させる

### Step 2

- public を先に別 Apps Script へ分離する
- 公開 URL は現行維持

目的:

- 匿名公開面を最優先で隔離する

### Step 3

- member と admin を別 Apps Script へ分離する
- 会員 URL と管理 URL を分ける

目的:

- 高権限面を一般会員面から分離し、将来の管理機能拡張に備える

## 4.4 今ここでの設計判断

「public は分けるのに、member と admin が一緒でよい」とは、本計画の最終結論にはしない。

正確には以下である。

- public と内部面を同居させるのは危険度が高く、最優先で分けるべき
- member と admin の同居は、厳格な server-side authorization があれば暫定的には成立する
- しかし本案件では将来拡張と説明責任を考え、member と admin も最終的には分けるべき

したがって、本計画は `最終3プロジェクト、実装は段階分離` を採用する。

## 5. 影響範囲

特に変更部分が重要なため、変更中心で整理する。

### 5.1 backend で変更が必要な部分

#### A. 入口制御

- `backend/Code.gs`
  - `doGet()` around line 365
  - `MEMBER_PORTAL_URL` around line 20

変更内容:

- public / member の入口責務を再整理
- member 側 URL 変更時に `MEMBER_PORTAL_URL` を member fixed deployment へ更新
- credential email 本文差し込み先も連動

影響:

- 会員向け認証情報メール
- 画面遷移後の自己案内リンク
- 文書記載 URL

#### B. API 認可境界

- `backend/Code.gs`
  - `processApiRequest()` around line 989
  - `fetchAllDataFromDb_()` around line 3033
  - `getMemberPortalData_()` around line 3154
  - `getAdminDashboardData_()` around line 3430

変更内容:

- action ごとに `public`, `member`, `admin` の3区分へ整理
- 匿名許可 action を allowlist 化
- それ以外は principal 必須に変更

影響:

- ほぼ全 UI の API 呼び出し
- 管理者初期表示
- 会員マイページ初期表示
- キャッシュキー設計

#### C. 会員 principal 解決

- `backend/Code.gs`
  - `memberLogin_()` around line 3894
  - `updateMemberSelf_()` around line 8341
  - `applyTraining_()` around line 9310 付近
  - `cancelTraining_()` around line 9638
  - `withdrawSelf_()` around line 7822
  - `cancelWithdrawalSelf_()` around line 7913

変更内容:

- caller principal をサーバー側で確定する仕組みに寄せる
- `payload.loginId`, `payload.memberId`, `payload.staffId` 依存を縮小または除去
- `memberPortalLoginId` は UI 補助値ではなく、最終的に server-verified principal に置き換える

影響:

- 会員保存
- 研修申込・取消
- 退会申請・取消
- ログイン直後のデータ取得

### 5.2 frontend で変更が必要な部分

#### A. 会員/管理者 API クライアント

- `src/services/api.ts`
- `src/shared/api-base.ts`

変更内容:

- 会員 API へ渡す payload から不要な本人識別子を削る
- auth bootstrap と portal data fetch の順序を見直す
- unauthorized / forbidden の扱いを明確化する

影響:

- ほぼ全 API 呼び出しラッパー
- エラーハンドリング

#### B. 画面側のログイン・遷移

- `src/App.tsx`
- `src/components/MemberForm.tsx`
- `src/components/TrainingApply.tsx`

変更内容:

- ログイン後の principal 管理方法を整理
- `authenticatedContext.memberPortalLoginId` 依存の扱いを再整理
- member/admin URL 切替が入る場合は案内リンク・戻り先も更新

影響:

- 会員ログイン
- 管理者から会員画面へ入る導線
- 保存後再読込

#### C. 公開ポータル

- `src/public-portal/App.tsx`
- `src/public-portal/components/*`

変更内容:

- 原則として public URL は維持
- API allowlist 化後に必要な公開 action のみを呼ぶことを再確認

影響:

- 影響は限定的
- ただし accidental dependency があれば切れるため回帰試験必須

### 5.3 build / deploy で変更が必要な部分

- `backend/index.html`
- `backend/index_public.html`
- `docs/09_DEPLOYMENT_POLICY.md`
- `HANDOVER.md`

変更内容:

- member/public の fixed deployment の役割を再定義
- 会員/管理者 URL の正規値を更新
- deploy 手順と verification 観点を更新

影響:

- 本番反映手順
- オペレーション引継ぎ

### 5.4 文書 / 運用で変更が必要な部分

- `docs/01_PRD.md`
- `docs/02_ARCHITECTURE.md`
- `docs/05_AUTH_AND_ROLE_SPEC.md`
- `docs/09_DEPLOYMENT_POLICY.md`
- `docs/00_DOC_INDEX.md`
- `HANDOVER.md`
- release state 文書

変更内容:

- URL 正本の更新
- deployment 役割の更新
- security boundary の更新
- operator 向け切替手順の追記

影響:

- 次回以降の再開・デプロイ・障害対応に直結

## 6. 変更箇所として特に重要な部分

優先度順に挙げる。

1. `backend/Code.gs:989` `processApiRequest`
   - 今回の是正で最重要
   - 公開許可 action と認証必須 action の境界をここで固定する
2. `backend/Code.gs:3154` `getMemberPortalData_`
   - `memberId` 直指定を許している現在設計を改める必要がある
3. `backend/Code.gs:8341` `updateMemberSelf_`
   - クライアント識別子依存を除去する中心
4. `backend/Code.gs:20` `MEMBER_PORTAL_URL`
   - 会員/管理者 URL 変更時の正本
5. `backend/Code.gs:365` `doGet`
   - Phase 2 で public/member の配信責務を分ける中心
6. `src/services/api.ts`
   - frontend から不用意に本人識別子を送らないよう整理する中心
7. `src/App.tsx`
   - login bootstrap と post-login routing の要

## 7. リスク

### 技術リスク

- 認可境界を締めることで、管理者経由の会員画面表示や保存フローが壊れる可能性がある
- 公開ポータルが内部 API に暗黙依存していた場合、Phase 1 で回帰する可能性がある
- GAS は session 管理の自由度が低く、実装方式を誤ると認証 UX が不安定になる

### 運用リスク

- 会員/管理者 URL 切替時に、認証情報メールや既存案内文の URL が古いままだと問い合わせが増える
- fixed deployment の役割変更時に片系だけ更新すると混乱する

### データリスク

- principal 解決ロジック変更時に、会員更新先の特定を誤ると誤更新が起こり得る

## 8. 検証観点

### Phase 1

1. 匿名で `fetchAllData`, `getMemberPortalData`, `getAdminDashboardData` が呼べないこと
2. public URL から `getPublicTrainings`, `applyTrainingExternal`, `cancelTrainingExternal`, `submitMemberApplication` が従来どおり動くこと
3. 会員ログイン後に自分のプロフィール取得・保存・研修申込・取消が動くこと
4. 管理者ログイン後に管理ダッシュボードと会員詳細編集が動くこと

### Phase 2

1. 公開ポータル URL がそのまま有効であること
2. 会員/管理者の新 URL でログイン・保存・管理操作が動くこと
3. 認証情報メールや文書の URL が新運用に一致していること

## 9. 実施順

1. Phase 1 の詳細設計
2. `processApiRequest` の deny-by-default 実装
3. 会員 API の principal 強制
4. public 回帰試験
5. Phase 2 の URL / deployment 切替設計
6. member URL 切替
7. 文書・運用更新

## 10. この計画の結論

今回の条件では、「公開ポータル URL は維持しつつ、会員/管理者のみ分離する」方針が最も現実的である。

そのため、設計上の主変更点は次の2つに集約される。

- まず `processApiRequest` と会員 API の認可境界を閉じること
- 次に member fixed deployment を会員/管理者専用入口として昇格させること

公開ポータル側は URL 維持のため変更を最小化し、会員/管理者側にのみ切替コストを集中させる。
