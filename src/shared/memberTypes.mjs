// v376.67: 会員種別（ラベル・年会費既定値）の【単一情報源】。
//
// 背景（DRY 是正・2026-09-03 operator 指示）:
// 会員種別のラベル「個人会員 / 事業所会員 / 賛助会員」は front 9 ファイル・GAS 7 箇所で
// 三項演算子や独自マップとして直書きされており、DB 正本 `M_会員種別.名称` を無視していた。
// 年会費の既定値も front 3 箇所・GAS 2 箇所に散っていた。
// 同じ値を別ルートで決めていると、片方だけ直したときに画面ごとに表示がぶれる
// （v376.66 の「事業所メールだけタグが未置換」と同じ構造の欠陥）。
//
// フロントは本モジュールを直接 import（allowJs:true + moduleResolution:bundler）。
// GAS は build 時に serializeMemberTypesForGas() の出力を gas-src のマーカーブロックへ注入する
// （memberFiscalStatus.mjs / menu-registry.mjs と同方式）。
//
// 【重要】表示ラベルの最終的な正本は DB の `M_会員種別.名称`。
// 本モジュールの MEMBER_TYPE_LABELS は「マスタを引けないとき（公開ポータル・マスタ未初期化・
// 取得失敗）の既定値」であり、GAS 側は memberTypeLabel_() 経由でマスタを優先すること。

/** 会員種別コード（M_会員種別.コード と一致） */
export const MEMBER_TYPE_CODES = ['INDIVIDUAL', 'BUSINESS', 'SUPPORT'];

/** 会員種別コード → 既定ラベル（DB のマスタ名称が引けないときのフォールバック） */
export const MEMBER_TYPE_LABELS = {
  INDIVIDUAL: '個人会員',
  BUSINESS: '事業所会員',
  SUPPORT: '賛助会員',
};

/** 会員種別コード → 年会費の既定値（実値の正本は M_会員種別.年会費金額） */
export const MEMBER_TYPE_ANNUAL_FEE_DEFAULTS = {
  INDIVIDUAL: 3000,
  BUSINESS: 8000,
  SUPPORT: 5000,
};

/**
 * 会員種別コードを表示ラベルへ変換する（未知コードはコードをそのまま返す）。
 * @param {string} code
 * @param {Record<string,string>=} overrides DB マスタ由来のラベル（あれば優先）
 * @returns {string}
 */
export function memberTypeLabel(code, overrides) {
  var key = String(code || '');
  if (overrides && overrides[key]) return String(overrides[key]);
  return MEMBER_TYPE_LABELS[key] || key;
}

/**
 * 年会費を表示用に整形する（3 桁区切り＋「円」）。
 * 0・未設定・不正値は空文字（「0円」と誤送・誤表示しない）。
 * @param {unknown} rawAmount
 * @returns {string}
 */
export function formatAnnualFee(rawAmount) {
  var feeNum = parseInt(String(rawAmount == null ? '' : rawAmount), 10);
  if (isNaN(feeNum) || feeNum <= 0) return '';
  return feeNum.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '円';
}

/**
 * GAS へ注入する関数ソースを返す（build 時に呼ばれる）。
 * 注入後の GAS 側名称は末尾アンダースコア付きの private 命名に合わせる。
 */
export function serializeMemberTypesForGas() {
  return [
    'var MEMBER_TYPE_CODES = ' + JSON.stringify(MEMBER_TYPE_CODES) + ';',
    'var MEMBER_TYPE_LABELS = ' + JSON.stringify(MEMBER_TYPE_LABELS) + ';',
    'var MEMBER_TYPE_ANNUAL_FEE_DEFAULTS = ' + JSON.stringify(MEMBER_TYPE_ANNUAL_FEE_DEFAULTS) + ';',
    memberTypeLabel.toString().replace('function memberTypeLabel(', 'function memberTypeLabel_('),
    formatAnnualFee.toString().replace('function formatAnnualFee(', 'function formatAnnualFee_('),
  ].join('\n');
}
