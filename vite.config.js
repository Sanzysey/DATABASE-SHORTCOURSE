import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],
  // PENTING: Ganti "sistem-enter" di bawah ini dengan nama Repository GitHub Bapak
  base: '/sistem-enter/', 
})
