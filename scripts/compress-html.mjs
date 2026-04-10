/**
 * compress-html.mjs
 *
 * Post-build: Compresses the inlined <script type="module"> in vite-plugin-singlefile output.
 * Uses deflate-raw (zlib) at build time + DecompressionStream + new Function() at runtime.
 *
 * Why new Function() instead of import(blob:):
 *   GAS (script.googleusercontent.com) CSP blocks blob: URI dynamic imports.
 *   new Function() works because GAS allows unsafe-eval.
 *   The Vite bundle has no import/export statements — safe to eval.
 *
 * DecompressionStream browser support: Chrome 80+ (2020-03), Edge 80+, Firefox 113+.
 * GAS web apps run in the user's Chrome browser, so this is safe.
 */

import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function compressHtmlFile(inputPath) {
  const html = fs.readFileSync(inputPath, 'utf8');
  const inputSize = Buffer.byteLength(html, 'utf8');

  const scriptRegex = /<script type="module" crossorigin>([\s\S]*?)<\/script>/;
  const match = html.match(scriptRegex);
  if (!match) {
    console.log(`[compress-html] No module script found in ${path.basename(inputPath)}, skipping.`);
    return;
  }

  const scriptContent = match[1];
  const scriptBytes = Buffer.from(scriptContent, 'utf8');

  const compressed = zlib.deflateRawSync(scriptBytes, { level: zlib.constants.Z_BEST_COMPRESSION });
  const encoded = compressed.toString('base64');

  // Store compressed data as text content (avoids JS string escaping issues).
  // Decompress at runtime with DecompressionStream, execute via new Function().
  const decompressor =
    `<script id="__app_data__" type="application/octet-stream">${encoded}</script>\n` +
    `<script>\n` +
    `(async function(){\n` +
    `  var d=document.getElementById('__app_data__').textContent.trim();\n` +
    `  var b=atob(d),n=new Uint8Array(b.length);\n` +
    `  for(var i=0;i<b.length;i++)n[i]=b.charCodeAt(i);\n` +
    `  var t=await new Response(new Response(n).body.pipeThrough(new DecompressionStream('deflate-raw'))).text();\n` +
    `  new Function(t)();\n` +
    `})();\n` +
    `</script>`;

  const newHtml = html.replace(scriptRegex, decompressor);
  fs.writeFileSync(inputPath, newHtml, 'utf8');

  const outputSize = Buffer.byteLength(newHtml, 'utf8');
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

const memberHtml = path.join(distDir, 'index.html');
const publicHtml = path.join(distPubDir, 'index_public.html');

if (fs.existsSync(memberHtml)) compressHtmlFile(memberHtml);
if (fs.existsSync(publicHtml)) compressHtmlFile(publicHtml);
