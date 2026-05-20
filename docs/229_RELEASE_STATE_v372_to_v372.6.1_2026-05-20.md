# 229. v372 系包括リリースステート（v372 → v372.6.1）

更新日: 2026-05-20  
対象: v372 / v372.1 / v372.2 / v372.3 / v372.4 / v372.5 / v372.6 / v372.6.1（全 8 リリース）  
現行本番: integrated/public `@340` x2 / member `@98` / admin `@142`

## 0. リリース一覧と要点

| Version | Date | テーマ | コミット |
|---|---|---|---|
| v372 S1 | 2026-05-19 | 名簿出力 Visual Designer 骨組み（外部 SS テンプレ依存廃止の第 1 段階） | `3dbccc4` + hotfix `5fb1647` |
| v372.1 S1.5 | 2026-05-19 | 出力単位（会員/職員/混合）+ 行フィルタ + 上部保存ボタン | `d87d551` |
| v372.2 S1.6 | 2026-05-19 | Tab 分離 + 統合フィールド + 折りたたみ + バッジ + 動的絞り込み | `bb1cbde` |
| v372.3 S1.6.1 | 2026-05-19 | 演算子最小化 + 否定トグル + 年度 select + 後方互換 | `92bbd21` |
| v372.4 | 2026-05-19 | 介護支援専門員番号 admin 例外バリデーション緩和（HN/HS プレフィックス） | `5cb4321` |
| v372.5 | 2026-05-20 | 公開ポータルに職員情報変更フロー追加（staffUpdate） | `ae1bd51` |
| v372.6 | 2026-05-20 | 文字化けバグ修正 + 全空送信防止 + デザイン整合性改善 | `7a21634` |
| v372.6.1 | 2026-05-20 | 送信ボタン disable + ヒント表示 | `4ec2050` |

## 1. 名簿出力 Visual Designer（v372 → v372.3）

### 1.1 設計背景
旧 `RosterExport.tsx` は外部 Google Sheets テンプレ依存で、柔軟性・カスタマイズ性・項目固定が課題。「ほぼ使えない」とユーザー報告。設計書 `docs/228_ROSTER_REDESIGN_2026-05-19.md` に基づき 5 Sprint で全面刷新。

### 1.2 v372 S1: 骨組み
**バックエンド**:
- `getRosterFieldDictionary_()` — 40 フィールド宣言（auto/member/individual/office/staff/fee/computed）
- `getRosterDesignerData_(payload)` — 生データを Record 形式で返却（outputUnit: MEMBER/STAFF/MIXED）
- `loadRosterTemplatesV2_` / `saveRosterTemplateV2_` / `deleteRosterTemplateV2_` / `duplicateRosterTemplateV2_`
- 保存先: `T_システム設定.ROSTER_TEMPLATE_LIBRARY_V2`（JSON 配列）

**フロント**:
- 新規 `src/components/RosterDesigner.tsx`
- 旧 `RosterExport.tsx` は `roster-export-legacy` ビューとして残置（S5 で完全削除予定）

**Sidebar 表示**:
- 「名簿出力」→ `RosterDesigner`
- 旧 UI は到達不能

### 1.3 v372.1 S1.5: 出力単位 + 行フィルタ
- 出力単位 3 択: 会員単位 / 事業所職員単位 / 混合
- 列ごとの行フィルタ（rowFilter）+ AND 評価 + プレビュー上 chip 表示
- 演算子セット: string(8) / number(9) / date(6) / enum(4) / boolean(1)

### 1.4 v372.2 S1.6: Tab 分離 + 統合フィールド
- タブ式 2 ステップ（テンプレ設計 / プレビュー&出力）
- 統合フィールド（polymorphic）: `autoName` / `autoKana` / `autoEmail` / `autoCareManagerNumber`
- グループ 7 種に細分化: auto / member / individual / office / staff / fee / computed
- 折りたたみ + 検索 + エンティティバッジ（会員/職員）
- 出力単位連動の動的絞り込み

### 1.5 v372.3 S1.6.1: UD 強化
- 演算子セット縮小: notContains/notEquals/notIn 廃止 → 「否定」トグルで集約（Linear 流）
- 年度フィールド `<select>` 化（valuePicker: 'year'）
- 後方互換: legacy notXxx を読込時に自動変換

### 1.6 S2-S5 残作業
| Sprint | 内容 |
|---|---|
| S2 | @dnd-kit drag-drop / リアルタイムプレビュー強化 / 列幅 / 日付・数値書式 |
| S3 | 計算式（内製簡易式）・条件付き書式 |
| S4 | PDF 出力（window.print + @page CSS）+ A4/A3/縦横 |
| S5 | Excel 出力 + 旧 RosterExport 完全削除 |

## 2. 介護支援専門員番号 admin 例外（v372.4）

### 2.1 背景
地域包括支援センターに所属する **介護支援専門員以外**（看護師・保健師・社会福祉士等）の例外登録を可能にする要望。

### 2.2 バリデーション規約
| 場面 | ルール |
|---|---|
| 公開ポータル（入会申請・変更申請・退会申請） | **厳格**: 8 桁半角数字 `/^\d{8}$/` |
| 会員マイページ | **厳格**: 8 桁半角数字 |
| admin 会員詳細編集（`MemberDetailAdmin`） | **緩和**: 8 桁数字 **または** 1〜10 桁半角英数字 `/^[A-Za-z0-9]{1,10}$/` |
| admin 事業所職員詳細編集（`StaffDetailAdmin`） | 同上 |

### 2.3 権限制限
- **MASTER / ADMIN 権限のみ**緩和許可
- `isAllowedRelaxedCmNumber_(session)` で単一判定
- 二重防御: ADMIN_ACTION_PERMISSIONS で updateMember/updateStaff 自体が MASTER/ADMIN 限定

### 2.4 DB 保存時の正規化
- `normalizeCmNumberForKey_`: trim + 空白除去 + **toUpperCase**
- `normalizeCmNumberForStorage_`: trim + toUpperCase
- 既存純 8 桁数字データは正規化後も同値（数字に toUpperCase 無影響）

### 2.5 UI 注意書き
```
※ 通常は 8 桁半角数字。例外的に介護支援専門員以外を登録する場合のみ、半角英数字 10 桁まで入力可。
看護師・保健師等は HN + 事業所番号下 8 桁、社会福祉士は HS + 事業所番号下 8 桁。
```

## 3. 公開ポータル 職員情報変更（v372.5）

### 3.1 設計背景
会員マイページに入らずに、公開ポータルから事業所代表者が既存職員の氏名・カナ・メール・CM 番号を変更申請できるようにする。

### 3.2 新規 API
- `getPublicEnrolledStaffList_(token)` — HMAC token 経由で在籍職員一覧取得
  - 10 桁等の admin 緩和 CM 番号は `careManagerNumberLocked=true` で返却 → UI で disable

### 3.3 申請データモデル拡張
`T_変更申請.申請内容JSON` の構造:
```json
{
  "fields": { "officeName": "...", ... },
  "staffAdd": [...],
  "staffRemove": [...],
  "staffUpdate": [
    {
      "staffId": "...",
      "lastName": "...",  // 変更したいフィールドのみ含む
      "email": "...",
      ...
    }
  ]
}
```

### 3.4 承認時の動作
`approveAdminChangeRequest_` MEMBER_UPDATE ブランチで `staffUpdate` を適用:
- 所属検証（memberId 一致）でセキュリティ担保
- 10 桁等 admin 緩和 CM 番号は更新拒否（保護）
- `updateStaff_` 経由で反映
- メール変更時は **旧アドレス・新アドレス両方** に変更通知メール送信

### 3.5 UI 注意点
- CM 番号変更時の警告: 「ログイン ID が変わる」「変更後は新 CM でログイン」
- 10 桁特殊 CM 番号: 入力欄 disable + 「管理者にご連絡ください」案内

## 4. バグ修正 + デザイン整合性（v372.6 / v372.6.1）

### 4.1 不具合 1: 申請者表示名が `?????????????`
**root cause**: `Utilities.base64EncodeWebSafe()` / `computeHmacSha256Signature()` に charset 未指定で日本語が ISO-8859-1 解釈 → `?` 置換  
**修正**: `Utilities.Charset.UTF_8` を encode/verify 両側で明示

### 4.2 不具合 2: 全空欄で申請送信可能
**修正**:
- バックエンド `submitPublicChangeRequest_`: 全空チェック → エラー返却
- フロント `MemberUpdateForm.tsx`: `useMemo` で `hasAnyInput` 計算 → 送信ボタン disable + ヒント表示

### 4.3 デザイン整合性
- AddressInput の必須マーク `*` 削除（required 属性も削除）→「空欄=変更なし」モデル統一
- 「新しい情報を入力」上部に強調ガイダンスバナー（violet-50 + 📝 + 箇条書き 3 項目）
- プレースホルダー「例:」プレフィックス統一

### 4.4 cleanup 関数
`cleanupCorruptChangeRequestsV372` 関数追加（admin Apps Script editor から手動 Run）:
- T_変更申請 で `???...` / `？？？...` を含む行を soft delete
- 監査ログ記録 (`CLEANUP_CORRUPT_CHANGE_REQUESTS_V372_6`)

## 5. 影響範囲・破壊リスク評価

| 項目 | 影響 |
|---|---|
| 既存 OAuth トークン | v372.6 で UTF-8 fix によりすべて無効化（30 分以内に自動失効・実害なし） |
| 既存純 8 桁数字 CM 番号 | v372.4 大文字化で影響なし（数字に toUpperCase 影響なし） |
| 旧 RosterExport ユーザー | v372 で UI 非表示。コード残存・S5 で削除予定 |
| ROSTER_TEMPLATE_LIBRARY_V2 既存テンプレ | v372.1〜v372.3 で legacy notXxx → 自動変換（normalizeTemplate_） |
| バックエンドメール送信 | v371.1〜v371.2 の 4 階層ガード継続。v372 系で変更なし |

## 6. T_変更申請 スキーマ拡張（v372.5）

T_変更申請 自体のカラム追加はない。`申請内容JSON` の構造のみ拡張:

```
申請内容JSON 構造 (v372.5〜):
{
  "fields": Record<string, string>,
  "staffAdd": Array<{lastName, firstName, lastKana, firstKana, careManagerNumber, email}>,
  "staffRemove": Array<{lastName, firstName, careManagerNumber}>,
  "staffUpdate": Array<{staffId, lastName?, firstName?, lastKana?, firstKana?, email?, careManagerNumber?}>  // 新規
}
```

## 7. テスト・確認観点（次担当者用チェックリスト）

### 7.1 名簿出力 Visual Designer
- [ ] admin → 名簿出力（@142）
- [ ] テンプレ新規作成 → 列追加 → 並び替え → CSV 出力
- [ ] 出力単位を職員単位に切替 → 在籍職員行で出力
- [ ] 行フィルタ（含む / =/ いずれか + 否定）
- [ ] 年度フィールドは `<select>`

### 7.2 介護支援専門員番号緩和
- [ ] admin → 会員詳細 → CM 番号に `HN12345678` 入力 → 保存 OK
- [ ] 公開ポータル → 入会申請 → `HN12345678` 入力 → 拒否（厳格 8 桁数字のみ）
- [ ] DB の T_会員 / T_事業所職員 に大文字保存されるか

### 7.3 公開ポータル staffUpdate
- [ ] 「会員登録情報を変更する」→ 事業所 → 「職員情報を変更する」を選択
- [ ] 在籍職員カードが表示される
- [ ] 「変更する」チェック → 変更項目入力 → 送信
- [ ] 何も入力せず送信 → **ボタン disable + ヒント表示**
- [ ] 申請後、管理者画面で diff 表示
- [ ] 承認 → DB 反映 + メール変更時は旧・新両方に通知

### 7.4 メール送信制御
- [ ] admin → システム設定 → メール通知タブ → 「メール送信制御」セクション
- [ ] `MAIL_GLOBAL_ENABLED=false` 状態（safe-stop）
- [ ] テスト時のみ `REDIRECT` モード + allowlist 設定

### 7.5 PDF サムネイル
- [ ] admin → 研修管理 → PDF 添付済み研修
- [ ] サムネイル表示
- [ ] 表示されない場合: `setupPendingThumbnailsTrigger` Run + `regenerateThumbnailForTraining` Run

## 8. 関連ドキュメント

- `docs/03_DATA_MODEL.md` — 最新スキーマ + ER 図 + バリデーション規約
- `docs/05_AUTH_AND_ROLE_SPEC.md` — 認証・権限
- `docs/09_DEPLOYMENT_POLICY.md` — デプロイ標準
- `docs/12_ENGINEERING_RULEBOOK.md` — 最上位ルール
- `docs/227_MAIL_KILL_SWITCH_2026-05-18.md` — v371.x メール送信 4 階層ガード設計
- `docs/228_ROSTER_REDESIGN_2026-05-19.md` — 名簿出力刷新設計（Sprint 1-5）
- `docs/learning/` — 学習用 HTML

## 9. 残作業（優先度順）

| # | タスク | 規模 |
|---|---|---|
| 1 | 操作者: `runRebuildSchemaForV360` / `setupPendingThumbnailsTrigger` / `cleanupCorruptChangeRequestsV372` を admin editor で Run | 小（運用） |
| 2 | 名簿出力 Sprint S2（drag-drop + プレビュー強化） | 中 |
| 3 | 名簿出力 Sprint S3（計算式・条件付き書式） | 中 |
| 4 | 名簿出力 Sprint S4（PDF 出力） | 中-大 |
| 5 | 名簿出力 Sprint S5（Excel + 旧コード削除） | 中 |
| 6 | パスワード hash pepper を Cloud Secret Manager 移行（AGENTS.md §4 必須 backlog） | 中 |
| 7 | 入会承認時 credential メールも `deliverMail_` 経由統合（v371 既知制約） | 小 |
| 8 | PDF サムネイル trigger 自動登録（initializeSchemaIfNeeded_ 内で） | 小 |

## 10. 第三者評価対応の自己診断

| 項目 | 状態 |
|---|---|
| ✅ 認証認可 | 3 境界（admin/member/public）厳守。5 段階権限。HMAC token。 |
| ✅ シークレット衛生 | `.clasprc.json` `.clasp.json` Git 追跡対象外。pepper は Script Properties。 |
| ✅ XSS / CSRF | React 標準エスケープ + HMAC token + Same-Origin。 |
| ✅ SQL Injection | Spreadsheet ベース（SQL なし）+ allowlist サニタイズ。 |
| ✅ 入力バリデーション | クライアント・サーバ両側 + WCAG 2.2 AA。 |
| ✅ パスワードハッシュ | PBKDF2-HMAC-SHA256 10000 反復。 |
| ✅ OAuth スコープ最小化 | v263 で確定。境界ごとに最小スコープ。 |
| ✅ メール送信ガード | v371.x 4 階層（GLOBAL/MODE/ALLOWLIST/CATEGORY）。 |
| ✅ アクセシビリティ | WCAG 2.2 AA 準拠（focus visible / 44px tap / aria）。 |
| ✅ 監査ログ | 主要操作で T_監査ログ 記録。 |
| ⚠️ Pepper 外部化 | Script Properties → Cloud Secret Manager 移行は backlog（docs/172）。 |
| ⚠️ 旧 RosterExport 撤去 | S5 まで legacy 残存（明示マーク）。 |
| ✅ docs 整合 | v372.6.1 時点で本書・03_DATA_MODEL.md・227・228 整合。 |
