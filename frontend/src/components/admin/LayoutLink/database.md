### Catatan Implementasi: Link Menu (Admin)

Untuk mendukung fitur "Kelola Link Menu" pada halaman admin (`Link.jsx`), struktur backend yang sudah ada dapat dipakai tanpa perubahan skema database baru.

#### 1. Tabel `menu`

*   **Kolom `slug_atau_tautan`:** kolom ini sudah tersedia dan dipakai untuk menyimpan URL tujuan ketika `jenis_menu` bernilai `link`.
*   **Kolom `jenis_menu`:** digunakan untuk membedakan menu tipe `post`, `page`, atau `link`.

#### 2. Endpoint GET `/api/menus`

*   **Respons API:** ketika data menu diambil, setiap objek menu/submenu harus menyertakan:
    - `id`
    - `induk_id`
    - `nama_menu`
    - `jenis_menu`
    - `slug_atau_tautan`
    - `is_aktif`
    - `urutan_tampil`

*   **Tujuan:** frontend bisa membedakan apakah item menu itu tipe `link` atau `post`, lalu menavigasi ke halaman admin yang tepat.

#### 3. Endpoint update URL menu (baru)

*   **Endpoint:** `PUT /api/menus/links`
*   **Autentikasi:** harus dilindungi oleh middleware admin (`authMiddleware`).
*   **Payload yang dipakai:**

```json
{
  "updates": [
    { "id": 1, "link": "https://example.com" },
    { "id": 2, "link": "https://example.org" }
  ]
}
```

*   **Catatan penting:** field `link` pada payload frontend adalah nama sementara untuk input pengguna. Di sisi backend, nilai tersebut harus disimpan ke kolom database `slug_atau_tautan`.

#### 4. Logika update yang disarankan

*   Untuk setiap item dalam `updates`, backend harus memetakan nilai `link` ke kolom `slug_atau_tautan` pada menu dengan `id` yang sesuai.
*   Tidak perlu menambah kolom baru pada tabel `menu`.
*   Tidak perlu mengubah migrasi database yang sudah ada.

#### 5. Ringkasan alur proyek

*   Saat admin membuat menu tipe `link`, URL input akan disimpan di `slug_atau_tautan`.
*   Saat admin membuka halaman `Pengaturan Menu`, tombol `Edit` akan membawa ke halaman admin `Link`.
*   Halaman `Link.jsx` hanya bertugas mengumpulkan URL baru dan mengirimkan update ke backend.
*   Tampilan halaman user/beranda tidak perlu disentuh pada tahap ini.