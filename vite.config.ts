import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// ビルド対象エントリポイントを環境変数 VITE_APP で切り替える。
// VITE_APP=public → 公開ポータル (index_public.html)
// VITE_APP=member (or 未設定) → 会員ポータル (index.html)
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const isPublic = env.VITE_APP === 'public';

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react(), tailwindcss(), viteSingleFile()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
          '@shared': path.resolve(__dirname, 'src/shared'),
        }
      },
      build: isPublic
        ? {
            outDir: 'dist-public',
            minify: 'terser',
            terserOptions: {
              compress: { passes: 2, drop_console: false, pure_funcs: [] },
              mangle: { toplevel: false },
            },
            rollupOptions: {
              input: path.resolve(__dirname, 'index_public.html'),
            },
          }
        : {
            minify: 'terser',
            terserOptions: {
              compress: { passes: 2, drop_console: false, pure_funcs: [] },
              mangle: { toplevel: false },
            },
            rollupOptions: {
              input: path.resolve(__dirname, 'index.html'),
            },
          },
    };
});
