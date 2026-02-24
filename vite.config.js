import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('pdfjs-dist')) return 'pdfjs';
          if (id.includes('node_modules/three')) return 'three';
          if (id.includes('node_modules/plotly')) return 'plotly';
          if (id.includes('node_modules/antd') || id.includes('node_modules/@ant-design')) return 'antd';
        }
      }
    }
  }
})
