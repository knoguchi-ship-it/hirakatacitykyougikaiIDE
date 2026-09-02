# 245. 新 UI 追加時のアクセシビリティ + レスポンシブ回帰チェックリスト

更新日: 2026-05-21
適用: v374 以降の全 UI 改修

## 0. なぜ必要か

UI を追加・変更したら必ず以下を実施することで:

- WCAG 2.2 AA 部分適合の維持（docs/244）
- レスポンシブ品質維持（docs/198 の 98/98 セル合格を退行させない）
- スマホ未確認・キーボード未確認・スクリーンリーダー未確認のままの merge を防ぐ

## 1. 開発時の必須セット（コーディング中）

新規 React コンポーネント / フォーム / モーダル / 表 を追加するときは:

### 1-1. キーボード操作

- [ ] すべての操作要素が `Tab` でフォーカス到達可能
- [ ] フォーカスリングが見える (`focus-visible:ring-*` を Tailwind で適用)
- [ ] `Enter` / `Space` で操作確定
- [ ] `Esc` でモーダル / ポップオーバーを閉じる
- [ ] ドラッグ操作には ↑↓ ボタン or キーボード代替を**必ず**併設（WCAG 2.2 §2.5.7）

### 1-2. ARIA / セマンティクス

- [ ] 操作要素は `<button>` / `<a>` / `<input>` / `<select>` を使用（`<div onClick>` 避ける）
- [ ] アイコンのみのボタンに `aria-label` 設定
- [ ] dialog / modal に `role="dialog"` + `aria-modal="true"` + `aria-label` or `aria-labelledby`
- [ ] フォーム入力に `<label>` 紐付け（`htmlFor` or 親 label）
- [ ] エラー時 `aria-invalid="true"` + `aria-describedby="error-id"`
- [ ] 動的メッセージは `aria-live="polite"` or `"assertive"`

### 1-3. タップターゲットサイズ

- [ ] 操作要素は **最小 44×44 px**（WCAG 2.5.5 Enhanced 推奨）
- [ ] 最低でも 24×24 px（WCAG 2.2 §2.5.8 Min 必須）
- [ ] Tailwind: `min-h-[44px]` / `min-w-[44px]` を CTA に明示

### 1-4. コントラスト

- [ ] 通常テキスト: 4.5:1 以上 (`text-slate-700+` on white / `text-white` on `bg-X-700+`)
- [ ] 大テキスト (18pt+ or 14pt+ bold): 3:1 以上
- [ ] **NG パターン**: `bg-emerald-600 text-white`（4.46:1, AA 未達）→ `bg-emerald-700` 以上
- [ ] **NG パターン**: `text-slate-400 on white`（3.0:1, AA 未達 for normal text）

### 1-5. レスポンシブ

- [ ] mobile-first: 320px / 360px で破綻しない
- [ ] `min-h-[100dvh]` を `min-h-screen` の代わりに使用 (iOS Safari address bar 対策)
- [ ] 長い URL / コード片に `break-all` / `break-words`
- [ ] table は `overflow-x-auto` で囲むかカードレイアウト化
- [ ] sticky 要素は viewport の 15% 以下 (Nielsen 推奨)

### 1-6. 色だけに頼らない

- [ ] エラー = 赤色 + ⚠ アイコン + テキストメッセージ
- [ ] 警告 = 黄色 + 太字 + 説明
- [ ] 必須項目 = `*` + `aria-required` + 「（必須）」表示

## 2. PR 提出前の必須確認（ローカル）

```bash
# 型 + テスト一式
npm run typecheck
npm run test:formula
npm run test:search

# 境界監査
npm run security:public-boundary
npm run security:split-boundary

# 自動 a11y スキャン（公開ポータル変更時）
npm run test:a11y
# → .test-out/a11y-report.md を確認、critical/serious=0 を確保

# 自動レスポンシブ（必要に応じて）
npm run test:responsive            # 公開ポータル
npm run test:responsive:admin      # 管理（要 auth bootstrap）
npm run test:responsive:member     # 会員（要 auth bootstrap）
```

## 3. 手動確認（実機）

以下を**最低 1 ビューポート**で実施:

### 3-1. キーボードのみ操作

1. Tab だけで全要素にアクセスできるか
2. フォーカス順序が論理的か（左→右、上→下）
3. モーダル展開時にフォーカスがモーダル内にトラップされるか
4. モーダル閉じた時にフォーカスが起動元へ戻るか
5. Esc でモーダルが閉じるか

### 3-2. スマホ実機 or DevTools (360px width)

1. 横スクロールしないか
2. CTA がタップ可能（指 1 本で当てられる、44px 確保）
3. iOS Safari address bar 出現で content が切れないか (`100dvh`)
4. キーボード入力時に画面が崩れないか

### 3-3. スクリーンリーダー（任意・大規模改修時必須）

- NVDA + Chrome（Windows）
- VoiceOver + Safari（macOS）
- 要素の役割が正しく読み上げられるか
- フォームの label が読まれるか
- エラーメッセージが aria-live で通知されるか

## 4. 違反発見時の対応フロー

```
発見
  │
  ├─ 自動テストで検出 → 直接コード修正 + 再 test:a11y で confirm
  │
  ├─ 手動で検出 → 影響範囲を docs/244 conformance statement に追記
  │              → 修正 PR に「accessibility fix」タグ
  │
  └─ 利用者報告 → Issue 化 → P1 (critical/serious) は 1 週間以内、
                              P2 (moderate) は 1 ヶ月以内、
                              P3 (minor) は次半期レビュー
```

## 5. 半期レビュー（5 月 / 11 月）

operator + 開発者で実施:

- [ ] `npm run test:a11y` 実行・レポート確認
- [ ] `npm run test:responsive` 全 3 ポータル実行・レポート確認
- [ ] NVDA / VoiceOver で 3 シナリオ（入会申込・ログイン・研修申込）
- [ ] WCAG 2.2 §3.3.7 Redundant Entry / §2.4.11 Focus Not Obscured の実機確認
- [ ] `docs/244` の SC 別自己評価表を更新
- [ ] 変更があれば本書を bump

## 6. アンチパターン集（避けるべき書き方）

| NG | 理由 | 代替 |
|---|---|---|
| `<div onClick={...}>` | キーボード操作不能 + role 不明 | `<button type="button" onClick={...}>` |
| `<button>×</button>` (aria-label なし) | スクリーンリーダーが「×」と読む | `<button aria-label="閉じる">×</button>` |
| `placeholder="氏名"` のみ | label 不在で SR が項目名を読まない | `<label>氏名 <input placeholder="..."></label>` |
| `bg-emerald-600 text-white text-xs` | コントラスト 4.46:1（AA 未達） | `bg-emerald-700 text-white` (5.7:1) |
| `min-h-screen` | iOS Safari address bar で切れる | `min-h-[100dvh]` |
| `text-slate-400` on white の通常テキスト | コントラスト 3.0:1（AA 未達） | `text-slate-500` 以上 or 14pt bold |
| 色だけで状態を示す | 色覚多様性で識別不能 | 色 + アイコン + テキスト |

## 7. 関連ドキュメント

- `docs/244_WCAG_2.2_AA_CONFORMANCE_STATEMENT_2026-05-21.md` — 適合声明
- `docs/archive/historical/198_RESPONSIVE_TEST_REPORT_2026-05-11.md` — 自動レスポンシブ 98/98 セル合格
- `AGENTS.md` §4 — レスポンシブ必須ルール（GAS viewport meta / mobile-first / 44px target / 100dvh 等）
