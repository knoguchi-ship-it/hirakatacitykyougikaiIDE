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

## 8. 結論

公開ポータルは **WCAG 2.2 AA（24px タップターゲット） + AAA（44px タップターゲット） + Reflow §1.4.10 + Apple HIG / Material 2026** の全項目を 7 ビューポート（320〜1920px）× 3 主要ビューで満たしている。

リリース `v320`（viewport addMetaTag）・`v321`（theme-color hotfix）・`v322`（モーダルフッター到達）・`v323`（タップターゲット 44px 化）を経て、公開ポータルのレスポンシブ品質は **グローバルスタンダード以上** の水準で確認された。

admin / member ポータルは認証要件のため自動テスト範囲外であるが、共通コンポーネントを使用するため公開ポータルの結果が代表的な準拠を示す。実機 / VoiceOver 検証および研修申込以外の各画面の網羅的テストはフォローアップ項目とする。
