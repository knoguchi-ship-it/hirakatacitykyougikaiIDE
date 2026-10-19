#!/usr/bin/env node
/**
 * PreToolUse(Playwright の evaluate / run_code) ガード（2026-10-11 新設）。
 *
 * 認証済みブラウザから `google.script.run` で本番の関数を直接呼べる（operator 確認の代行に使っている）。
 * Bash を通らないので guard-bash の H4 では止まらず、「管理画面経由は手順で担保」としか書けていなかった。
 *
 * H7（docs/296 の番号）:
 *   B1  書き込みうるトップレベル関数（名前が `_LOG` で終わらないもの）を呼ぶ → ask
 *   B2  processApiRequest の action が「読むだけ」の接頭辞（get/list/…）で始まらない → ask
 *       action を読み取れないときも ask（確かめられないものは通さない）
 *
 * 限界: 画面のボタンをクリックして書き込む操作（browser_click）は見ない。それは Skill /dbops の手順で担保する。
 * 検査: npm run test:guards
 */
import { ask, runHook, repoRoot, loadWriteFunctionSet, loadReadActionPrefixes } from './hook-shared.mjs';

runHook(async (input) => {
  const code = JSON.stringify(input.tool_input || {});
  if (!/google\.script\.run|processApiRequest/.test(code)) return;
  const root = repoRoot(input.cwd || process.cwd());

  const writes = await loadWriteFunctionSet(root);
  const called = [...code.matchAll(/\b([A-Za-z_][A-Za-z0-9_]*)\s*\(/g)].map((m) => m[1]);
  const risky = [...new Set(called.filter((n) => writes.has(n)))];
  if (risky.length) {
    ask(`本番 DB を変更しうる関数をブラウザから呼ぼうとしています: ${risky.join(', ')}。`
      + '対象と不可逆性を operator へ明示し、承認を得てから実行してください（AGENTS L0.3 / Skill /dbops）。');
  }

  if (/processApiRequest/.test(code)) {
    const prefixes = loadReadActionPrefixes(root);
    // 2026-10-19: 実際の呼び方 processApiRequest('getX', payload)（第 1 引数の文字列）も読む。
    // 以前は { action: 'getX' } の形しか読めず、読み取りでも毎回確認が出ていた。
    const objectActions = [...code.matchAll(/action\\?["']?\s*:\s*\\?["'`]([A-Za-z]+)/g)].map((m) => m[1]);
    const positionalActions = [...code.matchAll(/processApiRequest\(\s*\\?["'`]([A-Za-z]+)\\?["'`]/g)].map((m) => m[1]);
    const actions = [...objectActions, ...positionalActions];
    // 呼び出しごとに action が読めること。1 つでも変数で渡していれば確かめられない
    const callSites = [...code.matchAll(/processApiRequest\s*\(/g)].length;
    if (!actions.length || actions.length < callSites) {
      ask('processApiRequest の action を読み取れません（変数で渡している呼び出しがある）。'
        + '書き込み操作でないことを確かめられないため確認します。action 名は文字列で直接書いてください。');
    }
    const writesActions = [...new Set(actions.filter((a) => !prefixes.some((p) => a.startsWith(p))))];
    if (writesActions.length) {
      ask(`本番データを変える可能性のある API をブラウザから呼ぼうとしています: ${writesActions.join(', ')}。`
        + 'プレビュー中ならそのロールの権限で実行され、メールも送られます。承認を得てから実行してください（Skill /dbops）。');
    }
  }
});
