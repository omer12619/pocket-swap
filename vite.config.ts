import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
  },
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-motion': ['framer-motion', 'canvas-confetti'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-leaflet': ['leaflet'],
          'vendor-icons': ['lucide-react'],
        },
      },
    },
  },
});
