# AGENTS.md — Aturan Kerja pada Proyek Web BPMP Lampung

Berkas ini memuat ketentuan yang **wajib** dipatuhi pada setiap perubahan,
perbaikan, maupun penambahan fitur di proyek ini.

---

## 1. ATURAN UTAMA — Harus berjalan optimal di DEVELOPMENT *dan* PRODUCTION

> **Setiap perbaikan atau implementasi pada proyek ini harus berjalan optimal
> di tahap development (localhost) maupun production (hosting). Bila sebuah
> perubahan membawa galat pada salah satu dari keduanya — atau pada dua-duanya
> — perubahan itu tidak boleh dilakukan.**

Aturan ini tidak cukup dipenuhi dengan "berhasil di komputer saya". Kedua
lingkungan itu berbeda pada hal-hal yang justru paling sering menjadi biang
kegagalan:

| Hal | Development (localhost) | Production (Hostinger) |
|---|---|---|
| Struktur basis data | ikut berubah begitu `npm run migrasi` dijalankan | **hanya berubah bila ada yang menjalankannya di sana** |
| Isi basis data | sedikit, boleh dibuang | banyak, milik pengguna, **tidak boleh hilang** |
| Baris `pengguna` | id-nya sama dengan token yang dipakai | id dapat berbeda sesudah data dipindahkan |
| Berkas `.env` | ada di folder backend | seharusnya dari panel hPanel |
| `node-cron` | hidup | dimatikan (proses dapat diistirahatkan) |
| Folder unggahan | di dalam folder aplikasi | harus di luar, agar tidak hilang saat penempatan ulang |
| Galat | terlihat di terminal | hanya terlihat bila seseorang membuka log runtime |

### Yang wajib diperiksa sebelum menyatakan sesuatu selesai

1. **Jalankan uji terhadap peladen `NODE_ENV=production`, bukan hanya
   development.** Banyak perilaku (CORS, penjadwal, penanganan galat,
   pembatas laju) hanya aktif di salah satunya.
2. **Setiap uji memuat dua uji-diri**: satu yang wajib lulus dan satu yang
   sengaja dibuat gagal. Perkakas uji yang rusak dapat meluluskan segalanya,
   dan hasil seperti itu lebih berbahaya daripada tidak menguji sama sekali.
3. **Kembalikan seluruh data milik pemilik** yang tersentuh pengujian.
   Bila butuh akun, **buat akun uji sementara lalu hapus** — jangan membaca
   atau mengubah kata sandi akun pemilik.
4. **Hentikan peladen uji** yang dinyalakan, dan jangan menutup peramban milik
   pemilik.

---

## 2. Perubahan struktur basis data — penyebab kegagalan production paling sering

Kode berpindah ke peladen lewat paket penempatan; **struktur basis data tidak
ikut berpindah dengan sendirinya**. Di antara kedua saat itu ada jeda, dan pada
jeda itu kode baru berhadapan dengan basis data lama. MySQL membatalkan
**seluruh** pernyataan begitu menemui kolom yang tidak dikenal — satu kolom
yang tertinggal sanggup mematikan satu fitur sepenuhnya.

**Kejadian nyata (8 Agustus 2026).** Kolom `berita.urutan_tampil` belum ada di
production. Akibatnya daftar berita pengunjung kosong sama sekali walaupun
datanya utuh di basis data, dan setiap penambahan berita berbalas 500.

Karena itu, bila menambah kolom/tabel:

- [ ] Buat migrasinya di `backend/db/migrations/`.
- [ ] **Tambahkan penjagaannya ke `.deploy_plan/query.txt`** (idempoten,
      hanya menambah, tidak pernah `DROP`/`DELETE`/`TRUNCATE`/`UPDATE`).
- [ ] **Buat kodenya tahan bila kolom itu belum ada**, memakai
      `backend/utils/skema.js` → `adaKolom(tabel, kolom)`. Fiturnya boleh
      mundur ke perilaku lama, tetapi **tidak boleh mematikan halaman**.
- [ ] Sebutkan di `.deploy_plan/BACA-INI.md`.

`backend/utils/periksaMigrasi.js` akan memperingatkan dengan lantang saat boot
bila masih ada migrasi tertunda — di kedua mode.

### SQL untuk production

MySQL **tidak** mengenal `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` (itu milik
MariaDB). Pakai pola berpenjaga: periksa `information_schema`, lalu
`PREPARE`/`EXECUTE`, dengan `DO 0` bila sudah ada. Kolasi `utf8mb4_0900_*`
khusus MySQL 8 dan ditolak MariaDB — pakai `utf8mb4_general_ci`.

---

## 3. Kegagalan tidak boleh diam

Sebuah permintaan yang gagal **wajib** terlihat oleh penggunanya. Pada kejadian
8 Agustus 2026, penambahan berita gagal dengan 500 tetapi editor tidak
menampilkan apa pun: penyunting menyimpulkan tulisannya tersimpan, padahal
hilang.

- Setiap `await` yang mengirim data **harus** punya `catch` yang menampilkan
  pesannya kepada pengguna — `finally` saja tidak cukup, ia tidak menangkap.
- Jangan berpindah halaman atau mengosongkan formulir sebelum penyimpanan
  benar-benar berhasil.
- Tampilkan pesan dari peladen (`err.response.data.pesan`) bila ada.

---

## 4. Keamanan yang sudah ditetapkan — jangan dimundurkan

- `JWT_SECRET` **tidak boleh** punya nilai cadangan di kode sumber. Selalu
  `env.JWT_SECRET`, tidak pernah `process.env.JWT_SECRET || '...'`.
- Sesi admin disimpan lewat `frontend/src/utils/sesiAdmin.js` — jangan
  membaca/menulis `sessionStorage`/`localStorage` untuk sesi secara langsung.
- Masa berlaku sesi ditentukan **peladen** (8 jam, atau 7 hari bila "Ingat
  saya"), bukan peramban.
- Aturan tampil menu terpusat di `backend/utils/menuTampil.js`.
- Endpoint publik menyaring di peladen (`?publik=1`), bukan di peramban.

---

## 5. Gaya kode

- Backend **CommonJS** (`require`), MVC ketat: rute → controller → model.
- Penamaan dan komentar dalam **bahasa Indonesia**, mengikuti berkas sekitarnya.
- Komentar menjelaskan **mengapa**, terutama bila menyimpan keputusan yang
  mahal ditemukan kembali.
- Jangan menaikkan jumlah masalah lint. Bandingkan dengan versi `HEAD` dari
  berkas yang sama sebelum menyatakan angkanya bertambah/berkurang.

---

## 6. Perkakas pengujian — jebakan yang sudah pernah memakan waktu

- `fetch` bawaan Node **menolak port 5060/5061** (daftar port terlarang
  WHATWG) dan hanya melaporkan `fetch failed`.
- `fetch` bawaan Node mendahulukan `::1` untuk `localhost`; peladen di sini
  mengikat IPv4 — pakai **`127.0.0.1`**.
- Chrome mutakhir menolak `GET /json/new`, hanya menerima **`PUT`**.
- `/api/menus` **terbuka untuk umum**; jangan memakainya untuk menguji
  otentikasi. Pakai `/api/aktivitas`.
- Pembatas laju login: **10 kali per 15 menit**. Ia tersimpan di memori,
  jadi menyalakan ulang peladen mengosongkannya.
