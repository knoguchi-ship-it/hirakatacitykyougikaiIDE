# 実装仕様書: v136-v140 権限階層修正・インライン職員編集・サイレントリロード

作成日: 2026-03-27
対象バージョン: v136〜v140
前提: `HANDOVER.md`, `docs/05_AUTH_AND_ROLE_SPEC.md`

---

## 0. 変更概要

| バージョン | 変更内容 |
|-----------|---------|
| v136-v137 | 権限階層修正（MASTER/ADMIN がメンバー権限で上書きされる問題）、職員一覧インラインドロップダウン（区分/状態）、StaffDetailAdmin 保存後の自動ナビゲーション |
| v138-v140 | `loadAppData` に `silent` オプション追加、MemberDetailAdmin の props→form 再同期 |

---

## 1. 権限階層修正（v136-v137）

### 1.1 問題

管理者ログイン後、MemberDetailAdmin で会員詳細を開くと、サイドバーの権限表示が「事業所会員（メンバー）/ 管理者権限 / マスター」のように、**システム権限（MASTER/ADMIN）がメンバーレベルの職員ロールで上書き**されていた。

### 1.2 原因

`App.tsx` の `currentView === 'member-detail'` 判定で、権限チェックが `userRole === 'ADMIN'` のみで `adminPermissionLevel` を参照していなかった。

### 1.3 修正内容

```typescript
// 修正前
if (userRole !== 'ADMIN') { ... }

// 修正後
if (userRole !== 'ADMIN' || !['MASTER', 'ADMIN'].includes(adminPermissionLevel || '')) { ... }
```

`member-detail`, `staff-detail`, `admin-settings` の3ビューに同一パターンを適用。

---

## 2. 職員一覧インラインドロップダウン（v136-v137）

### 2.1 変更内容

`MemberDetailAdmin.tsx` の事業所職員一覧テーブルに、「区分」「状態」のインラインドロップダウンセレクターを追加。

### 2.2 実装

#### ドロップダウン選択肢

| フィールド | 選択肢 | DB カラム |
|-----------|--------|----------|
| 区分 | 代表者 / 管理者 / メンバー | `職員権限コード`（REPRESENTATIVE / ADMIN / STAFF） |
| 状態 | 在籍 / 除籍 | `職員状態コード`（ENROLLED / LEFT） |

#### `handleInlineStaffUpdate` 関数（MemberDetailAdmin.tsx:327-370）

1. 変更なしの場合は即 return
2. 状態変更時は `confirm()` ダイアログで確認
3. `api.updateStaff()` で DB 保存
4. 楽観的 UI 更新: `setForm()` でローカル state を即反映
5. `onSaved()` でバックグラウンドリフレッシュ起動

#### 操作列

- 代表者は除籍ボタン非表示（代表者を直接除籍不可）
- 除籍済み職員は「個人会員に転換」ボタンのみ表示

### 2.3 StaffDetailAdmin 保存後の自動ナビゲーション

`onSaved()` コールバック内で `setStaffSaveToast('職員情報を保存しました')` を設定し、`loadAppData({ force: true, silent: true })` でバックグラウンドリフレッシュ。保存成功後は MemberDetailAdmin に自動遷移（`onBack()` 呼出不要 — ユーザーが手動で「戻る」を押す設計）。

---

## 3. サイレントリロード（v138-v140）

### 3.1 問題

インラインドロップダウンで職員の区分/状態を変更すると:
1. `onSaved()` → `loadAppData({ force: true })` が呼ばれる
2. `loadAppData` 内で `setIsLoading(true)` が実行される
3. `App.tsx` の `if (isLoading)` ガード（line 1516）がローディングスピナーを返す
4. MemberDetailAdmin がアンマウントされ、楽観的 UI 更新が失われる
5. `setIsLoading(false)` でスピナーが消え、管理コンソールのトップに戻される

### 3.2 修正: `silent` オプション（App.tsx:142-175）

```typescript
const loadAppData = async (
  options: { includeAdminSettings?: boolean; force?: boolean; silent?: boolean } = {},
): Promise<{ members: Member[]; trainings: Training[] }> => {
  const { includeAdminSettings = false, force = false, silent = false } = options;
  // ...
  const request = (async () => {
    try {
      if (!silent) setIsLoading(true);
      if (!silent) setInitError(null);
      // ... API call ...
    } finally {
      if (!silent) setIsLoading(false);
    }
  })();
```

`silent: true` の場合、`setIsLoading` / `setInitError` をスキップし、MemberDetailAdmin のアンマウントを防止する。

### 3.3 修正: props→form 再同期（MemberDetailAdmin.tsx）

```typescript
useEffect(() => {
  setForm({ ...member });
}, [member]);
```

`loadAppData` 完了後に `setSelectedMemberForDetail(updated)` が呼ばれ、`member` props が更新される。この `useEffect` により `form` state が最新 props に再同期される。

### 3.4 呼び出し箇所

| 箇所 | 修正前 | 修正後 |
|------|--------|--------|
| MemberDetailAdmin `onSaved` | `loadAppData({ includeAdminSettings: true, force: true })` | `loadAppData({ force: true, silent: true })` |
| StaffDetailAdmin `onSaved` | `loadAppData({ includeAdminSettings: true, force: true })` | `loadAppData({ force: true, silent: true })` |

---

## 4. ビルドパイプラインの注意事項

### 4.1 手動コピーステップ

Vite は `dist/index.html` と `dist-public/index_public.html` にビルド出力する。
`.clasp.json` の `rootDir` は `backend/` であるため、**ビルド後に手動コピーが必要**:

```bash
cp dist/index.html backend/index.html
cp dist-public/index_public.html backend/index_public.html
```

v139 デプロイ時にこのコピーが漏れ、ソースの `silent` 修正が本番に反映されなかった（v140 で修正）。

### 4.2 確認方法

```bash
grep "silent" backend/index.html
# → silent が含まれていれば正しくビルド済み
```

---

## 5. 影響範囲

| コンポーネント | 影響 |
|--------------|------|
| `App.tsx` | `loadAppData` 関数、`member-detail`/`staff-detail`/`admin-settings` ビューの権限チェック、`onSaved` コールバック |
| `MemberDetailAdmin.tsx` | 職員一覧テーブル（インラインドロップダウン）、`handleInlineStaffUpdate`、`useEffect` 再同期 |
| `backend/Code.gs` | `updateStaff_` — 変更なし（既存のキャッシュクリアが正常動作） |
| `backend/index.html` | ビルド出力のコピー |
