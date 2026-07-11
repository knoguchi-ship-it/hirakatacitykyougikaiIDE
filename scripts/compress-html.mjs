/**
 * compress-html.mjs
 *
 * Post-build: Compresses the inlined <script type="module"> in vite-plugin-singlefile output
 * and injects a robust boot loader with:
 *   - CSS-only loading splash (eliminates first-paint white screen on Safari iOS)
 *   - try/catch + visible error UI with reload button
 *   - DecompressionStream feature detect (iOS < 16.4 fallback messaging)
 *   - requestIdleCallback chunked decode (keeps splash repainting during heavy work)
 *   - Non-blocking Google Fonts (no render-blocking <link rel="stylesheet">)
 *   - Removal of dead <script type="importmap"> (singlefile bundle is self-contained)
 *
 * Build-time:  zlib.deflateRawSync (best compression) → base64.
 * Runtime:     DecompressionStream('deflate-raw') → new Function(t)() (GAS CSP allows unsafe-eval).
 *
 * Why new Function() instead of import(blob:):
 *   GAS (script.googleusercontent.com) CSP blocks blob: URI dynamic imports.
 *   new Function() works because GAS allows unsafe-eval.
 *   The Vite bundle has no import/export statements — safe to eval.
 *
 * DecompressionStream support (May 2026):
 *   Chrome 80+, Edge 80+, Firefox 113+, Safari 16.4+ (iOS 16.4+).
 *   Feature detect at runtime → show update prompt for older Safari.
 */

import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ----- Loader template fragments (kept as constants for readability) -----

const SPLASH_CSS = `<style id="__boot_splash_style__">
#__boot_splash__{position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(180deg,#f8fbff 0%,#eef5f7 45%,#f8fafc 100%);color:#0f172a;font:500 14px/1.6 -apple-system,BlinkMacSystemFont,"Helvetica Neue","Hiragino Sans","Noto Sans JP",sans-serif;z-index:9999;transition:opacity .25s ease;padding:24px;text-align:center}
#__boot_splash__ .__spinner{width:44px;height:44px;border:3px solid #cbd5e1;border-top-color:#0284c7;border-radius:50%;animation:__bspin .9s linear infinite;margin-bottom:16px}
#__boot_splash__ .__label{font-size:14px;color:#475569}
#__boot_splash__ .__sublabel{font-size:12px;color:#94a3b8;margin-top:6px}
@keyframes __bspin{to{transform:rotate(360deg)}}
#__boot_splash__.__err{background:#fff}
#__boot_splash__.__err .__spinner,#__boot_splash__.__err .__label,#__boot_splash__.__err .__sublabel{display:none}
#__boot_splash__ .__errbox{display:none;max-width:480px;padding:24px;border:1px solid #fecaca;background:#fef2f2;border-radius:12px;color:#991b1b;text-align:left}
#__boot_splash__.__err .__errbox{display:block}
#__boot_splash__ .__errbox h2{font-size:16px;font-weight:700;margin:0 0 8px;color:#7f1d1d}
#__boot_splash__ .__errbox p{font-size:13px;margin:0 0 14px;line-height:1.7}
#__boot_splash__ .__errbox button{display:inline-block;padding:10px 18px;min-height:44px;background:#0284c7;color:#fff;border:0;border-radius:9999px;font:600 13px/1 inherit;cursor:pointer}
#__boot_splash__ .__errbox button:hover{background:#0369a1}
</style>`;

const SPLASH_DOM =
  `<div id="__boot_splash__" role="status" aria-live="polite">` +
  `<div class="__spinner" aria-hidden="true"></div>` +
  `<div class="__label">読み込み中...</div>` +
  `<div class="__sublabel">初回は少し時間がかかります</div>` +
  `<div class="__errbox" role="alert"><h2 class="__errtitle"></h2><p class="__errbody"></p>` +
  `<button type="button" onclick="location.reload()">再読み込みする</button></div>` +
  `</div>`;

// Fonts: replace render-blocking <link rel="stylesheet"> with media-swap pattern + preconnect.
// noscript fallback ensures fonts still load when JS is disabled.
const FONTS_HEAD =
  `<link rel="preconnect" href="https://fonts.googleapis.com">` +
  `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>` +
  `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" media="print" onload="this.media='all'">` +
  `<noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"></noscript>`;

// Robust boot loader. All work runs via requestIdleCallback so the splash keeps repainting.
const BOOT_LOADER_BODY = `(function(){
  var $=function(){return document.getElementById('__boot_splash__');};
  var setLabel=function(t){try{var s=$();if(!s)return;var l=s.querySelector('.__label');if(l)l.textContent=t;}catch(_){}};
  var showError=function(title,body){try{var s=$();if(!s)return;s.className='__err';var h=s.querySelector('.__errtitle');var p=s.querySelector('.__errbody');if(h)h.textContent=title;if(p)p.textContent=body;}catch(_){}};
  var hide=function(){try{var s=$();if(!s)return;s.style.opacity='0';setTimeout(function(){try{s.parentNode&&s.parentNode.removeChild(s);}catch(_){}},280);}catch(_){}};
  window.__hideBootSplash__=hide;
  var idle=window.requestIdleCallback||function(cb){return setTimeout(function(){cb({timeRemaining:function(){return 50;}});},1);};
  var run=function(){
    // Feature detect runs inside run() so #__boot_splash__ already exists in the DOM.
    if(typeof DecompressionStream!=='function'){
      showError('お使いのブラウザはサポート対象外です','iOS 16.4 以降の Safari、または最新の Chrome / Edge / Firefox をご利用ください。OS とブラウザを最新版に更新してから再度お試しください。');
      return;
    }
    idle(function(){
      try{
        var el=document.getElementById('__app_data__');
        if(!el){showError('読み込みに失敗しました','ページデータが見つかりません。再読み込みしてください。');return;}
        setLabel('展開中...');
        var d=el.textContent.trim();
        var b=atob(d);
        var n=new Uint8Array(b.length);
        for(var i=0;i<b.length;i++)n[i]=b.charCodeAt(i);
        var stream;
        try{stream=new DecompressionStream('deflate-raw');}
        catch(e){showError('お使いのブラウザはサポート対象外です','表示に必要な機能を利用できません。OS / ブラウザを最新版に更新してから再度お試しください。');return;}
        new Response(new Response(n).body.pipeThrough(stream)).text().then(function(t){
          idle(function(){
            try{
              setLabel('初期化中...');
              new Function(t)();
              if(window.requestAnimationFrame){requestAnimationFrame(function(){requestAnimationFrame(hide);});}else{setTimeout(hide,80);}
            }catch(err){console.error(err);showError('読み込みに失敗しました','時間をおいて再度お試しください。問題が続く場合は事務局までお問い合わせください。');}
          });
        }).catch(function(err){console.error(err);showError('読み込みに失敗しました','通信状態をご確認のうえ、再読み込みしてください。');});
      }catch(err){console.error(err);showError('読み込みに失敗しました','ページを再読み込みしてください。');}
    });
  };
  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',run,{once:true});}else{run();}
})();`;

// ----- HTML rewrite -----

function compressHtmlFile(inputPath) {
  let html = fs.readFileSync(inputPath, 'utf8');
  const inputSize = Buffer.byteLength(html, 'utf8');

  const scriptRegex = /<script type="module" crossorigin>([\s\S]*?)<\/script>/;
  const match = html.match(scriptRegex);
  if (!match) {
    console.log(`[compress-html] No module script found in ${path.basename(inputPath)}, skipping.`);
    return;
  }

  const scriptContent = match[1];

  // v360-fix: new Function() で eval するため、import.meta を含む npm lib が
  // 混入していたら admin shell が parse 時に SyntaxError で死ぬ（v351 と同罠）。
  const importMetaMatches = scriptContent.match(/import\.meta(\.\w+)?/g);
  if (importMetaMatches && importMetaMatches.length > 0) {
    console.error(`[compress-html] ❌ ABORT: ${path.basename(inputPath)} bundle に import.meta が ${importMetaMatches.length} 件残存しています。`);
    console.error(`[compress-html]    検出例: ${importMetaMatches.slice(0, 5).join(', ')}${importMetaMatches.length > 5 ? '...' : ''}`);
    console.error(`[compress-html]    new Function() で eval されるため admin shell が parse 時にクラッシュします（v351 / v360 と同罠）。`);
    console.error(`[compress-html]    対策: import.meta を含む npm パッケージを依存から削除するか、@rollup/plugin-replace でリテラル置換してください。`);
    process.exit(1);
  }

  const scriptBytes = Buffer.from(scriptContent, 'utf8');
  const compressed = zlib.deflateRawSync(scriptBytes, { level: zlib.constants.Z_BEST_COMPRESSION });
  const encoded = compressed.toString('base64');

  // docs/250 Phase 1: GAS 配信 build には apiRuntime='gas' を server side injection する。
  // アプリ bundle は boot loader の eval で後から実行されるため、ここで先行定義すれば
  // src/services/api.ts の createApiClient() が読む時点で必ず存在する。
  const decompressor =
    `<script>window.__APP_CONFIG__={apiRuntime:'gas'};</script>\n` +
    `<script id="__app_data__" type="application/octet-stream">${encoded}</script>\n` +
    `<script>${BOOT_LOADER_BODY}</script>`;

  // 1) Replace bundled module script with boot loader.
  html = html.replace(scriptRegex, decompressor);

  // 2) Remove dead <script type="importmap"> blocks (singlefile bundle is self-contained).
  //    vite-plugin-singlefile inlines all imports; the importmap is unused at runtime.
  const importmapRegex = /\s*<script\s+type=["']importmap["'][\s\S]*?<\/script>/gi;
  html = html.replace(importmapRegex, '');

  // 3) Replace render-blocking Google Fonts <link rel="stylesheet"> with non-blocking pattern.
  const fontsLinkRegex = /<link\s+[^>]*href="https:\/\/fonts\.googleapis\.com\/css2\?[^"]*"[^>]*>/gi;
  html = html.replace(fontsLinkRegex, FONTS_HEAD);

  // 4) Inject splash CSS at end of <head>.
  if (!html.includes('id="__boot_splash_style__"')) {
    html = html.replace(/<\/head>/i, `${SPLASH_CSS}\n</head>`);
  }

  // 5) Inject splash <div> right after <body ...>.
  if (!html.includes('id="__boot_splash__"')) {
    html = html.replace(/<body\b([^>]*)>/i, `<body$1>\n${SPLASH_DOM}`);
  }

  fs.writeFileSync(inputPath, html, 'utf8');

  const outputSize = Buffer.byteLength(html, 'utf8');
  const savings = ((1 - outputSize / inputSize) * 100).toFixed(1);
  console.log(
    `[compress-html] ${path.basename(inputPath)}: ` +
    `${(inputSize / 1024).toFixed(2)} kB → ${(outputSize / 1024).toFixed(2)} kB (-${savings}%)`
  );
  console.log(
    `[compress-html]   JS: ${(scriptBytes.length / 1024).toFixed(1)} kB ` +
    `→ ${(compressed.length / 1024).toFixed(1)} kB deflate ` +
    `→ ${(encoded.length / 1024).toFixed(1)} kB base64`
  );
}

const distDir    = path.resolve(__dirname, '..', 'dist');
const distPubDir = path.resolve(__dirname, '..', 'dist-public');
const distAdminDir = path.resolve(__dirname, '..', 'dist-admin');

const memberHtml = path.join(distDir, 'index.html');
const publicHtml = path.join(distPubDir, 'index_public.html');
const adminHtml = path.join(distAdminDir, 'index_admin.html');

if (fs.existsSync(memberHtml)) compressHtmlFile(memberHtml);
if (fs.existsSync(publicHtml)) compressHtmlFile(publicHtml);
if (fs.existsSync(adminHtml)) compressHtmlFile(adminHtml);
