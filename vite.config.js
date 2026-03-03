import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],
  // Tambahkan baris ini, wajib sama dengan nama repo Bapak di GitHub
  base: '/DATABASE-SHORTCOURSE/', 
})
