# テスト仕様書: v167 事業所 ADMIN ロール変更ルール

作成日: 2026-04-03
対象バージョン: v167
前提ドキュメント: `docs/40_HANDOVER_TASK_BUSINESS_ADMIN_ROLE_CHANGE_RULE.md`, `docs/05_AUTH_AND_ROLE_SPEC.md`
準拠: OWASP ASVS v4.0 / NIST SP 800-53 AC-3

---

## 0. テスト環境・テストデータ

### テスト URL

| 用途 | URL |
|------|-----|
| 会員マイページ | `https://script.google.com/macros/s/AKfycbywpWoYxij6A-ZunIeBjG1Q8qX78PMMTsT3frx1cM5PJ2nAuZpz81KruXb5LIvWgbQx/exec` |

### テストアカウント

| ロール | ログインID | パスワード | 補足 |
|--------|-----------|-----------|------|
| 事業所代表者（REPRESENTATIVE） | ※本番アカウント使用 | — | 事業所会員・代表者ロール |
| 事業所管理者（ADMIN） | ※本番アカウント使用 | — | 事業所会員・管理者ロール |
| 事業所一般職員（STAFF） | ※本番アカウント使用 | — | 事業所会員・一般ロール |

---

## 1. テストケース一覧

### 検証対象ルール（docs/05_AUTH_AND_ROLE_SPEC.md §8）

| # | ルール |
|---|--------|
| R1 | `ADMIN` は他の職員のロールを `ADMIN`↔`STAFF` 間で変更できる |
| R2 | `ADMIN` は `REPRESENTATIVE` のロールを変更できない |
| R3 | `ADMIN` は自身のロールを変更できない |
| R4 | `ADMIN` は `REPRESENTATIVE` を誰にも割り当てられない |
| R5 | `REPRESENTATIVE` は全行のロール編集権を持つ |
| R6 | `STAFF` はロール編集不可（読み取り専用） |

---

## 2. UI テスト（Playwright MCP）

### T-UI-01: ADMIN ログイン時 — 他の STAFF 行のロールドロップダウンが有効

| 項目 | 内容 |
|------|------|
| 目的 | R1 の UI 側実施確認 |
| 前提 | 事業所 ADMIN アカウントでログイン済み |
| 操作 | 「所属職員一覧」で STAFF ロールの行を確認する |
| 期待結果 | ロールドロップダウンが有効（enabled）で、選択肢は「管理者」「一般」のみ（REPRESENTATIVE なし） |
| 判定 | PASS / FAIL |
| エビデンス | — |

### T-UI-02: ADMIN ログイン時 — 自分の行のロールドロップダウンが無効

| 項目 | 内容 |
|------|------|
| 目的 | R3 の UI 側実施確認 |
| 前提 | 事業所 ADMIN アカウントでログイン済み |
| 操作 | 「所属職員一覧」で自身の行を確認する |
| 期待結果 | ロールドロップダウンが `disabled` + ヒントメッセージ「自身の権限は変更できません」が表示される |
| 判定 | PASS / FAIL |
| エビデンス | — |

### T-UI-03: ADMIN ログイン時 — REPRESENTATIVE 行のロールドロップダウンが無効

| 項目 | 内容 |
|------|------|
| 目的 | R2 の UI 側実施確認 |
| 前提 | 事業所 ADMIN アカウントでログイン済み |
| 操作 | 「所属職員一覧」で REPRESENTATIVE 行を確認する |
| 期待結果 | ロールドロップダウンが `disabled` + ヒントメッセージ「代表者の権限は変更できません」が表示される |
| 判定 | PASS / FAIL |
| エビデンス | — |

### T-UI-04: REPRESENTATIVE ログイン時 — 全 STAFF/ADMIN 行のロールドロップダウンが有効

| 項目 | 内容 |
|------|------|
| 目的 | R5 の UI 側実施確認 |
| 前提 | 事業所 REPRESENTATIVE アカウントでログイン済み |
| 操作 | 「所属職員一覧」で各職員行を確認する |
| 期待結果 | STAFF/ADMIN 行のロールドロップダウンが有効（REPRESENTATIVE 自身の行は「代表者情報から自動反映」表示） |
| 判定 | PASS / FAIL |
| エビデンス | — |

### T-UI-05: STAFF ログイン時 — ロールドロップダウンが全行無効

| 項目 | 内容 |
|------|------|
| 目的 | R6 の UI 側実施確認 |
| 前提 | 事業所 STAFF アカウントでログイン済み |
| 操作 | 「所属職員一覧」を確認する |
| 期待結果 | 保存ボタンが非表示 or 無効 / ロール変更 UI が disabled |
| 判定 | PASS / FAIL |
| エビデンス | — |

---

## 3. バックエンド API テスト（clasp run / 直接呼び出し）

### T-BE-01: ADMIN が自身の role を変更しようとしてもストリップされる

| 項目 | 内容 |
|------|------|
| 目的 | R3 のバックエンド強制確認（UI バイパス耐性） |
| 操作 | ADMIN ログイン済みセッションで `updateMemberSelf` を呼び出し、自身の staff レコードに `role: 'STAFF'` を含めて送信 |
| 期待結果 | API は成功するが、DB 上の自身の role は変更されていない（ADMIN のまま） |
| 確認方法 | API レスポンスまたは DB 直接確認 |
| 判定 | PASS / FAIL |
| エビデンス | — |

### T-BE-02: ADMIN が REPRESENTATIVE を role に指定するとエラー

| 項目 | 内容 |
|------|------|
| 目的 | R4 のバックエンド強制確認 |
| 操作 | ADMIN ログイン済みセッションで `updateMemberSelf` を呼び出し、他の STAFF の `role: 'REPRESENTATIVE'` を含めて送信 |
| 期待結果 | バリデーションエラーが返る（`validateBusinessStaffRoleTransition_` ブロック） |
| 確認方法 | API エラーレスポンス |
| 判定 | PASS / FAIL |
| エビデンス | — |

---

## 4. テスト実施結果

### 実施日時: 2026-04-03

テストアカウント: `seedDemoData` で再作成（S1=REPRESENTATIVE/11223344、S2=ADMIN/981220268、S3=STAFF/981220269）

| テストID | 判定 | エビデンス / 備考 |
|----------|------|------------------|
| T-UI-01 | PASS | `evidence-T-UI-01-STAFF-enabled-dropdown.png` — S3 行のドロップダウンが有効、選択肢は「管理者」「一般」のみ（REPRESENTATIVE なし） |
| T-UI-02 | PASS | `evidence-T-UI-02-03-self-and-representative-disabled.png` — S2 自身の行が `disabled` + 「自身の権限は変更できません」 |
| T-UI-03 | PASS | `evidence-T-UI-03-REPRESENTATIVE-disabled.png` — S1 REPRESENTATIVE 行が `disabled` + 「代表者の権限は変更できません」 |
| T-UI-04 | PASS | `evidence-T-UI-04-REPRESENTATIVE-all-rows-enabled.png` — REPRESENTATIVE ログイン時、全行（S2/S3）のドロップダウンが有効 |
| T-UI-05 | PASS | `evidence-T-UI-05-STAFF-all-disabled.png` — STAFF ログイン時、全行 `disabled`・「変更を保存する」ボタン非表示・「閲覧専用モード」表示 |
| T-BE-01 | PASS | `evidence-T-BE-01-02-backend-api-results.png` — API 成功レスポンス `{"updated":true}`、DB 確認で S2.role = "ADMIN" のまま（role フィールドがストリップされた） |
| T-BE-02 | PASS | `evidence-T-BE-01-02-backend-api-results.png` — API エラーレスポンス `{"success":false,"error":"代表者は代表者または管理者のみ登録できます。"}` |

---

## 5. 未テスト項目・制約

- テストアカウントは `seedDemoData` で生成したデモデータを使用（本番会員データとは別）。
- バックエンドの `validateBusinessStaffRoleTransition_` は `clasp run` 経由では直接呼べないため、Playwright の `browser_evaluate` 経由で `google.script.run.processApiRequest` を直接呼び出して代替した。
- エビデンス画像は Playwright の作業ディレクトリに保存済み。
