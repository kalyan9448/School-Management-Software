
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@types': path.resolve(__dirname, './src/types'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@modules': path.resolve(__dirname, './src/modules'),
      '@services': path.resolve(__dirname, './src/services'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@contexts': path.resolve(__dirname, './src/contexts'),
      '@layouts': path.resolve(__dirname, './src/layouts'),
      '@routes': path.resolve(__dirname, './src/routes'),
      '@api': path.resolve(__dirname, './src/api'),
    },
  },
  build: {
    target: 'esnext',
    outDir: 'build',
    chunkSizeWarningLimit: 1024,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          const modulePath = id.split('node_modules/')[1];
          if (!modulePath) return;

          const segments = modulePath.split('/');
          const packageName = segments[0].startsWith('@')
            ? `${segments[0]}-${segments[1]}`
            : segments[0];

          return `vendor-${packageName.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
        },
      },
    },
  },
  server: {
    port: 5173,
    strictPort: false,
  },
});