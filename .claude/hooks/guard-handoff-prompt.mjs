#!/usr/bin/env node
/**
 * UserPromptSubmit — ハンドオフの指示を見つけたら「ハンドオフ中」の印を付け、AI に /handoff とレビューを指示する（H9・2026-11-01）。
 *
 * 強制の本体は guard-handoff-stop.mjs（印があるのにレビューの記録が無ければ、返答を終わらせない）。
 * ここは言葉で拾う入口。打った `/handoff` もそのままの文字で届く（公式ドキュメントで確認・2026-11-01）。
 * 出力: hookSpecificOutput.additionalContext（AI の文脈に足される）。判断に失敗したら何もしない（fail-open）。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const STATE = process.env.GUARD_STATE_ROOT || ROOT;
const PENDING = path.join(STATE, '.tmp', 'handoff-pending.json');

// 「依頼の形」だけを拾う。「ハンドオフの指示があった時に…」のように話題にしているだけの発言では印を付けない（2026-11-01）
const WORD = '(?:ハンドオフ|引き?継ぎ|引継)';
const HANDOFF_PATTERNS = [
  /^\s*\/handoff(?:\s|$)/i,                                       // /handoff と打った
  new RegExp(String.raw`^\s*${WORD}[。．！!\s]*$`),                // 「ハンドオフ」だけ
  // 依頼の形。「を」単独は「引き継ぎを強制する仕組み」のような話題にも当たるので、後ろの動詞まで見る
  new RegExp(`${WORD}(?:を(?:お願|して|実施|行って|始め|進め|やって)|して|しま[しすせ]|お願|よろしく|頼|実施|行って|やって|進めて|に入)`),
  /まとめて閉じ/,
  /区切りましょう|区切りにしましょう|ここで区切/,
];

let raw = '';
process.stdin.on('data', (c) => { raw += c; });
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(raw || '{}');
    const prompt = String(input.prompt || '');
    if (!HANDOFF_PATTERNS.some((re) => re.test(prompt))) process.exit(0);
    fs.mkdirSync(path.dirname(PENDING), { recursive: true });
    fs.writeFileSync(PENDING, JSON.stringify({ sessionId: String(input.session_id || ''), at: Date.now(), blocks: 0 }), 'utf8');
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'UserPromptSubmit',
        additionalContext: '【ハンドオフの指示を検知】Skill /handoff を最初から最後まで実行すること。'
          + '判断の項目（実装と規定の突き合わせ・仕様書の旧い記述・未検証の書き分け）を行い、'
          + '最後に `npm run handoff:review` を通すこと。この HEAD でレビューが通るまで、hook が返答を終わらせない。'
          + '引き継ぎの指示ではない（言葉が偶然一致した）と判断した場合は、その旨を operator に一言伝えること。',
      },
    }));
  } catch { /* fail-open */ }
  process.exit(0);
});
