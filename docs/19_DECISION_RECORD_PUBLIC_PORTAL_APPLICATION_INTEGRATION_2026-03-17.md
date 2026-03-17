# 公開ポータル統合 方針決定記録（2026-03-17）

## 1. 決定事項

1. 新規入会導線は管理コンソールから削除し、公開ポータルへ統合する。
2. 公開ポータルの名称を「枚方市介護支援専門員連絡協議会お申込みポータル」とする。
3. 公開ポータルの初期画面で、「研修申込」と「新規入会申込」を選択できるトップ画面を設ける。
4. `submitMemberApplication` は未認証で実行できる公開 API とする。
5. Deployment 構成は変更せず、既存の公開ポータル URL（`?app=public`）のまま提供する。

## 2. 採用理由

### 2.1 管理コンソールから切り離す理由
- 入会申込は「誰でも使えること」が前提であり、管理者認証配下に置くと要件と矛盾する。
- 研修申込と同様に公開導線へ寄せることで、利用者が「ログイン前の申込窓口」を一箇所で認識できる。
- 受付窓口を公開ポータルへ一本化することで、管理画面は運営用、公開ポータルは利用者用、という役割分離が明確になる。

### 2.2 同一 SPA 内でトップ選択式にする理由
- React 公式の conditional rendering パターンに従い、単一の公開ポータル内で表示を切り替える構成とする。
- 新たなルータ依存を追加せず、既存の Vite + singlefile + GAS 配信構成を維持できる。
- 画面遷移の中心が 2 系統（研修 / 新規入会）に整理されており、状態ベースの分岐で十分に管理できる。

### 2.3 既存公開 URL を維持する理由
- `docs/09_DEPLOYMENT_POLICY.md` の固定 Deployment ID 運用を維持する必要がある。
- 公開 URL を増やさず、既存の `?app=public` を「お申込みポータル」として拡張する方が運用負荷と利用者混乱が少ない。

## 3. 実装要件

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
  - `docs/01_PRD.md`
  - `docs/02_ARCHITECTURE.md`
  - `docs/00_DOC_INDEX.md`

## 4. 参照した一次情報

1. React 公式 Conditional Rendering: https://react.dev/learn/conditional-rendering
2. React 公式 Preserving and Resetting State: https://react.dev/learn/preserving-and-resetting-state
3. Apps Script Deployments 公式: https://developers.google.com/apps-script/concepts/deployments
