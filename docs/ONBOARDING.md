# 開発者オンボーディング

枚方市介護支援専門員連絡協議会 会員システム の **新規開発者向けチュートリアル**。
**4 週間で「ひとりで本番反映できる」状態**を目標に、段階的に学んでいきます。

> 構造化された onboarding は productivity を 40% 高めると報告されています (2026 業界調査)。
> 急がず段階的に進めてください。

---

## Day 1: 環境セットアップ + 全体像把握

### A. このシステムは何か (10 分)

- **顧客**: 枚方市介護支援専門員連絡協議会
- **目的**: 会員管理 + 年会費 + 研修申込 + 一括メール の業務システム
- **規模**: 会員 ~200 名、職員 ~500 名、admin ユーザー 数名
- **配信境界**: 公開ポータル（匿名） / 会員マイページ（ID/PW） / 管理者ポータル（Google + ホワイトリスト）の 3 系統
- **アーキ**: React 19 + TypeScript + Vite (frontend) / Google Apps Script + Google Sheets (backend)

### B. 必読 (20 分)

順番に読んでください:

1. [`AGENTS.md` §0 シークレット絶対ルール](../AGENTS.md) — 違反は即時是正 (5 分)
2. [`HANDOVER.md` 現状](../HANDOVER.md) — 何がどう動いているか (5 分)
3. [`docs/02_ARCHITECTURE.md`](02_ARCHITECTURE.md) — システム構造 (10 分)

### C. 開発環境セットアップ (30 分)

```bash
# 1. リポジトリ
git clone https://github.com/knoguchi-ship-it/hirakatacitykyougikaiIDE.git
cd hirakatacitykyougikaiIDE

# 2. 依存
npm install

# 3. clasp ログイン（operator アカウント k.noguchi@hcm-n.org）
npx clasp login
npx clasp show-authorized-user                # 確認

# 4. 動作確認
npm run typecheck                              # ✅ 通ること
npm run test:formula                           # ✅ 33/33 pass
npm run test:search                            # ✅ 16/16 pass
npm run security:public-boundary               # ✅ PASS
npm run security:split-boundary                # ✅ PASS
```

**全部通れば Day 1 完了** 🎉

### D. 触ってみる (任意)

- 公開ポータル (read-only): https://script.google.com/macros/s/AKfycbxyuUXgK1oHUDMahQjluiL-gcrMK0qV0FWLFYaYBqGxlRSg9NhvmbyQRyf0dvaqg7Zp/exec
- 管理者ポータルは operator から URL を貰う

---

## Week 1: アーキテクチャ深掘り

### A. データモデル (Day 2)

[`docs/03_DATA_MODEL.md`](03_DATA_MODEL.md) を全部読む。特に:

- T_会員 / T_事業所職員 / T_認証アカウント の関係
- T_研修 / T_研修申込 の関係 (v360 で 2-FK 化)
- T_変更申請 (v264〜)
- スプレッドシート = DB の制約と運用パターン

### B. 認証・認可 (Day 3)

[`docs/05_AUTH_AND_ROLE_SPEC.md`](05_AUTH_AND_ROLE_SPEC.md):

- 3 境界 (public / member / admin) の役割と分離
- 会員ログイン (ID/PW + PBKDF2 + pepper)
- 管理者ログイン (Session + ホワイトリスト)
- 5 段階権限 (MASTER / ADMIN / TRAINING_MANAGER / TRAINING_REGISTRAR / GENERAL)

### C. デプロイ運用 (Day 4)

[`docs/09_DEPLOYMENT_POLICY.md`](09_DEPLOYMENT_POLICY.md):

- 3 project 構成と fixed deployment ID
- `clasp deploy` 全面禁止 / `clasp redeploy` 標準
- build:gas / build:gas:admin / build:gas:member の違い
- gas-src/Code.full.gs と gas/admin/Code.gs の同期ルール

### D. 第三者評価とセキュリティ進化 (Day 5)

- [`docs/109_THIRD_PARTY_ASSESSMENT_2026-04-20.md`](109_THIRD_PARTY_ASSESSMENT_2026-04-20.md) — 初回評価 (D / High Risk)
- v261-v263 の是正リリース (release-notes-2026.md 参照)
- [`docs/172_DEFERRED_SECURITY_BACKLOG_SECRET_MANAGER_KDF_2026-05-01.md`](172_DEFERRED_SECURITY_BACKLOG_SECRET_MANAGER_KDF_2026-05-01.md) — 必須・破棄禁止 backlog
- [`docs/244_WCAG_2.2_AA_CONFORMANCE_STATEMENT_2026-05-21.md`](244_WCAG_2.2_AA_CONFORMANCE_STATEMENT_2026-05-21.md) — 現行 a11y 状態

### E. 大規模設計書を 1 つ通読 (Day 5-7)

スプリント手法を体感するため [`docs/228_ROSTER_REDESIGN_2026-05-19.md`](228_ROSTER_REDESIGN_2026-05-19.md) (名簿出力 Visual Designer 全面刷新) を読む。Sprint S1-S5 の段階分割が参考になる。

---

## Week 2-3: 初めての実装

### A. 小タスクから始める

最初の PR は **小さく**:

- ドキュメント修正
- typo 修正
- console.log 削除
- 既存 component への aria-label 追加
- 既存テストの拡充

### B. 開発フロー

```bash
# 1. ブランチ作成
git checkout -b feat/short-description

# 2. 実装
#    AGENTS.md §3 (実装開始前の必須確認) を遵守
#    docs/245 (UI 追加時のチェックリスト) を遵守

# 3. ローカル検証
npm run typecheck
npm run test:formula
npm run test:search
npm run security:public-boundary
npm run security:split-boundary
# UI 変更時: npm run test:a11y / test:responsive

# 4. コミット
git add <specific files>                       # ❌ git add -A は避ける
git commit -m "..."                            # AGENTS.md 命名規約

# 5. PR
gh pr create --title "..." --body "..."
```

### C. 本番デプロイ (operator 同席推奨)

[`docs/09_DEPLOYMENT_POLICY.md`](09_DEPLOYMENT_POLICY.md) を見ながら:

```bash
# 各 split で順次
cd gas/admin
npx clasp push --force
npx clasp version "v<NEW> short description"
npx clasp redeploy <FIXED_ID> --versionNumber <N> --description "..."
npx clasp deployments --json                   # 反映確認
```

**初めての本番反映は必ず operator に Slack 等で事前共有してください。**

### D. ドキュメント更新

リリースしたら必ず:

- [`HANDOVER.md`](../HANDOVER.md) §1 の version + deployment 表を更新
- [`docs/release-notes-2026.md`](release-notes-2026.md) に新エントリ追加
- 大きな変更なら [`docs/2XX_RELEASE_STATE_*.md`](.) 新規作成
- 新ファイルは [`docs/00_DOC_INDEX.md`](00_DOC_INDEX.md) の適切なカテゴリへ追記

---

## Week 4: 独立稼働

### A. 自分のリリースを完遂

中規模の機能 1 つを独力で:

1. 設計 → ADR or 設計書を `docs/` に追加
2. 実装 → 上記フロー
3. テスト追加 → `scripts/test-*.mts` パターン
4. デプロイ
5. ドキュメント更新 + コミット + push

### B. 半期レビューに参加

5 月 / 11 月の WCAG 2.2 AA 半期レビュー（[`docs/244`](244_WCAG_2.2_AA_CONFORMANCE_STATEMENT_2026-05-21.md) §6）に参加:

- `npm run test:a11y` 実行 + レポート確認
- `npm run test:responsive` 全 3 ポータル
- NVDA / VoiceOver の手動シナリオ
- 適合声明文書を更新

### C. 知識を残す

- 学んだことを `docs/learning/` に追加 (HTML or md)
- 「これは罠だった」を `memory/feedback_*.md` (AI 用) または `docs/` (人間用) に記録

---

## 困ったとき (FAQ)

| 症状 | 参照 |
|---|---|
| ビルドエラー | `npm run typecheck` で詳細 → [`docs/17_ROOT_CAUSE_ERROR_RESPONSE_PLAYBOOK.md`](17_ROOT_CAUSE_ERROR_RESPONSE_PLAYBOOK.md) |
| clasp `invalid_grant` | `npx clasp login` で再ログイン |
| clasp `Unable to run script function` | [`docs/16_INCIDENT_clasp_run_permission_2026-03-14.md`](16_INCIDENT_clasp_run_permission_2026-03-14.md) |
| GAS デプロイで URL が変わった | `clasp deploy` を使った → 禁止 ([`docs/09`](09_DEPLOYMENT_POLICY.md)) |
| admin の変更が反映されない | `build:gas` だけ実行した → `build:gas:admin` を別途実行 |
| pdfjs / xlsx で `import.meta` SyntaxError | v351 / v361 の罠 → [`docs/218`](218_RELEASE_STATE_v351_2026-05-14.md) |
| 文字化け | UTF-8 で保存されているか確認 → AGENTS.md §3 |
| GAS の認証エラー | OAuth スコープ追加時は myaccount.google.com で再承認要 |

---

## 学習リソース

- [`docs/learning/index.html`](learning/index.html) — Node.js / GAS / TypeScript / Vite / 性能・キャッシュ 等の教材
- [Diátaxis フレームワーク](https://diataxis.fr/) — このドキュメント体系の元
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [WCAG 2.2 仕様](https://www.w3.org/TR/WCAG22/)

---

## チェックリスト

最初の 4 週間でこれを全部終えれば、ひとりで本番反映できる状態になります。

### Day 1
- [ ] AGENTS.md §0 を読んだ
- [ ] HANDOVER.md を読んだ
- [ ] 開発環境セットアップ完了
- [ ] 全自動テスト pass を確認

### Week 1
- [ ] docs/02-05 を全部読んだ
- [ ] docs/09 デプロイポリシー理解
- [ ] docs/109 第三者評価読了
- [ ] docs/228 大規模設計書 1 件読了

### Week 2-3
- [ ] 小さな PR を 1 つ merge
- [ ] release-notes-2026.md に新エントリ追加
- [ ] 自分の変更で本番反映を operator 同席で 1 回実施

### Week 4
- [ ] 中規模機能 1 つを独力で実装 → デプロイ
- [ ] 半期レビュー or 月次レビューに参加
- [ ] ドキュメント or learning に新規追加

---

**Welcome aboard!** 🎉 質問は遠慮なく既存メンバーに。
