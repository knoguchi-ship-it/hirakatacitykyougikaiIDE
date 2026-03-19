# ClaudeCode 次作業指示書（2026-03-19）

## 0. 目的

Claude Code がこのリポジトリで次の開発を安全に再開するための、短い実務指示書。
最初に `HANDOVER.md` を読み、その後この文書を確認すること。

---

## 1. 現在の確定状態

- ブランチ: `main`
- 最新 push 済みコミット: `38b7da7`
- 作業ツリー: clean
- 本番固定 Deployment:
  - 会員マイページ: `AKfycbycE2_ythCYSPwmPxvyfRzNLhWM7J1cX41TA2wjYgZgdI-P2uknYfQGh3AHrecCQ1Gk` → `@100`
  - 公開ポータル: `AKfycbxKoni2vBdvRbQWR6NyrroPHyNmElJNkJ5OTNOJMQ0k0z-Ae-oGeclrN3kxsE9yIXVr` → `@100`
- 公開ポータル URL: `https://script.google.com/macros/s/AKfycbxKoni2vBdvRbQWR6NyrroPHyNmElJNkJ5OTNOJMQ0k0z-Ae-oGeclrN3kxsE9yIXVr/exec?app=public`
- 2026-03-19 時点で、公開ポータルのトップ表示は実ブラウザ確認済み。

---

## 2. 最初の行動

1. `HANDOVER.md`
2. `docs/12_ENGINEERING_RULEBOOK.md`
3. `docs/09_DEPLOYMENT_POLICY.md`
4. `docs/05_AUTH_AND_ROLE_SPEC.md`
5. `docs/04_DB_OPERATION_RUNBOOK.md`

次に以下を実行すること。

```bash
git status --short
npx clasp show-authorized-user
npx clasp run healthCheck
npx clasp run getDbInfo
```

期待値:
- `git status --short` は空
- `show-authorized-user` は `k.noguchi@uguisunosato.or.jp`
- `healthCheck` / `getDbInfo` は成功

---

## 3. 直近で触った重要点

- 公開ポータルは「枚方市介護支援専門員連絡協議会お申込みポータル」に変更済み。
- トップ画面で `研修を申し込む` / `新規入会を申し込む` を選ぶ構成に変更済み。
- 新規入会導線は管理画面から削除済み。
- `submitMemberApplication` はログイン不要の公開 API として扱う構成に変更済み。
- `updateMember_` には代表者ロール制約のバックエンド強制が入っている。
- 不要な一時ファイル・未参照スクリーンショットは `Dust/` に退避済みで、`Dust/` は `.gitignore` 済み。

---

## 4. 次の優先タスク

優先度順:

1. 会員一括編集（`updateMembersBatch_`）の設計と実装
2. 管理コンソール UI/UX の継続改善
3. 必要なら公開ポータルの文言・導線改善

注意:
- 認証方式の二重構造は崩さない
- 固定 2 Deployment ID は変更しない
- `clasp deploy --deploymentId` は使わない
- 仕様変更時は正本ドキュメントを同時更新する

---

## 5. 完了条件

作業完了扱いにする前に、最低でも以下を満たすこと。

- `npm run typecheck`
- `npm run build:gas`
- `npx clasp run healthCheck`
- `npx clasp run getDbInfo`
- 必要な正本ドキュメント更新
- 固定 2 Deployment の Version 同期確認
- 実ブラウザで会員側 / 公開側の表示確認

---

## 6. 補足

- `CLAUDE.md` は補助資料として扱い、正本判断は `HANDOVER.md` と `docs/*` を優先すること。
- 迷ったら `docs/12_ENGINEERING_RULEBOOK.md` を最上位基準とすること。
