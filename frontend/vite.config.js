import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // Produksi (build) disajikan dari subfolder Hostinger: bpmplampung.com/instansi/
  // Dev lokal tetap di root '/' agar workflow `npm run dev` tidak berubah.
  base: command === 'build' ? '/instansi/' : '/',
  plugins: [react()],
}))
