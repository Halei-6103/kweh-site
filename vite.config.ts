import { defineConfig } from 'vite';

export default defineConfig({
  base: '/kweh-site/',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
});
