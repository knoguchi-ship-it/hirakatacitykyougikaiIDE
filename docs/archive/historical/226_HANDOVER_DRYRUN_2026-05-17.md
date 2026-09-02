# 2026-05-17 引継ぎ：dryRun synthetic transaction フレームワーク導入セッション

更新日: 2026-05-17（19:30 JST 引継ぎ時点）
担当: claude (Opus 4.7) → 次担当者
コミット: `d110b48 test: add dryRun synthetic transaction runner for application/transfer flows`

> **2026-05-18 注記（security/docs cleanup 後）**: 現在の再開入口は `HANDOVER.md`。この文書は dryRun 導入セッションの記録として参照する。2026-05-18 に `.clasp.json` を Git 追跡対象から除外し、admin callable から dryRun 物理削除関数を削除し、`docs/09_DEPLOYMENT_POLICY.md` / `docs/00_DOC_INDEX.md` を v370 へ整合済み。soft delete cleanup の 3 関数は維持。

---

## 0. 必ず最初に読む（AGENTS.md グランドルール）

- **AGENTS.md §0**: シークレット（`.env*` / `.clasprc.json` / pepper / OAuth コード等）の値を**コミット・docs・チャット・ログ・外部送信のいずれにも記載しない**。設定名のみ言及可。**他のすべてのルールに優先する絶対ルール**。
- **AGENTS.md §4**: `clasp deploy` は全形式禁止。fixed deployment への push は `clasp redeploy <id> --versionNumber <n>`。
- **AGENTS.md §4**: 3 境界（admin DOMAIN / member 匿名 / public 匿名）厳守。逆行案を対等選択肢として提示しない。
- **AGENTS.md §5**: `push` 前に `git diff` で作業ツリー全体を確認。混在変更があればファイル単位で push 範囲を限定。

---

## 1. 本セッションの成果

### 1.1 dryRun synthetic transaction フレームワーク（コミット済み `d110b48`）

本番 DB を対象に「新規入会申込」「同一人物転籍」の経路を end-to-end 検証する synthetic transaction フレームワーク。Global Standard ベストプラクティス準拠（Web 検索済み・2026-05-17 時点）。

#### 検証結果サマリ（6/7 PASS）

| シナリオ | 結果 | 検証内容 |
|---|---|---|
| `NEW_INDIVIDUAL` | ✓ 7/7 | 個人会員入会申込 → 承認 → T_会員/T_認証アカウント 行作成 + ログインID=CM番号 |
| `NEW_SUPPORT` | ✓ 5/5 | 賛助会員入会申込 → 承認 → T_会員/T_認証アカウント 行作成 + ログインID=会員ID |
| `NEW_BUSINESS` | ✓ 7/7 | 事業所会員入会申込（職員 4 名・REPRESENTATIVE 1 名） → 承認 → 全 4 行作成 |
| `TRANSFER_INDIVIDUAL_TO_STAFF` | ✓ 5/5 | 個人会員 → 事業所職員（CM 一致で `convertIndividualToStaff_`） |
| `TRANSFER_STAFF_TO_INDIVIDUAL` | ✓ 5/5 | 事業所職員 → 個人会員独立（CM 一致で `convertStaffToIndividual_`） |
| `TRANSFER_STAFF_ACROSS_BIZ` | ✓ 4/4 | 事業所 A 職員 → 事業所 B 職員（CM 一致で `transferBusinessStaffToBusinessMember_`） |
| `MEMBER_TYPE_CHANGE_IND_TO_SUPPORT` | ✗ | テスト側仕様誤り — `convertMemberType_` は `STAFF↔INDIVIDUAL` のみ対応で `INDIVIDUAL↔SUPPORT` 非対応 |

**副作用 cleanup 結果:**
- 作成: T_会員 10 / T_事業所職員 10 / T_認証アカウント 13 / T_変更申請 10
- soft delete (`削除フラグ=true`): T_会員 9 / 職員 9 / 認証 13 / 申請 10（転籍シナリオで元レコードが既に soft-delete 済みのため -1）
- ScriptProperties manifest クリア確認済み

#### 設計原則（適用済み）

| 観点 | 実装 |
|---|---|
| Unique prefix isolation | 全フィクスチャに `DRYRUN_` プレフィックス + メールは `@example.invalid`（RFC 2606 reserved） |
| Email side-effect 抑制 | `try/finally` で `CREDENTIAL_EMAIL_ENABLED` を一時 `false` 化 |
| Track-then-cleanup | 作成行 ID を ScriptProperties manifest に蓄積 → preview → 承認 → soft delete |
| AAA pattern | Arrange (payload 構築) → Act (submit + approve) → Assert (DB 副作用検証) |
| Idempotency | cleanup は manifest を削除して冪等 |
| Independence | 各シナリオ独立、任意順序で実行可 |
| Defense in depth | clasp run の editor 権限 gating + Apps Script 内部の admin 認証（HEAD では effective user 代用） |

#### 追加ファイル

| ファイル | 内容 |
|---|---|
| `gas-src/Code.full.gs` 末尾 +668 行 | dryRun モジュール（3 entry + 7 scenarios + helpers） |
| `scripts/dryrun-applications.mjs` 169 行 | Node ランナー（run / preview / cleanup --yes サブコマンド） |
| `scripts/build-admin-gas.mjs` +7 行 | pruning seed + assertion allowlist に dryRun 3 関数追加 |
| `scripts/audit-admin-boundary.mjs` +4 行 | allowlist に dryRun 3 関数追加 |
| `gas/admin/Code.gs` +730 行 | 再ビルド成果物 |

#### 既存システムへの影響

- 既存関数 / 既存ロジック: **一切改変なし**（純粋追加のみ）
- 本番 fixed deployment (@329/@87/@129): **影響なし**（コードを触っていない）
- Web UI 公開アクション: **影響なし**（`processApiRequest` 未登録、clasp run 経由のみ）

---

## 2. 操作（運用コマンド）

### 2.1 dryRun テスト実行

```bash
# 全シナリオ実行（admin split に push 済みであること）
node scripts/dryrun-applications.mjs run

# cleanup 対象件数の確認
node scripts/dryrun-applications.mjs preview

# soft delete 実行（破壊的・--yes 必須）
node scripts/dryrun-applications.mjs cleanup --yes
```

### 2.2 admin split への push 手順

```bash
npm run build:gas:admin
cd gas/admin
npx clasp push --force
```

**注意**: `npx clasp push` は標準 OAuth client（`clasp login` 標準フロー）で実行。project-scoped client では `Insufficient Permission` で失敗する。

### 2.3 `clasp run` 実行手順

`clasp run` は project-scoped OAuth client が必要:

```bash
npx clasp login --creds .tmp/oauth-client-hcmn-member-system-prod.json --use-project-scopes --no-localhost
```

標準と project-scoped の切替はそれぞれ `clasp login` の引数で行う。

---

## 3. 🔴 操作者による即時対応タスク（優先度高）

`TaskList` でタスク管理。未完了タスク #6, #7, #9 が最優先。

### Task #6: `runRebuildSchemaForV360` Run

admin split プロジェクト (scriptId: `1tlBJ-OJjqNQQxzb5tY3iRUlS4DmQD9sYqw5j842tXD1SPVHutBUeKTRi`) を Apps Script editor で開き、関数 `runRebuildSchemaForV360` を 1 回 Run。

**実行内容:**
1. M_出欠状態 マスタ作成 + 5 件初期値投入
2. T_研修申込 末尾 5 列追加（外部申込者ID / 出欠状態コード / 出欠記録日時 / 出欠記録者メール / 事務局メモ）
3. T_メール送信明細 をログ SS に作成（**これがないと一括メール送信が失敗する**）
4. T_メール送信ログ.研修ID 列追加
5. 既存 EXTERNAL 申込行を 2-FK 化（申込者ID → 外部申込者ID 複写）
6. 既存申込行の出欠状態を `UNRECORDED` で backfill
7. ROSTER_TEMPLATE_LIST JSON 各エントリに `category='MAILING_LIST'` auto-add
8. XOR 整合性監査（`xorViolations: 0` を Logger.log で確認）

### Task #7: `runCleanupPartialBusinessV370_53779700` Run + 再承認

申請 `CR1778920612878_22c197b0`（枚方市包括支援センターはなまる）で会員ID `53779700` が partial 登録状態。

```
1. admin Apps Script editor で runCleanupPartialBusinessV370_53779700 を 1 回 Run
2. cleanup 結果ログを確認
3. 管理者ポータルの変更申請管理コンソールから再承認
4. 3 名全員が正常作成されることを確認
```

### Task #9: v361 以降の実ブラウザ動作確認

現行確認観点は `docs/225_RELEASE_STATE_v360_to_v370_2026-05-17.md` §3 と `docs/223_RELEASE_STATE_v360_2026-05-16.md` §5 を正とする。`docs/224_RESUME_v360_2026-05-16.md` は v361 時点の履歴資料。

---

## 4. 🔵 動作確認 PASS 後（claude 担当）

### Task #10: v360-v370 リリースを 1 コミットでまとめる

操作者の動作確認が全 PASS した後、user 明示指示のもと working tree 残差（26 modified + 11 untracked = 約 4,340 行）を 1 コミット:

> 2026-05-18 時点では上記に security/docs cleanup（`.clasp.json` 追跡解除、現行本番文書整合、dryRun 物理削除 callable 除去、CSV/44px 整理）が追加で混在している。commit 前に `git status --short` と `git diff` で範囲を確認する。

```bash
# 例
git add -A  # ※ .clasprc.json 等 secret が含まれていないか必ず diff 確認
git commit -m "feat: ship v360-v370 (training roster, search kana, mail templates, transfer hotfixes)
...
"
```

### Task #11: HANDOVER.md / docs 整合

コミット後、HANDOVER.md の「working tree 未コミット」記述を「コミット済み（hash xxxxxxx）」に更新。`docs/225_RELEASE_STATE_v360_to_v370_2026-05-17.md` の文言と整合。dryRun コミット `d110b48` についても HANDOVER.md に 1 行記録。

---

## 5. ⚪ 将来課題（優先度低）

| Task # | 内容 | タイミング |
|---|---|---|
| #12 | dryRun フレームワーク拡張（退会・スタッフ追加削除・エラーパス検証等） | 必要時 |
| #13 | v362+ UI 後続実装（MemberSelectModal / セグメント絞り込み UI / 受講履歴タブ / メール送信ログ閲覧 UI） | 別チケット推奨 |
| #14 | 旧 申込者ID / 申込者区分コード の物理削除 + 後方互換コード除去 | v380 想定 |
| #15 | パスワード hash pepper を Script Properties → Google Cloud Secret Manager 移行 + 外部 KDF 検討 | AGENTS.md §4 必須 backlog (`docs/172`) |

---

## 6. 引継ぎ時の注意点

1. **本番は v370 で稼働中・無影響**。コミット未完了でも production deployment は live。
2. **admin split devMode は本日のテスト用に「HEAD + dryRun」状態**。v360-v370 dev 機能を確認したい場合は再 push（標準 OAuth client）。
3. **working tree を `git reset --hard` 等で破壊しないこと** — v360-v370 リリース作業と 2026-05-18 cleanup がまだ未コミット。
4. **シークレット衛生**: 本セッション中に OAuth code（短期認証クレデンシャル）がチャット履歴に残っているため、念のため [myaccount.google.com/permissions](https://myaccount.google.com/permissions) で Google Apps Script API 認可状態の確認を推奨。コード自体は 1 回交換で失効済み。
5. **clasp login 状態**: 現在 project-scoped OAuth client（dryRun 実行直後）。push 操作には標準 client への切替が必要。
6. **MEMBER_TYPE_CHANGE_IND_TO_SUPPORT シナリオ**: 今回失敗したが、これは API が `INDIVIDUAL↔SUPPORT` 直接変換を提供していないため。必要なら `updateMember_` 経由か新 API 設計が必要。今回の主要要件外。

---

## 7. 参照ドキュメント

- `AGENTS.md` — グランドルール入口（§0 シークレット絶対ルール）
- `HANDOVER.md` — 全体引継ぎ正本（このセッション要点を冒頭に追記済み）
- `docs/225_RELEASE_STATE_v360_to_v370_2026-05-17.md` — v360-v370 包括変更履歴
- `docs/224_RESUME_v360_2026-05-16.md` — v360-v370 作業再開ガイド + operator 残作業
- `docs/223_RELEASE_STATE_v360_2026-05-16.md` — v360 変更詳細
- `docs/09_DEPLOYMENT_POLICY.md` — デプロイ標準
- `docs/05_AUTH_AND_ROLE_SPEC.md` — 認証・権限
- `docs/03_DATA_MODEL.md` — DB スキーマ正本
- `memory/feedback_*.md` — 過去の罠と教訓
- `TaskList` ツール — タスク #6〜#15 で管理中

---

**この引継ぎ書を読めば次担当者は作業を再開できる状態。** 本番システムは無影響、コミット d110b48 は単独で意味を成し、v360-v370 残コミットは操作者確認後の作業として明確化済み。
