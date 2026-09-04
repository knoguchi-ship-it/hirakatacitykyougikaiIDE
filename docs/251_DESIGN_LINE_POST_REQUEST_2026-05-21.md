# 246. 公式LINE投稿依頼 設計書

更新日: 2026-05-21
対象: v374.1
管轄: 管理者ポータル

## 1. 目的・コンテキスト

公式LINEに投稿したいコンテンツ（テキスト + 申込リンク + 添付）を **依頼として管理** し、LINE 担当者が手動で投稿する運用を支援する。

**非目標**: LINE Messaging API による自動投稿は実装しない（運用フェーズで将来検討）。

## 2. ライフサイクル

```
[DRAFT] ──「投稿依頼へ」──> [REQUESTED] ──「投稿済みにする」──> [POSTED]
   ↑                          │
   └────「取り下げ」─────────┘
   
(POSTED は終端。取り下げ・編集不可。削除は論理削除のみ)
```

| 状態 | 説明 | 編集 | 削除 |
|---|---|---|---|
| DRAFT | 作成中 | ✅ | ✅ |
| REQUESTED | 投稿依頼中（LINE 担当者にメール通知済） | ❌（要取り下げ） | ✅ |
| POSTED | 投稿済み | ❌ | ❌（履歴保持） |

## 3. データモデル

### T_LINE投稿依頼

| 列 | 型 | 例 |
|---|---|---|
| 投稿依頼ID | UUID | `abc123-...` |
| ステータス | enum | `DRAFT` / `REQUESTED` / `POSTED` |
| テキスト | string ≤500 | 本文 |
| 研修申込リンク | URL | `https://script.google.com/...` |
| 添付ファイルURL | Drive URL | `https://drive.google.com/file/d/...` |
| 添付ファイル種別 | enum | `IMAGE` / `PDF` / 空 |
| 添付ファイル名 | string | `flyer.png` |
| **対象種別** | enum | `GENERAL` / `TRAINING` （拡張可） |
| **対象ID** | string | 研修IDなど |
| 作成者メール | string | `k.noguchi@hcm-n.org` |
| 作成日時 | ISO datetime | |
| 更新日時 | ISO datetime | |
| 投稿依頼日時 | ISO datetime | DRAFT→REQUESTED 時 |
| 投稿日時 | ISO datetime | REQUESTED→POSTED 時 |
| 投稿マーク者メール | string | |
| 備考 | string | LINE 担当者向けメモ |
| 削除フラグ | boolean | soft delete |

**Polymorphic association** で将来の連携対象を拡張可能（targetType に enum を追加するだけ）。

## 4. システム設定

| キー | 用途 |
|---|---|
| `LINE_POST_ASSETS_FOLDER_ID` | Drive フォルダID。初回アップロード時に自動作成（フォルダ名「LINE投稿資材」） |
| `LINE_POST_NOTIFY_EMAIL` | REQUESTED 遷移時の通知先メアド。空なら通知スキップ |

## 5. API（admin only）

| Action | 説明 |
|---|---|
| `listLinePostRequests` | status / targetType / keyword フィルタで一覧取得（作成日時降順、上限 200） |
| `getLinePostRequest` | 1 件取得。targetType=TRAINING なら targetLabel に研修名同送 |
| `saveLinePostRequest` | 新規 or 更新（DRAFT のみ編集可） |
| `uploadLinePostAttachment` | base64 → Drive 保存 → ANYONE_WITH_LINK URL 返却 |
| `transitionLinePostRequest` | `action: 'request' / 'post' / 'withdraw'` で状態遷移 |
| `deleteLinePostRequest` | 削除フラグ true（POSTED は不可は handler 側で警告ベース運用） |

権限: 全 action `MASTER` + `ADMIN`

## 6. UI 設計

`src/components/LinePostConsole.tsx`。Sidebar 「研修・通知」グループに「📱 公式LINE投稿依頼」を追加。

| 画面 | 要素 |
|---|---|
| 一覧 | status filter / targetType filter / キーワード検索 + カード（ステータスバッジ + 対象 + 本文先頭 + 操作ボタン群） |
| 編集モーダル | 対象種別 radio / 研修選択 / テキスト（カウンタ）/ URL / ファイルアップロード / 備考 / プレビュー |
| 詳細モーダル | 全情報 read-only + 状態遷移ボタン |
| プレビュー | LINE 公式アプリ風カード（テキスト + 画像 or PDF アイコン + URL） |

WCAG 2.2 AA 遵守（docs/245）:
- `aria-live="polite"` でテキスト残り字数通知
- 操作要素 min-h-[44px]
- ステータスは色 + アイコン + テキスト 3 重表現
- ファイル削除に明示 `aria-label`

## 7. メール通知

`DRAFT → REQUESTED` 遷移時に `LINE_POST_NOTIFY_EMAIL` 宛に送信:

- 件名: 「【LINE投稿依頼】新規依頼が登録されました」
- 本文: 依頼 ID / 依頼者 / 日時 / 本文 / 研修申込リンク / 添付ファイル URL

通信経路: `deliverMail_('LINE_POST_REQUEST', ...)` 経由（既存メールガード `MAIL_GLOBAL_ENABLED` に従う）。

## 8. 添付ファイル仕様

- 種別: 画像（image/* MIME）または PDF（application/pdf）
- サイズ上限: 10 MB / ファイル
- 枚数: 1 依頼 1 ファイル
- 保存先: Drive フォルダ「LINE投稿資材」（自動作成）
- 共有: `ANYONE_WITH_LINK` (VIEW)
- 削除: 編集時に「削除」ボタンで添付クリア（Drive ファイル自体は残置・soft）

## 9. 将来拡張（Phase 2）

### 9-1. 研修詳細からの作成導線

研修詳細画面に「📱 LINE 投稿を作成」ボタンを追加 → モーダルで作成。
`targetType=TRAINING` + `targetId=<研修ID>` を自動セット。テキスト雛形:
```
「{研修名}」を {開催日} に開催します。
詳細は以下のリンクからお申込みください。
```

### 9-2. 逆方向: LINE 投稿一覧 → 研修詳細遷移

`targetType=TRAINING` の行をクリック → 該当研修詳細へ遷移。

### 9-3. 対象種別の追加

`EVENT` / `MEMBER_RECRUIT` / `NOTICE` 等を `LINE_POST_TARGET_*` 定数として追加。
スキーマ変更不要（polymorphic）。

### 9-4. 自動投稿（LINE Messaging API 化）

将来、channel access token を Script Properties or Secret Manager に保管し、
`REQUESTED → POSTED` 時に LINE Messaging API broadcast を呼ぶ実装に切替可能。
ハッシュ形式 versioning パターンで既存の手動投稿フローと両対応可能。

## 10. セキュリティ・運用

| 観点 | 対応 |
|---|---|
| XSS | React 標準エスケープ。投稿テキストは plain text として扱う |
| Drive 漏洩 | ANYONE_WITH_LINK 前提のため、機微情報を添付しない運用ルール |
| 監査 | 全操作 Logger.log（後日 T_監査ログ 統合候補） |
| メール | `MAIL_GLOBAL_ENABLED` 設定に従う |
| 後方互換 | 完全新規機能のため既存無影響 |
| 削除 | soft delete のみ（hard delete は別途運用判断） |

## 11. テスト

| カテゴリ | 確認内容 |
|---|---|
| 単体 | typecheck / 既存テスト全 pass |
| boundary | admin/public/member 全 PASS |
| 手動 | 作成 → 編集 → 添付 → 依頼 → 投稿マーク → プレビュー → 削除の往復 |

## 12. リスク

| リスク | 軽減 |
|---|---|
| 添付サイズ過大で UI フリーズ | client 側で 10MB 制限 + UI loading 表示 |
| Drive 共有が public すぎる | 運用ルール明文化（機微情報禁止） |
| メール通知未着 | `MAIL_GLOBAL_ENABLED=false` のとき UI 上は遷移成功するが通知されない（既存仕様踏襲） |
| POSTED 後の誤投稿 | 一度 POSTED にしたら戻せない設計。soft delete のみ |

## 13. 関連ドキュメント

- `docs/03_DATA_MODEL.md` — テーブル追記
- `docs/archive/spec_history/05_AUTH_AND_ROLE_SPEC.md` — 権限（admin 専用）
- `docs/227_MAIL_KILL_SWITCH_2026-05-18.md` — メール送信ガード
- `docs/245_UI_ACCESSIBILITY_REGRESSION_CHECKLIST_2026-05-21.md` — UI 適合
