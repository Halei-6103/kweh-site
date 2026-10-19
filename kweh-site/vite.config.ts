import { defineConfig } from 'vite';

export default defineConfig({
  // For GitHub Pages at username.github.io/repo-name/, set base: '/repo-name/'
  base: '/',
  build: {
    rollupOptions: {
      output: {
        // Keep the big libraries in their own cached chunks.
        manualChunks: {
          three: ['three'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
});
