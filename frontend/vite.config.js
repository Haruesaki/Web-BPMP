import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Argumen ketiga dikosongkan agar seluruh variabel terbaca, bukan hanya yang
  // berawalan VITE_ — nilai ini hanya dipakai di sisi konfigurasi, tidak ikut
  // tersisip ke dalam bundel.
  const env = loadEnv(mode, process.cwd(), '')
  const targetBackend = env.VITE_API_URL || 'http://localhost:5000'

  return {
    plugins: [react()],
    server: {
      proxy: {
        // Sejak Tahap 4, URL aset disimpan sebagai path relatif ('/uploads/x.webp')
        // supaya kebal terhadap perpindahan domain. Di production frontend dan
        // backend dilayani dari satu asal, sehingga path itu terselesaikan
        // sendirinya. Saat development keduanya berbeda porta — tanpa proxy ini,
        // '/uploads/x.webp' akan diminta ke dev server Vite dan gambar rusak.
        // Proxy menjaga agar perilakunya sama persis di kedua mode.
        '/uploads': {
          target: targetBackend,
          changeOrigin: true,
        },
        // Pratinjau dokumen mengambil berkasnya lewat path RELATIF
        // ('/api/berkas/<nama>' dan '/api/proksi-berkas'), bukan lewat
        // axiosInstance yang memakai URL absolut. Alasannya sama seperti
        // '/uploads' di atas: di production keduanya satu asal sehingga path
        // relatif terselesaikan sendiri. Tanpa proxy ini, saat development
        // permintaannya jatuh ke dev server Vite dan dibalas index.html —
        // pratinjaunya gagal dengan galat penguraian yang menyesatkan,
        // sementara di production justru berjalan normal.
        //
        // Tidak mengganggu pemanggilan API lain: seluruhnya melewati
        // axiosInstance yang alamatnya sudah absolut ke VITE_API_URL.
        '/api': {
          target: targetBackend,
          changeOrigin: true,
        },
      },
    },
  }
})
