const db = require('../config/database');

// Tabel `pengaturan_tema` hanya berisi satu baris konfigurasi (id = 1) — baris
// yang sama juga menyimpan `url_logo_header` (dipakai berandaHeaderController).
// Karena itu update di sini sengaja HANYA menyentuh kolom warna & font; kolom
// url_logo_header tidak ikut ditimpa agar pengaturan Header tidak terhapus.
class PengaturanTema {
  static async getTema() {
    return await db('pengaturan_tema').where('id', 1).first();
  }

  static async updateTema(data) {
    const payload = {
      warna_latar: data.warna_latar,
      warna_utama: data.warna_utama,
      warna_sekunder: data.warna_sekunder,
      warna_teks: data.warna_teks,
      font_pilihan: data.font_pilihan,
      diperbarui_pada: db.fn.now(),
    };

    const existing = await this.getTema();
    // MySQL tidak mendukung RETURNING, jadi baris disimpan dulu lalu dibaca ulang.
    if (!existing) {
      await db('pengaturan_tema').insert({ id: 1, ...payload });
    } else {
      await db('pengaturan_tema').where('id', 1).update(payload);
    }
    return await this.getTema();
  }
}

module.exports = PengaturanTema;
