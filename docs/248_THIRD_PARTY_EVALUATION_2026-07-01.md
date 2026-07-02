# 248 第三者評価レポート（大型アップデート前・v376.51 時点）

作成日: **2026-07-01**
対象: 枚方市介護支援専門員連絡協議会 会員システム（React SPA + Google Apps Script + Google Spreadsheet DB / 3プロジェクト分離: public・member・admin）
現行本番: public `@358` / member `@117` / admin `@211`
評価方式: コード・設定・設計文書の **read-only 第三者監査**（侵入試験なし・5観点並列調査の統合）
評価軸: ①リレーション整合性 ②DRY 原則 ③ハードコーディング ④セキュリティ（セキュアコーディング5視点）＋修正案 ⑤GCP 実装 readiness
参照標準: ISO/IEC 25010 系品質特性 / OWASP ASVS 5.0 / OWASP Top 10:2021 / NIST CSF 2.0 / SSDF 1.1

> **本書の位置づけ**: 次の「大型アップデート」着手前の現況棚卸し。所見と修正案を正本化し、実装計画（別途）の入力とする。
> **検証メモ（重要）**: 本書の `file:line` と一部の性能数値は read-only 監査による参考値。実装着手時に spot 検証すること。所見の趣旨・方向性は5観点で相互整合している。

---

## 0. 総合サマリー

| 評価軸 | 総合判定 | 要点 |
|---|:---:|---|
| リレーション整合性 | △ 要改善 | Spreadsheet=FK制約なし。孤児/多態参照/削除連鎖が**コード依存**で修復ジョブに依存 |
| DRY 原則 | ○→△ | 単一情報源化の良例あり。API層・権限判定・カナ正規化で**約2,000行の重複余地** |
| ハードコーディング | ○ | ✅ シークレット直書き無し。ID/URL の本体直書きが数件（要定数/Properties 化） |
| セキュリティ（5視点） | ○（C→条件付き運用） | Critical 全是正済（`docs/109`）。残 High 1＝PBKDF2 強度（GCP で根治） |
| GCP 実装 readiness | 段階的推奨 | 破壊的移行不要。Phase 0（Secret Manager+Argon2id）は今すぐ低リスク |

**Critical 該当: 0 件**（`docs/109` の3件は v261-263 で是正済）。**High: 3 件**（下記）。

> **2026-07-02 追記**: 初版（5観点並列 read-only 監査）の主要所見を実コードで裏取りし訂正（末尾「検証・訂正ログ」）。**さらに削除モデルの設計精査（`docs/249`）で C1-C3 の深い実態が判明し、Cascade/孤児を High に再是正**（現 High: 4）。削除関連の権威ある分析は `docs/249` を正とする。

---

## 1. テスト観点表（ISO/IEC 25010 系 ＋ 依頼4軸）

凡例: ◎良好 / ○概ね良好・軽微 / △要改善 / ✕重大

| # | 品質特性 / 観点 | 評価 | 主要所見（重大度） |
|---|---|:---:|---|
| 1 | 機能適合性・正確性 | ○ | 申込者解決2モデルの誤用余地（High・v376.12 実害） |
| 2 | 信頼性＝リレーション整合性 | △ | FK制約なし・**部分 cascade**（会員/職員/認証/whitelist は削除コンソールで archive、研修申込/年会費/役員/請求は非cascade→孤児化し得る）（Med）／申込者参照の相互排他は概ね検証済・一部未検出（Med）／役員linkage XOR未検証（Med） |
| 3 | 　└ データ整合の自己修復依存 | △ | `repair*`/整合修復ジョブが**手動実行前提**（Med） |
| 4 | 　└ アーカイブ/退会移行 | △ | `_archive` は**実質常に空**。`archive*ByIds_` は名に反し **in-place soft delete**（行移動なし）で、`_archive` へ書込むのは dead code の自動3年移動のみ（Med・詳細 `docs/249` C1-C2） |
| 5 | 保守性＝DRY | △ | `api.ts` 約82%が helper 未使用の重複（High・~1,500行）／権限判定 front再実装（High） |
| 6 | 　└ 単一情報源化の到達度 | ◎ | 会計年度/menu-registry/mailTemplates/trainingOptions は良好 |
| 7 | 　└ カナ正規化 front/back | △ | front実装済だが API前検証で未使用→往路チェック不可（Med・UX） |
| 8 | 保守性＝ハードコーディング | ○ | Spreadsheet ID/Script ID routes/MEMBER_PORTAL_URL 本体直書き（High） |
| 9 | 　└ シークレット管理 | ◎ | 直書き無し・`getPasswordPepper_()` 経由・`.env*` gitignore |
| 10 | 　└ stale 定数 | △ | 旧アカウント直書きが**移行/診断ヘルパー内に残存**（Low・削除候補） |
| 11 | セキュリティ＝入力検証 | ○ | deny-by-default／deep-link sanitize／PW正規表現は良好。全endpoint一貫性やや不足（Med） |
| 12 | セキュリティ＝認証認可 | ◎ | server強制RBAC・session principal override（IDOR是正済）。v376.51 preview は権限昇格なし |
| 13 | 　└ v376.51 preview 境界 | ○ | client-only 書込ガード＝UI信頼向上（server は MASTER 不変で安全・Med限定） |
| 14 | セキュリティ＝機密保護 | △ | **PBKDF2 1万反復＜OWASP 60万目標**（High・pepperで緩和・GCPで根治） |
| 15 | セキュリティ＝エラー/ログ | ○ | fail-close徹底・PII非記録。REDIRECT ログ等の宛先出力は要確認（Low） |
| 16 | セキュリティ＝通信/依存 | ○ | HTTPS強制・`npm audit` 0・scope最小化（cloud-platform 要精査 Med）／XFrame ALLOWALL（Med） |
| 17 | 性能効率性 | △ | google.script.run 由来 API 応答が重い（GCP Phase2 で改善見込・数値は推定） |
| 18 | 移植性＝GCP readiness | ○ | 段階移行設計済（`docs/239`/`240`/`172`）。Phase0 低リスク |

---

## 2. 観点別・所見と修正案

### A. リレーション整合性（信頼性）

構造的前提: Spreadsheet を DB とするため **DB レベルの FK 制約・トランザクション・cascade が存在せず、参照整合性はすべてアプリコード依存**。`repair*` 系関数が多数存在する事実自体が「過去に整合性が崩れた」証跡。

| 所見 | 重大度 | 参考位置 | 修正案 |
|---|:---:|---|---|
| **cascade がほぼ未実装＝子レコードの広範な孤児化** | **High**（再是正: 初版High→一次訂正Med→精査で High 復帰） | `executeDeleteMember_`（gas-src 24345-24404） | 実体は会員/職員/認証/whitelist を **in-place soft delete のみ**。年会費/研修申込は削除ログに snapshot だが **live 無処理**。**役員/請求/振込口座/支払い/変更申請は snapshot も soft delete もされず完全放置**（真の孤児）。→ a1 cascade アーカイブへ再設計（**`docs/249`**） |
| 申込者参照の相互排他が宣言的でなく、一部混在が未検出 | **Med**（訂正: 初版 High） | `getTrainingApplicationIntegrityIssues_`（gas-src 約13345-13398） | **実際は外部×職員混在(13390)・会員×職員不一致(13380)等を検証済**。会員+職員の併存は正当（v360 canonical）。未検出は「MEMBER 行に外部申込者ID が紛れ込む」等の narrow ケースのみ→宣言的制約＋`test:er-sync` で補強 |
| 申込者解決 legacy 関数の誤用余地（v376.12 実害源） | **High**→緩和済 | `getApplicationApplicantType_`（約13292）/ `getCanonicalApplicantRef_`（約13313） | legacy に `@deprecated`、送信/名簿/本人解決は canonical へ統一を lint/grep gate 化、v377 で撤去（※`MEMORY project_applicant_resolution_two_models` の「意図的併存」は尊重しつつ誤用防止を強化） |
| 役員 linkage の member/staff XOR 未検証 | **Med** | `assignOfficer`/`updateOfficerLinkage` | XOR 検証を追加（両方填充を拒否） |
| `_archive` が**実質常に空**＋`archive*ByIds_` の命名詐称 | **Med** | `archiveMembersByIds_`(24130) 等は行移動でなく **in-place soft delete**（`_archive` へ書込まない）。`_archive` へ書込むのは dead code の自動移動 `moveWithdrawnRowsToArchive_`(24563) のみ | a1 cascade アーカイブへ再設計（**`docs/249`**）。関数名を move へ是正。活性化は破壊的＝要バックアップ+承認 |
| CM番号/職員重複が修復ジョブ依存 | **Med** | `repairDuplicateStaffRecords_`/`repairMemberCareManagerDuplicates_` | bulk import 前の重複プレビュー画面 |
| 列順ドリフト（T_研修申込 定義 vs er-metadata） | **Med** | gas-src 約631 vs `er-metadata.json` | `test:er-sync` に列順チェック追加 |
| 会計年度ステータス front/back 統一 | ◎ 良好 | `src/shared/memberFiscalStatus.mjs` | 変更不要（単一情報源＋build注入の模範） |

**XOR 制約の集約**: T_研修申込（3-FK）/ T_役員（member∨staff）/ T_LINE投稿依頼（targetType×targetId）の XOR ルールを1箇所（例 `docs/ER_CONSTRAINTS.md` or er-metadata 拡張）に明記し `test:er-sync` で自動検証すると再発防止に有効。

### B. DRY 原則

| 所見 | 重大度 | 参考位置 | 修正案 |
|---|:---:|---|---|
| `api.ts` の約85メソッドが `runAction`/`callAction` helper 未使用で `google.script.run` boilerplate 重複 | **High** | `src/services/api.ts`（helper: 約943 `runAction` / 約1225 `callAction`） | 全 mutation を helper 経由へ統一（~1,500行削減・リスク低）。**この際 v376.51 の書込ガード（プロトタイプ包み）と整合確認** |
| 権限判定の frontend 再実装 | **High** | `src/App.tsx`（`canManageLine` inline 等・約5273/5279、`ok()` 約1628） | `src/shared/rbac-util.mjs`（`canAccessMenu`/`canManageLinePost`）へ集約し front import。※v376.51 で追加した inline もこの対象 |
| カナ正規化が API 前検証で未使用 | **Med** | `src/utils/kanaNormalize.ts`（front実装済だが未適用） / GAS `normalizeKana_` 約19420 | `src/shared/kanaNormalize.mjs` 化＋form pre-validation 適用（往路フィードバック・UX 向上） |
| 検証正規表現の front↔back 二重定義 | **Med** | `api.ts` 約343-345 / gas-src 約4037-4066 | `src/shared/validators.ts` に集約・GAS 注入 |
| 既定メール本文の一部重複 | **Med** | gas-src 約20-100 の DEFAULT_SUBJECT/BODY | メールテンプレ管理完成後に T_メールテンプレート へ集約 |
| 既存の単一情報源化 | ◎ 良好 | memberFiscalStatus / menu-registry / mailTemplates / trainingOptions | 変更不要（模範パターン） |

### C. ハードコーディング

AGENTS.md §3: 識別子はソース本体に直接埋め込まない（定数化・設定・環境変数）。シークレットは確認有無に関わらず絶対に直書きしない。

| 所見 | 重大度 | 参考位置 | 修正案 |
|---|:---:|---|---|
| Spreadsheet ID / Script ID routes / `MEMBER_PORTAL_URL` の本体直書き | **High** | gas-src 約3 / 約850-852 / 約19 | Script Properties 経由取得（`getScriptIdRoutes_` 等）＋ public 側 `src/config/publicPortal.ts` と同じ「定数化＋コメント明記」パターンへ |
| build script 内の Script ID 直書き | **High** | `scripts/gas-boundary-utils.mjs` 約676 | Properties/設定経由へ |
| 旧アカウント直書き（**移行/診断ヘルパー内**） | **Low** | gas-src 約1209/1258（`migrateAdminPermissions`/`repairWhitelistData`）ほか診断・test fixture | **ライブの権限判定ではない**（毎リクエスト認可は `checkAdminBySession_` が whitelist テーブル参照）。stale 除去 or 一回限り運用関数として整理 |
| lock timeout 等マジック数値 | **Low** | `lock.waitLock(10000)` 多数 | 定数化 |
| シークレット直書き | ◎ 良好 | — | 検出無し（pepper は `getPasswordPepper_()` 経由・`.env*` gitignore） |

> **訂正メモ**: 初回監査は L1209/1258 を「権限判定ロジック」と分類したが、本体確認の結果 **v118 スキーマ移行期の一回限りヘルパー**（`migrateAdminPermissions` / `repairWhitelistData`）内であり、ライブ認可には無関係。重大度を Low に下方修正。

### D. セキュリティ（セキュアコーディング5視点）

- **Critical: 0**（`docs/109` の①匿名 API 認可不足 ②自己操作 IDOR ③SHA-256 単発 は v261-263 で是正: deny-by-default / session principal override / PBKDF2+pepper）
- **High（H1）: パスワード KDF 強度** — PBKDF2-HMAC-SHA256 **1万反復 < OWASP 目標 60万+**。GAS V8 計算制約が原因。pepper（Script Property）で追加層があるが原本強度は限定 → **GCP Phase 0（Argon2id/Cloud Run・`docs/240`）が根治策**
- **Medium**:
  - M1 `HtmlService.XFrameOptionsMode.ALLOWALL` が3 split 共通 → **member/admin は `DENY`**、public のみ ALLOWALL に
  - M2 OAuth scope 最小化（**裏取り済・要削減**）: **member split が `drive` と `cloud-platform` を保持**（`gas/member/appsscript.json`）。会員マイページは Drive 直接操作も Secret Manager も使わないため**削除候補**。`cloud-platform` は 3 split すべてに付与されており、Secret Manager 連携が要る境界（pepper 取得を行う境界）に限定するのが最小権限。admin は `gmail.send`/`gmail.settings.basic`/`userinfo.email` を追加保持（用途あり・正当）
  - M3 v376.51 role preview の client-only 書込ガード → **権限昇格なし（server は MASTER 不変）で実リスク低**。強化案: server response に `previewMode` flag を載せ client と突合
- **Low**: email 正規表現簡易（実送信 bounce で自己修正）、webapp access レベル混在の運用手順化、REDIRECT ログの宛先出力確認
- **AI/Agent 固有**（prompt injection / excessive agency / memory poisoning）: いずれも Low（eval 不使用・OAuth scope 明示・§0 シークレット徹底）

準拠度: OWASP ASVS L1 **PASS** / L2 部分 / Top10:2021 主要項目 Compliant / NIST CSF・SSDF は Govern/Protect 良好・Detect(継続監視) と実行レベル自動化(CI gate) が運用確認待ち。

---

## 3. GCP 実装を見据えた評価（段階案）

| Phase | 内容 | 効果 | リスク/rollback | 推奨時期 |
|---|---|---|---|:--|
| **0** | pepper→**Secret Manager**＋**Argon2id/Cloud Run**（`docs/239`/`240`） | H1 根治・OWASP準拠 | 低・Script Properties fallback | 🟢 今すぐ |
| **1** | GAS 側 API 認可の恒久強化＋E2E gate 常設 | ASVS L2 下地 | 低〜中・feature flag | 🟡 本大型UPと同梱 |
| **2** | DB を Spreadsheet→**Firestore / Cloud SQL** | **FK/トランザクション獲得（§2-A の構造的解決）**＋性能 | 中・二重化整合 | 🟠 将来（会員500+ or UX/整合性課題時） |
| **3-4** | Firebase Hosting / GAS 削減 | 保守性・provider統一 | 中〜高 | 🔴 v2.0 以降 |

**結論**: GCP 化は破壊的移行ではなく段階的強化。大型アップデートに合わせるなら **Phase 0（必須 backlog・`docs/172`）＋ Phase 1** の同梱が費用対効果最良。**Phase 2（DB移行）は §2-A のリレーション整合性課題を構造的に解決する**ため、性能だけでなく信頼性観点でも価値が高い（本体機能とは切り離して後続判断可）。コストは会員<1,000 なら GCP Always Free 枠内で概ね現状同等。

> 参考数値（API latency 10-30倍改善等）は推定。確定判断前にベンチ実測を推奨。

---

## 4. 統合ロードマップ（優先度）

**即時（大型UP着手前・低コスト・高効果）**
1. `src/shared/rbac-util.mjs` に権限判定集約（front重複解消＋v376.51 inline 是正） … DRY High
2. Script ID / Spreadsheet ID / URL の Properties/定数化 … ハードコーディング High
3. pepper 3-split 設定の再確認（`AGENTS §4.3`・値は非表示）

**大型UPと同梱（恒久是正）**
4. `api.ts` boilerplate を helper 統一（~1,500行減・書込ガード整合） … DRY High
5. 残関連（研修申込/年会費/役員/請求）の cascade soft delete 追加＋役員 XOR 検証＋`test:er-sync` 拡張 … 整合性 Med
6. **GCP Phase 0**（Secret Manager+Argon2id）で H1 根治 … セキュリティ High
7. XFrame を member/admin `DENY` 化 … セキュリティ Med

**将来**
8. GCP Phase 2（Firestore/Cloud SQL）＝リレーション整合性の構造的解決＋性能
9. カナ正規化/検証正規表現の shared 化、`_archive` 活性化判断（破壊的＝要承認）

---

## 検証・訂正ログ（2026-07-02 自己レビュー・実コード裏取り）

初版は5観点並列の read-only 監査であり、`file:line` 未検証を明示していた。大型アップデートの判断根拠となるため主要所見を実コードで裏取りし、以下を訂正した。

| # | 所見 | 初版 | 検証結果 | 訂正後 |
|---|---|:---:|---|:---:|
| V1 | Cascade 削除なし | High | **一次訂正(Med)は誤り**（`archive*ByIds_` の名を信用した）。実体は in-place soft delete。年会費/研修申込は snapshot のみ live 無処理、役員/請求/振込口座/支払い/変更申請は完全放置＝**広範な孤児**（`docs/249` C3） | **High（復帰）** |
| V2 | `_archive` 常時空・dead code | High | **一次訂正は誤り**: `archiveMembersByIds_` は `_archive` へ書込まず in-place soft delete。`_archive` は実質常に空＝**初版が正しかった**。命名詐称を `docs/249` C1 で是正 | **Med（命名/設計）** |
| V3 | 研修申込 3-FK 厳格 XOR 未検証 | High | `getTrainingApplicationIntegrityIssues_` は外部×職員混在・会員×職員不一致等を**検証済**。会員+職員併存は正当。未検出は narrow ケースのみ | **Med** |
| V4 | OAuth `cloud-platform` 要精査（一般） | Med | **member split が `drive`+`cloud-platform` 保持を実ファイルで確認**＝具体的削除候補として強化 | **Med（具体化）** |
| V5 | XFrame ALLOWALL（3 split） | Med | gas-src L889 に1箇所＝3 split 全反映を確認。**所見どおり** | Med（変更なし） |
| V6 | api.ts 約82% がインライン重複 | High | runAction 4 + callAction 14 = 18／processApiRequest 105 ＝**約83%**。**所見どおり** | High（変更なし） |
| V7 | 旧アカウント直書き＝ライブ認可 | （初版で既訂正） | `migrateAdminPermissions`/`repairWhitelistData` 内の一回限りヘルパー＝ライブ認可に無関係 | Low（訂正済） |
| — | GCP latency「10-30倍」等の出典 `docs/33` | — | **`docs/33` は実在しない**（`docs/37` GAS quotas は実在）。数値は推定として扱い、確定前にベンチ実測 | 注記済 |

**評価プロセスへの含意**: 並列監査は網羅性に優れるが、単体では所見の重大度を過大評価しがち（特に「〜なし/常時〜」の断定）。**重大度 High 以上は着手前に実コード裏取りを必須**とする（本ログがその実施記録）。

## 5. 参照

- `docs/109_THIRD_PARTY_ASSESSMENT_2026-04-20.md`（前回第三者評価・Critical 是正の起点）
- `docs/171_PASSWORD_HASH_STANDARD_ALIGNMENT_2026-04-30.md`（PBKDF2 標準整合）
- `docs/172_DEFERRED_SECURITY_BACKLOG_SECRET_MANAGER_KDF_2026-05-01.md`（必須・破棄禁止 backlog）
- `docs/239_OPERATOR_GCP_SECRET_MANAGER_SETUP_2026-05-20.md` / `docs/240_DESIGN_CLOUD_RUN_ARGON2ID_2026-05-20.md`
- `docs/246_DESIGN_MENU_BASED_CUSTOM_ROLES_RBAC_2026-05-28.md`（RBAC）
- `docs/247_TEST_VIEWPOINT_EVAL_2026-06-06.md`（前回テスト観点表評価）
- `docs/03_DATA_MODEL.md` / `docs/er-metadata.json`（スキーマ正本）
- `AGENTS.md`（§0 シークレット / §3 DRY・ハードコーディング / §4.3 pepper / §6 セキュリティ）

---

**評価者**: Claude Code（read-only 第三者監査・5観点並列調査の統合）
**次回再評価推奨**: GCP Phase 0 実施後、または大型アップデート完了時
