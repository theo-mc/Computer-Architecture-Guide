import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { fileURLToPath } from 'node:url';

// KaTeX's stylesheet lists woff2 + woff + ttf for every font; every modern browser takes woff2, so drop the rest.
const katexWoff2Only = {
  name: 'katex-woff2-only',
  enforce: 'pre',
  transform(code, id) {
    if (!id.endsWith('katex.min.css')) return;
    return code.replace(/,url\([^)]*\.woff\) format\("woff"\),url\([^)]*\.ttf\) format\("truetype"\)/g, '');
  }
};

export default defineConfig({
  plugins: [
    katexWoff2Only,
    svelte({
      // Keyboard access is handled by the global vim-style keymap in App.svelte, so per-element a11y lint is noise.
      onwarn: (w, handler) => !w.code.startsWith('a11y_') && handler(w)
    })
  ],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  // main chunk holds all notes/question data (~290 kB gzipped), hence the raised limit
  build: { target: 'es2022', chunkSizeWarningLimit: 900 }
});
