import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/Score-Board/', // Replace with your repo name
  build: {
    rollupOptions: {
      // Two pages: the new UI at / and the original v1 UI at /classic/
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        classic: resolve(import.meta.dirname, 'classic/index.html'),
      },
    },
  },
})
