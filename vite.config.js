import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

export default defineConfig({
  plugins: [tailwindcss(), svelte()],
  resolve: {
    alias: {
      $lib: path.resolve('./src/lib'),
      $stores: path.resolve('./src/stores'),
      $utils: path.resolve('./src/utils'),
      $data: path.resolve('./src/data')
    }
  }
});
