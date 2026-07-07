const db = require('../config/database');

// =========================================================================
//  MEDIA MODEL — akses tabel `media_konten`.
//  -----------------------------------------------------------------------
//  Mencatat setiap berkas media (gambar/dokumen/video) beserta URL-nya.
//  Saat di-upload dari editor, `pemilik_id` biasanya masih null ("belum
//  tertaut") dan ditautkan ke halaman/berita saat konten disimpan.
// =========================================================================

class MediaModel {
  // Simpan satu record media, kembalikan barisnya.
  static async create({
    jenis_pemilik = 'halaman_konten',
    pemilik_id = null,
    url_berkas,
    jenis_media = 'gambar',
    teks_alternatif = null,
    urutan_tampil = 0,
  }) {
    const [row] = await db('media_konten')
      .insert({
        jenis_pemilik,
        pemilik_id,
        url_berkas,
        jenis_media,
        teks_alternatif,
        urutan_tampil,
      })
      .returning('*');
    return row;
  }
}

module.exports = MediaModel;
