# 246. 設計: メニュー単位カスタムロール RBAC

作成日: 2026-05-28
ステータス: **Phase 1-A 完了 (v376.24 @179)** / Phase 1-B 着手予定
種別: Explanation（設計書）
関連正本: `docs/05_AUTH_AND_ROLE_SPEC.md`（実装後に反映）, `docs/02_ARCHITECTURE.md`, `docs/03_DATA_MODEL.md`

## Phase 1-A 完了記録（2026-05-28 / v376.24）

| 項目 | 内容 |
|---|---|
| デプロイ | admin split @179（外部 API 表面・DB schema・whitelist 列は不変のため member/public は未 redeploy） |
| 単一情報源 | `scripts/menu-registry.mjs`（MENU_REGISTRY / ACTION_TO_MENU / LEGACY_ROLE_TO_MENUS / LEGACY_ROLE_TRAINING_SCOPE / LEGACY_ROLE_DELTA_ACCEPTED / `serializeMenuRegistryForGas()`） |
| build 注入 | `scripts/gas-boundary-utils.mjs::injectMenuRegistryPlaceholders` を build:gas / build:gas:member / build:gas:admin から呼び、`gas-src/Code.full.gs` の placeholder を上書き |
| 認可ロジック | `processApiRequest` 内の `requiredPerms.indexOf(permLevel) === -1` を `!isActionAllowedByMenu_(action, permLevel)` へ置換。MASTER は全許可、他は ACTION_TO_MENU[action] ∈ role.allowedMenus を評価 |
| session 拡張 | `checkAdminBySession_` 戻り値に `roleId`/`roleName`/`isMaster`/`allowedMenus`/`trainingEditScope` を追加。既存 `adminPermissionLevel` は後方互換維持（Phase 1-B で T_権限ロール の UUID へ移行） |
| TR scope | `saveTraining_` (旧 11631-11637) の `adminPerm === 'TRAINING_REGISTRAR'` ハードコードを `trainingEditScope === 'OWN'` 判定へ置換 |
| 検証 | `scripts/test-menu-registry.mjs` 7 件 全 PASS（snapshot 等価性 + 未マップ action 検出 + 古い delta entry 検出 + MASTER 全許可 + menu id 整合）。prerelease に統合 |
| 許容デルタ（LEGACY_ROLE_DELTA_ACCEPTED, 7 件） | すべて TR/TM が training-manage menu 経由で旧不許可 action にアクセス可能化する単一方向。MA は完全に挙動不変。逆方向（許可→deny）デルタは 0 件 |

### 許容デルタ内訳
- TR が softDeleteTraining / restoreTraining / sendTrainingReminder / getAdminEmailAliases / sendTrainingMail / setupTrainingFileFolder にアクセス可能化（OWN scope で `saveTraining_` は引き続き保護）
- TM が setupTrainingFileFolder にアクセス可能化（冪等な初回フォルダ設定）
- GENERAL の fetchAllData は到達不能（`checkAdminBySession_` で GENERAL は弾かれる）

### Phase 1-A 完了後の残置と次の作業
- `ADMIN_ACTION_PERMISSIONS` (gas-src/Code.full.gs:1487-1607) は action 集合の whitelist 用途で残置。値（role 配列）は dead code。Phase 1-B で撤去予定
- Phase 1-B: `T_権限ロール` 新設 + whitelist にロールID列追加（並行運用、権限コード列保持）+ 初期4ロール（編集可能）+ MASTER built-in + operator 移行スクリプト `migrateToRoleBasedRBAC_v246_DRYRUN`/`_APPLY`


## 0. 目的と背景

現行は固定5ロール（MASTER / ADMIN / TRAINING_MANAGER / TRAINING_REGISTRAR / GENERAL）で、各 backend action を `ADMIN_ACTION_PERMISSIONS`（action→許可ロール固定マップ）に紐付け、frontend `Sidebar.tsx` が `isFullAdmin` / `isTrainingOnly` / `isMaster` の粗い分岐でメニューを出し分けている。

**要望**: 固定ロールをやめ、**マスターがカスタムロール（権限名 ＋ アクセス可能なサイドメニュー集合）を定義できる RBAC** に刷新する。MASTER は全権限固定。

## 1. 確定した設計方針（ユーザー確認済み 2026-05-28）

| # | 決定事項 | 内容 |
|---|---|---|
| 1 | 権限粒度 | **メニュー（画面）単位のアクセス可否**を基本とする。例外として**研修管理のみ**「自分が登録した研修だけ編集可」スコープ（既存挙動）を保持 |
| 2 | 既存ロール | **MASTER のみ built-in**（全権限・編集/削除不可）。他は全てカスタムロール化。既存 ADMIN/研修管理者/研修登録者/一般 は編集可能な初期カスタムロールへ移行 |
| 3 | ロール割当 | **1 アカウント = 1 ロール**（現行踏襲） |
| 4 | メニュー単位 | **個別メニュー項目単位**（約15項目） |
| 5 | 特権メニュー | 「権限管理」「データ管理」は **MASTER 専用**（カスタムロールに付与不可）。特権昇格防止 |
| 6 | ロール削除 | 割当中アカウントがあれば**削除拒否**（再割当を促す） |

## 2. グローバルスタンダード準拠点（2026 調査）

- 最小権限の原則 / Role–Resource–Action マトリクスで「誰が何を」を定義
- **permission-aware rendering（UI 隠蔽）＋ backend 全 API での強制**を両立（フロント隠蔽だけは不可）
- role explosion 回避（テンプレ複製・権限 diff・定期レビュー）
- 特権昇格防止・MASTER ロックアウト防止・監査ログ

出典: Microsoft Azure RBAC best practices, NIST/IBM RBAC guide, Oso/NocoBase RBAC design, techprescient 2026。

## 3. メニュー定義レジストリ（単一情報源）

コード上に**メニュー定義の唯一の正本**を置き、(a) Sidebar 描画、(b) 権限マトリクス UI、(c) backend の action→menu 判定 の3用途で共有する（二重管理是正方針 v376.18〜.23 を踏襲）。

各メニュー: `{ id, label, group, actions: string[], masterOnly?: boolean }`

| menu id | ラベル | group | masterOnly |
|---|---|---|---|
| `members-list` | 会員一覧 | 会員管理 | |
| `change-requests` | 変更申請管理 | 会員管理 | |
| `annual-fee` | 年会費管理 | 財務・帳票 | |
| `payment-history` | 支払い履歴管理 | 財務・帳票 | |
| `claim-management` | 請求管理 | 財務・帳票 | |
| `roster-export` | 名簿出力 | 財務・帳票 | |
| `mailing-list-export` | 宛名リスト出力 | 財務・帳票 | |
| `training-manage` | 研修管理 | 研修・通知 | （編集スコープ ALL/OWN あり） |
| `bulk-mail` | 一括メール送信 | 研修・通知 | |
| `line-post` | 公式LINE投稿依頼 | 研修・通知 | |
| `officer-management` | 役員管理 | 組織管理 | |
| `admin-settings` | システム設定 | システム | |
| `system-permissions` | 権限管理 | システム | ✅ MASTER 専用 |
| `data-management` | データ管理 | システム | ✅ MASTER 専用 |

各 backend action は所属メニューにマッピングする（例: `getAnnualFeeAdminData`/`saveAnnualFeeRecord`→`annual-fee`、`saveTraining`/`getTrainingManagementData`/roster 系→`training-manage`）。**認可規則**: action 許可 ⟺ `role.isMaster` または `action の menu ∈ role.allowedMenus`。

## 4. データモデル

### T_権限ロール（新規）
| 列 | 説明 |
|---|---|
| ロールID | UUID（主キー） |
| ロール名 | 一意・"MASTER" 予約・必須 |
| 説明 | 任意 |
| 許可メニューJSON | menu id の配列。MASTER は無視（全許可） |
| 研修編集スコープ | `ALL` \| `OWN`（training-manage 付与時のみ意味を持つ） |
| 組込フラグ | true=編集/削除不可（MASTER のみ） |
| 表示順 | 整数 |
| 作成日時 / 更新日時 / 削除フラグ | 標準列 |

### T_管理者Googleホワイトリスト（変更）
- 既存「権限コード」列を**ロールID参照**へ移行（後方互換: 旧コード値→対応ロールIDへ変換）。

## 5. backend 強制

- `checkAdminBySession_()` の戻り値に `roleId / roleName / allowedMenus[] / trainingEditScope / isMaster` を含める（既存 `loginId` キーは維持。[[adminSession のキーは loginId]] の罠に注意）。
- `processApiRequest`: admin action の所属メニューを引き、`isMaster || menu ∈ allowedMenus` でなければ deny（deny-by-default 維持）。`ADMIN_ACTION_PERMISSIONS` を action→menu マップ＋ロールの allowedMenus 評価へ置換。
- 研修編集系（`saveTraining_` 等）: `trainingEditScope === 'OWN'` のとき `T_研修.登録者メール == 自分` を強制（現行 `TRAINING_REGISTRAR` ハードコード 11631-11635 を置換）。
- `system-permissions` / `data-management` の action は `isMaster` のみ許可（カスタムロールに付与不可をサーバ側でも担保）。

## 6. frontend

- **Sidebar 動的化**: `role.allowedMenus`（MASTER は全件）からメニュー描画。現行 `isFullAdmin/isTrainingOnly` 撤去。メニュー定義レジストリを共有。
- **権限管理コンソール拡張**（`system-permissions` 画面）:
  - ロール一覧（作成 / 複製 / 編集 / 削除）
  - 権限マトリクス（メニュー × チェックボックス。MASTER 専用メニューは非活性）
  - 研修管理に「全研修編集可 / 自登録のみ」ラジオ
  - ロール名・説明編集
  - 「管理者権限を追加」の権限ドロップダウンをカスタムロール選択に変更
- permission-aware rendering: `allowedMenus` にない view への直接遷移を弾く fallback。

## 7. ガードレール（必須）

- **MASTER ロックアウト防止**: 有効 MASTER 最低1名必須。最後の MASTER の降格/削除/無効化を拒否。
- **特権昇格防止**: `system-permissions`/`data-management` は MASTER 専用（UI 非活性 + サーバ拒否）。
- **ロール削除**: 割当中アカウントがあれば拒否。
- **ロール名**: 重複禁止・"MASTER" 予約。
- **監査ログ**: ロール CRUD・ホワイトリスト変更を `appendAdminAuditLog_` へ。
- backend deny-by-default 維持。3境界分離（admin/member/public）は不変。

## 8. 移行（operator が Apps Script editor から1回 Run）

1. `T_権限ロール` 作成（`rebuildDatabaseSchema` 経路 or 専用 migration）。
2. MASTER 組込登録。
3. 既存ロールを編集可能な初期カスタムロールとして生成:
   - 管理者（ADMIN）→ 権限管理・データ管理を除く全メニュー
   - 研修管理者（TRAINING_MANAGER）→ training-manage（ALL）/ bulk-mail / line-post 等の研修系
   - 研修登録者（TRAINING_REGISTRAR）→ training-manage（**OWN**）
   - 一般（GENERAL）→ 最小（共有メモ等の読み取りのみ相当）
4. `T_管理者Googleホワイトリスト` の権限コードを対応ロールIDへ変換。
5. **移行後に既存挙動が完全維持される**ことを検証（dryRun + 監査）。

## 9. 段階リリース

| Phase | 内容 | デプロイ |
|---|---|---|
| **Phase 1** | データモデル + メニュー定義レジストリ + backend menu 強制 + 移行（**挙動完全維持**） | 全3 split |
| **Phase 2** | 権限管理コンソール（ロール CRUD + 権限マトリクス UI + ガードレール） | admin |
| **Phase 3** | Sidebar 動的化 + permission-aware routing | admin（必要なら member/public bundle 同梱） |

各 Phase で `build × 3 → prerelease（境界 audit） → 段階デプロイ → 正本更新`。boundary audit（admin/member/public）でメニュー↔action↔ロールの整合を機械検証する仕組みを追加する。

## 10. 未確定・将来課題

- frontend `api.ts` 呼び出し ↔ backend dispatch の codegen 連動（今回スコープ外）。
- メニュー × 操作（CRUD）粒度への拡張（今回は研修の OWN スコープのみ。将来必要なら権限値を拡張）。
- ABAC/ReBAC（事業所スコープ等）への発展余地。
