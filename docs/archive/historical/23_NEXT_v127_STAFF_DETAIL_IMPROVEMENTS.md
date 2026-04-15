# v127 作業指示: 職員詳細画面・介護支援専門員番号・最終代表者自動退会

作成日: 2026-03-23
作成者: Claude Code (claude-opus-4-6)
前提: v126 デプロイ済み（@126 同期確認済み）

---

## ユーザー要望（原文要約）

1. **介護支援専門員番号の必須化**
   - 事業所会員メンバー（代表・管理者・メンバー）: **必須**
   - 個人会員: **必須**
   - 賛助会員のみ: **任意**

2. **StaffDetailAdmin 画面の改修**
   - 職員IDの表示を**削除**
   - 職員権限: REPRESENTATIVE でも**ドロップダウンで変更可能**にする
   - 会員状態: **ドロップダウンで変更可能**にする（ENROLLED / LEFT）
   - 退会日: 表示**不要**（事業所会員の退会日は自動的に年度末が入るため）
   - **除籍日**: 事業所から除籍された日時を表示する（status=LEFT の場合の withdrawnDate）

3. **最後の代表者が個人会員になる場合の自動退会**
   - 事業所会員で最後の在籍職員（＝代表者）が個人会員に転換する場合
   - `newRepresentativeStaffId` を要求せず、**自動的にその事業所を退会扱い**にする
   - 次の代表者を選ばずに個人会員になれる

---

## 変更計画

### Phase A: バックエンド変更 (`backend/Code.gs`)

#### A-1: `updateStaff_()` 拡張（L4380〜4436）
- Allowlist に `status` を追加
- status が `LEFT` に変更された場合:
  - `退会日` に今日の日付を設定
  - T_認証アカウント の `アカウント有効フラグ` を `false` に設定（`disableAuthAccountsByStaffId_()` 呼出）
- status が `ENROLLED` に変更された場合:
  - `退会日` をクリア
  - T_認証アカウント の `アカウント有効フラグ` を `true` に復旧
- role の REPRESENTATIVE 変更時:
  - 現在の制約（REPRESENTATIVE が disabled）を**撤廃**
  - ただし、REPRESENTATIVE から他 role に変更する場合、同事業所に他の ENROLLED 職員が存在し、いずれかを新 REPRESENTATIVE に昇格する必要がある
  - **在籍職員が1名しかいない（=自分だけ）場合**: role 変更を拒否（代わりに個人会員転換を使う）

#### A-2: `convertStaffToIndividual_()` 修正（L4465〜4595）
- **L4494-4511 の代表者チェックブロックを改修**:
  - 他に ENROLLED 職員がいる場合: 従来通り `newRepresentativeStaffId` 必須
  - **他に ENROLLED 職員がいない場合（最後の1名）**:
    1. `newRepresentativeStaffId` 不要
    2. T_会員の当該事業所を `status=WITHDRAWN`, `退会日=今日` に変更
    3. 事業所に残る LEFT 職員の認証アカウントは既に無効化済み（変更不要）
    4. 返却値に `officeWithdrawn: true` を追加

```javascript
// 疑似コード（L4494 付近の改修イメージ）
if (isRepresentative) {
  // 他に ENROLLED の職員がいるか確認
  var enrolledStaff = getAllStaffForMember_(staffSheet, sCols, sourceMemberId)
    .filter(function(s) {
      return String(s[sCols['職員ID']]) !== sourceStaffId
        && String(s[sCols['職員状態コード']]) === 'ENROLLED';
    });

  if (enrolledStaff.length === 0) {
    // 最後の1名 → 事業所自動退会
    var offRow = officeFound.row.slice();
    offRow[officeCols['会員状態コード']] = 'WITHDRAWN';
    offRow[officeCols['退会日']] = today;
    offRow[officeCols['更新日時']] = now;
    memberSheet.getRange(officeFound.rowNumber, 1, 1, offRow.length).setValues([offRow]);
    // newRepresentativeStaffId 不要
  } else {
    // 従来通り後任必須
    var newRepStaffId = String(payload.newRepresentativeStaffId || '').trim();
    if (!newRepStaffId) throw new Error('他の在籍職員がいるため、後任代表者の指定が必要です。');
    // ... 既存ロジック
  }
}
```

#### A-3: `updateStaff_` API レスポンス
- status/role 変更があった場合、変更後の値を返却に追加

### Phase B: フロントエンド変更

#### B-1: `src/components/StaffDetailAdmin.tsx`
- **職員ID表示を削除**（L160-163）
- **介護支援専門員番号を必須に**:
  - `requiredFields` に `careManagerNumber: '介護支援専門員番号'` を追加
  - `<RequiredMark />` 追加
  - `aria-required="true"` / `aria-invalid` / `aria-describedby` 追加
  - blur バリデーション追加
- **職員権限ドロップダウン**:
  - `disabled={staff.role === 'REPRESENTATIVE'}` を**削除**（常に enabled）
  - 代表者変更時の注意テキスト更新:「代表者を変更すると、他の在籍職員から新しい代表者を選ぶ必要があります。」
- **状態ドロップダウン追加**:
  - 現在の読取専用 `<input>` を `<select>` に変更
  - 選択肢: `ENROLLED`（在籍）/ `LEFT`（除籍）
  - form state に `status` を追加
  - 変更時に確認ダイアログ:「この職員を除籍しますか？ログインアカウントは無効化されます。」（LEFT→ENROLLED は逆）
- **退会日を非表示、除籍日を表示**:
  - `staff.withdrawnDate` の label を「除籍日」に変更
  - status が LEFT かつ withdrawnDate がある場合のみ表示（読取専用）

#### B-2: `src/components/MemberDetailAdmin.tsx`
- `businessRequiredFields` に `careManagerNumber` を追加はしない（事業所自体でなく職員個別に持つため）
- 個人会員 / 賛助会員のバリデーション:
  - 個人会員: 既存の member.careManagerNumber を必須バリデーション対象に追加
  - 賛助会員: careManagerNumber は任意のまま

#### B-3: `src/components/MemberDetailAdmin.tsx` — 転換モーダル改修
- 職員→個人会員転換で、最後の1名の場合:
  - `newRepresentativeStaffId` フィールドを非表示にする
  - 確認メッセージ:「{氏名}は事業所の最後の在籍職員です。個人会員に転換すると、事業所は自動的に退会扱いになります。」

#### B-4: `src/services/api.ts`
- `updateStaff` の payload 型に `status?: string` を追加

### Phase C: ドキュメント更新
- `HANDOVER.md`: v127 リリースノート
- `docs/05_AUTH_AND_ROLE_SPEC.md`: 最終代表者自動退会の仕様追記

---

## グランドルール準拠チェックリスト

- [ ] Web検索で最新の一次ソースを確認（介護支援専門員番号の法的必須性、WCAG 2.2 ドロップダウン変更パターン）
- [ ] ベストプラクティスと案件正本の整合確認
- [ ] 変更後: `npm run typecheck` + `npm run build` + `npm run build:gas`
- [ ] `npx clasp push --force` + `npx clasp run healthCheck`
- [ ] `npx clasp version "v127: ..."` → Apps Script UI で @127 に手動更新
- [ ] HANDOVER.md / docs 同時更新

---

## 対象ファイル一覧

| ファイル | 変更内容 |
|---------|---------|
| `backend/Code.gs` | `updateStaff_` に status allowlist 追加 + `convertStaffToIndividual_` 最終代表者自動退会 |
| `src/components/StaffDetailAdmin.tsx` | 職員ID削除、介護支援専門員番号必須化、role/status ドロップダウン化、除籍日表示 |
| `src/components/MemberDetailAdmin.tsx` | 個人会員の介護支援専門員番号必須化、転換モーダルの最終代表者UI |
| `src/services/api.ts` | updateStaff payload に status 追加 |
| `src/types.ts` | 変更不要（Staff インターフェースに status は既存） |
| `HANDOVER.md` | v127 リリースノート |
| `docs/05_AUTH_AND_ROLE_SPEC.md` | 最終代表者自動退会仕様追記 |

---

## 注意事項

- `convertStaffToIndividual_` の最終代表者自動退会は、事業所に残る LEFT 職員の認証アカウントには影響しない（既に無効化済み）
- REPRESENTATIVE の role 変更は、在籍職員が自分1名のみの場合は拒否（個人会員転換を使う）
- 除籍日は T_事業所職員 の `退会日` 列を流用（staff.withdrawnDate）
- 介護支援専門員番号のバリデーションは空文字チェックのみ（桁数フォーマットは案件要件外）
