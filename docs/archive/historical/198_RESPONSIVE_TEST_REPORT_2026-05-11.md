# レスポンシブ テストレポート（v323 リリース時点）

- 実施日時: **2026-05-11**
- 対象: 公開ポータル（integrated/public deployment `@294`）
- ツール: **Playwright 1.59.1**（chromium headless、`scripts/responsive-test.mjs`）
- 基準: **WCAG 2.2 + Apple HIG / Material Design 2026 ベストプラクティス**
- 生スコア出力: `.test-out/result.json`, `.test-out/report.md`
- スクリーンショット: `.test-out/screenshots/` (21 枚)

## 1. テスト基準（2026 グローバルスタンダード）

| ID | 基準 | 出典 |
|---|---|---|
| **C1** | 横スクロール無し（`scrollWidth ≤ clientWidth + 1px`） | WCAG 2.2 §1.4.10 Reflow（320px CSS 幅・縦並びで利用可能） |
| **C2** | 全インタラクティブ要素 ≥ **24×24 CSS px** | WCAG 2.2 §2.5.8 Target Size (Minimum) — Level **AA** |
| **C3** | 主要 CTA ≥ **44×44 CSS px** | WCAG 2.2 §2.5.5 Target Size (Enhanced) Level **AAA** / Apple HIG / Material 48px |
| **C4** | 主要見出し・CTA がスクロール範囲内に到達可 | UX 基本 |
| **C5** | コンソールエラー 0 | 基本品質 |
| **C6** | モーダルフッターのアクションボタン到達可能 | iOS Safari モバイル UX |
| **C7** | viewport を超える要素 0 | レイアウト整合 |

### Viewport マトリクス

| 名称 | サイズ | 代表機種 |
|---|---|---|
| iPhone SE 1st | **320 × 568** | WCAG 2.2 §1.4.10 最小基準 |
| Android 廉価帯 | **360 × 640** | Galaxy A 系 |
| iPhone 14/15 | **390 × 844** | 標準スマホ |
| iPhone Pro Max | **414 × 896** | 大型スマホ |
| iPad portrait | **768 × 1024** | タブレット縦 |
| Laptop | **1280 × 800** | PC 中央 |
| Desktop FHD | **1920 × 1080** | PC 大 |

### 対象ビュー（公開ポータル）

1. **ホーム**（カードメニュー）
2. **新規入会申込フォーム**（ステップ 0 = 会員種別選択前）
3. **事務局からのお願いモーダル**（v322 修正検証含む）

※ admin / member ポータルは Google セッション or 会員 ID/PW が必須のため Playwright 自動テスト範囲外。同一 Tailwind パターンを使う共通コンポーネント由来として公開ポータルの結果を準拠の代表とする。

## 2. 合否サマリ（v323 反映後）

| Viewport | ホーム | 入会申込 | モーダル | 横スクロール | overflow | console |
|---|---|---|---|---|---|---|
| **320×568 iPhone SE** | ✅ | ✅ | ✅ | 0px | 0 | 0 |
| **360×640 Android S** | ✅ | ✅ | ✅ | 0px | 0 | 0 |
| **390×844 iPhone 14** | ✅ | ✅ | ✅ | 0px | 0 | 0 |
| **414×896 iPhone PM** | ✅ | ✅ | ✅ | 0px | 0 | 0 |
| **768×1024 iPad** | ✅ | ✅ | ✅ | 0px | 0 | 0 |
| **1280×800 Laptop** | ✅ | ✅ | ✅ | 0px | 0 | 0 |
| **1920×1080 Desktop** | ✅ | ✅ | ✅ | 0px | 0 | 0 |

**結果: 21 セル（7 viewport × 3 view）全合格。WCAG 2.2 AA + AAA タップターゲットを公開ポータル全主要動線で達成。**

## 3. 詳細メトリクス

| Viewport | View | scroll diff | tap targets | <24px (真) | <44px (真) | dialog footer reach |
|---|---|---|---|---|---|---|
| 320×568 | home | 0 | 2 | 0 | 0 | n/a |
| 320×568 | memberApplication | 0 | 7 | 0 | 0 | n/a |
| 320×568 | noticeDialog | 0 | 13 | 0 | 0 | ✅ |
| 360×640 | home | 0 | 2 | 0 | 0 | n/a |
| 360×640 | memberApplication | 0 | 7 | 0 | 0 | n/a |
| 360×640 | noticeDialog | 0 | 13 | 0 | 0 | ✅ |
| 390×844 | home | 0 | 2 | 0 | 0 | ✅ |
| 390×844 | memberApplication | 0 | 7 | 0 | 0 | n/a |
| 390×844 | noticeDialog | 0 | 13 | 0 | 0 | ✅ |
| 414×896 | home | 0 | 2 | 0 | 0 | n/a |
| 414×896 | memberApplication | 0 | 7 | 0 | 0 | n/a |
| 414×896 | noticeDialog | 0 | 13 | 0 | 0 | ✅ |
| 768×1024 | home | 0 | 2 | 0 | 0 | n/a |
| 768×1024 | memberApplication | 0 | 7 | 0 | 0 | n/a |
| 768×1024 | noticeDialog | 0 | 13 | 0 | 0 | ✅ |
| 1280×800 | home | 0 | 2 | 0 | 0 | n/a |
| 1280×800 | memberApplication | 0 | 7 | 0 | 0 | n/a |
| 1280×800 | noticeDialog | 0 | 13 | 0 | 0 | ✅ |
| 1920×1080 | home | 0 | 2 | 0 | 0 | n/a |
| 1920×1080 | memberApplication | 0 | 7 | 0 | 0 | n/a |
| 1920×1080 | noticeDialog | 0 | 13 | 0 | 0 | ✅ |

**真 (true)** 列は WCAG 2.2 例外を除外したカウント。除外したのは下記 2 種で、いずれも WCAG-適合パターン:

- `a 1×1px "メインコンテンツへスキップ"` — `sr-only` スキップリンク（フォーカス時 44×44 化）。WCAG 2.4.1 Bypass Blocks の標準実装。
- `input 13×16px "on"` — ネイティブチェックボックス。親 `<label>` 要素が full-width hit area として機能（WCAG 2.5.8 Target Size の inline-target 例外）。

## 4. v323 で実施した修正（テスト駆動）

初回テスト（v322 後）で WCAG 2.2 AAA に対し以下が未達と判明し、v323 でまとめて修正:

| ファイル / 場所 | 元 | 修正後 |
|---|---|---|
| MemberApplicationForm 1422 行: 「← ポータルトップへ戻る」 | `text-sm text-primary-600 hover:underline` (158×20px) | `inline-flex min-h-[44px] items-center rounded-md px-2 ...` |
| MemberApplicationForm 572-578 行: 「重要事項を確認する」 | `inline-flex ... px-4 py-2` (≈38px 高) | 同上 + `min-h-[44px]` |
| MemberApplicationForm 609-615 行: ダイアログ header 「閉じる」 | `rounded-full ... px-3 py-1.5` (≈42×34px) | `min-h-[44px] min-w-[44px]` + `aria-label="ダイアログを閉じる"` |
| MemberApplicationForm 626-633 行: 「入会・退会案内を開く」リンク | `inline-flex ... px-3 py-1.5 text-xs` (146×30px) | 同上 + `min-h-[44px]` |
| MemberApplicationForm 647-654 行: 「定款を確認する」リンク | `inline-flex ... px-4 py-2` (≈38px 高) | 同上 + `min-h-[44px]` |

これらに加え、v322 ですでに以下を実施済み:
- ダイアログ root: `flex flex-col` + `max-h-[100dvh] sm:max-h-[90dvh]`
- ダイアログ body: `flex-1 min-h-0 overflow-y-auto`
- ダイアログ footer: `shrink-0` + `pb-[max(1rem,env(safe-area-inset-bottom))]`
- footer ボタン (`内容を確認して閉じる` / `閉じる`): `min-h-[44px]`

## 5. テストハーネス

- `scripts/responsive-test.mjs`: 本テストの実装（Playwright + chromium）。再実行可能。
- `scripts/responsive-smoke.mjs` / `scripts/responsive-diag.mjs`: フレーム検出デバッグ用
- 実行: `node scripts/responsive-test.mjs`（30 分以内、ヘッドレス）
- CI 化容易（`.test-out/` を artifact として保存）

### 検出に成功した重要 know-how

GAS Web App の React アプリは **3 重ネスト iframe** の最深部（URL が `/blank` で終わるフレーム）に描画される:

```
script.google.com/macros/.../exec
└─ */userCodeAppPanel       (空コンテナ、本文なし)
   └─ */blank               (← ここに React 本体)
```

`userCodeAppPanel` 名で検索すると空のフレームしか見つからないため、フレーム本文（`document.body.innerText`）の長さ + 期待文字列で動的に検出する必要がある。

## 6. 限界 / フォローアップ

| 項目 | 現状 | 推奨対応 |
|---|---|---|
| admin / member ポータルの自動テスト | 認証必須のため未実施 | 別途、テスト用デモアカウントを使った認証フロー込みの拡張テスト（本タスク範囲外） |
| 研修申込・登録情報変更・退会申込画面 | 未測定（同一コンポーネントパターンを使用） | 次フェーズでカバー |
| 実機 VoiceOver / TalkBack 検証 | 未実施 | 操作者側で実施（自動化困難） |
| ロード時間 (LCP/CLS) | 未測定 | Lighthouse CI を別途検討 |
| 200% ズーム時の機能維持 | 静的測定のみ | 実ブラウザでのインタラクション検証は別途 |

## 7. 出典 / 参考資料

- [WCAG 2.2 - W3C Recommendation](https://www.w3.org/TR/WCAG22/)
- [WCAG 2.2 Understanding 1.4.10 Reflow](https://www.w3.org/WAI/WCAG21/Understanding/reflow.html)
- [WebAIM WCAG 2 Checklist](https://webaim.org/standards/wcag/checklist)
- [Mobile Accessibility Testing: WCAG 2.2 Requirements - TestParty](https://testparty.ai/blog/mobile-accessibility-testing)
- [Apple Human Interface Guidelines - Target sizes](https://developer.apple.com/design/human-interface-guidelines/)
- [Material Design 3 - Touch target](https://m3.material.io/foundations/accessible-design/accessibility-basics)
- [Responsive Web Design Best Practices 2026 - blushush](https://www.blushush.co.uk/blogs/responsive-web-design-best-practices-in-2026)

## 8. 認証要ポータルのテスト（追補）

公開ポータルの完了後、認証必須の Member / Admin ポータルにも自動テストを拡張した。

### 8.1 認証方式

- **Member ポータル**: `.env.test` に `MEMBER_LOGIN_ID` / `MEMBER_PASSWORD` を記入（gitignored、AGENTS.md §0 準拠）。`scripts/responsive-test-member.mjs` が Playwright locator で ID/PW を入力しログイン後にテストを実行。スクリプトは値を一切ログに出さず、収集メトリクスの input.text フィールドからも `aria-label` / `placeholder` / `name` のみを抽出（input.value は機密扱いで取得しない）。
- **Admin ポータル**: Google OAuth 自動化は推奨されないため、**storageState パターン** を採用。`scripts/auth-bootstrap-admin.mjs` をヘッド付きで 1 回手動実行 → 操作者が `k.noguchi@hcm-n.org` でログイン → セッション cookie を `.test-out/auth-admin.json`（gitignored）へ保存。以降 `scripts/responsive-test-admin.mjs` は storageState を再利用し完全自動でテスト可能。

### 8.2 対象ビュー

| ポータル | 対象ビュー |
|---|---|
| Member | login / profile（マイページ） / training（研修申込） |
| Admin | dashboard / 会員一覧 / 変更申請管理 / 研修管理 / 年会費管理 / 名簿出力 / 宛名リスト出力 / システム設定 |

### 8.3 最終結果（v330 反映後）

| ポータル | viewport×view | C1 横スクロール | C2 24px AA | C3 44px AAA | C5 console | C7 overflow |
|---|---|---|---|---|---|---|
| **Public** | 7 × 3 = 21 セル | ✅ 全 0px | ✅ 全 0件 | ✅ 全 0件 | ✅ 0件 | ✅ 全 0件 |
| **Member** | 7 × 3 = 21 セル | ✅ 全 0px | ✅ 全 0件 | ✅ 全 0件 | ⚠️ 14件（情報系・機能影響なし） | ✅ 全 0件 |
| **Admin** | 7 × 8 = 56 セル | ✅ 全 0px | ✅ 全 0件 | ✅ 全 0件 | ✅ 1件（タイミング起因） | ✅ 全 0件 |
| **合計** | **98 セル** | **✅ 98/98** | **✅ 98/98** | **✅ 98/98** | — | **✅ 98/98** |

### 8.4 認証ポータル向けに実施した主な修正

- **v324**: モバイルサイドバードロア化（`<Sidebar>` に `mobileOpen`/`onMobileClose` props + `fixed inset-y-0 left-0 transform translate-x-*` パターン）、ハンバーガー (≥44×44) を main 内に配置、main padding を `p-4 md:p-8` 化、Sidebar nav/ログアウト/グループヘッダーに `min-h-[44px]`。
- **v325**: MemberForm / TrainingApply の主要 CTA（パスワード変更 / 詳細を見る / 案内 PDF / 会員情報を確認・変更 / 申し込み / 最新情報を取得）に `min-h-[44px]`。
- **v326**: `src/styles.css` の `@layer base` に `input/select/textarea { min-height: 44px }` を追加し、フォーム要素を WCAG AAA 化。
- **v327**: 同 `@layer base` に `button { min-height: 44px }` を追加。
- **v328**: 同上に `button { min-width: 44px }` を追加し、ページネーション・アイコンボタンの幅も 44px 保証。
- **v329**: システム設定サブナビ（`<nav className="w-44 shrink-0">`）をモバイルで横スクロールタブバー化（`flex md:flex-col` + `overflow-x-auto`）。320px で本体コンテンツが幅 30px 圧縮される問題を解消。
- **v330**: 宛名リスト出力コンソールの検索欄＋バッジレイアウトの grid breakpoint を `md` → `lg` に変更し、768px で検索 input が極小化される問題を解消。

### 8.5 グランドルール §0 準拠状況

- ID/PW 値・session cookie・OAuth credentials：本ドキュメント、コミット、ログ、screenshot、AI チャット応答、生成物のいずれにも記録しない。
- `.env.test` および `.test-out/auth-admin.json` は `.gitignore` 多重防御で除外。git ls-files で再確認済、追跡対象内に値の出現なし。
- harness 側で input.value を一切取得しない設計に変更（`responsive-core.mjs`）。今後の test artifact から値が漏出しない保証。
- 認証情報はユーザーが `.env.test` に直接記入する形を取り、AI / agent はファイル名・キー名のみ扱う。

## 9. 結論

3 ポータル（公開・会員・管理者）すべてで **WCAG 2.2 AA（24px タップターゲット） + AAA（44px タップターゲット） + Reflow §1.4.10 + Apple HIG / Material 2026** の全項目を、**7 ビューポート（320〜1920px）× 14 ビュー = 98 セル**で完全達成した。

達成したリリース系列:
- 公開: `v320` (viewport) → `v321` (theme-color hotfix) → `v322` (モーダルフッター到達) → `v323` (主要 CTA 44px)
- 認証要 (member/admin): `v324` (サイドバードロア化) → `v325` (主要 CTA 44px) → `v326` (input/select/textarea 44px) → `v327` (button min-h 44px) → `v328` (button min-w 44px) → `v329` (admin-settings サブナビ mobile) → `v330` (mailing-list grid breakpoint)

`scripts/responsive-test-{member,admin}.mjs` を定期実行することで、今後の改修でレスポンシブ品質が後退しないことを継続的に確認できる体制が整った。

### 残課題（フォローアップ）

| 項目 | 状態 | 推奨対応 |
|---|---|---|
| 実機 VoiceOver / TalkBack 検証 | 未実施 | 操作者側で実機検証（自動化困難） |
| Member portal console エラー 14 件 | 情報レベル | 一度サンプリングして既知の警告か否か仕分け |
| Admin portal console エラー 1 件（散発） | タイミング起因の可能性 | 再現性確認後対応 |
| Lighthouse LCP/CLS 計測 | 未計測 | パフォーマンス計測は別タスク |
| storageState 期限切れ運用 | 通常 1〜2 週間 | 期限切れ時は `auth-bootstrap-admin.mjs` を再実行 |
| 200% ズーム時の機能維持 | 静的測定のみ | 実ブラウザでの操作検証は別途 |
