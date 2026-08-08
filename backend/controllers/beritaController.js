const db = require('../config/database');
const { logActivityInternal } = require('./aktivitasAdminController');
// Menormalkan waktu dari badan permintaan. Lihat penjelasan lengkap di sana:
// untai ISO-8601 yang dikirim frontend ditolak MySQL, dan memformatnya sendiri
// berisiko menyimpan jam UTC alih-alih jam WIB.
const { keWaktuDb } = require('../utils/waktu');
// Kolom `urutan_tampil` ditambahkan migrasi 20260807170000. Di peladen yang
// migrasinya belum dijalankan, kolom itu belum ada — dan MySQL membatalkan
// SELURUH pernyataan begitu menemuinya. Lihat utils/skema.js untuk riwayat
// lengkap kejadiannya di production.
const { adaKolom } = require('../utils/skema');

class BeritaController {
  static async getBeritaByMenu(req, res) {
    const { menu_id } = req.params;
    try {
      const pakaiUrutan = await adaKolom('berita', 'urutan_tampil');

      const kueri = db('berita')
        .leftJoin('pengguna', 'berita.penulis_id', 'pengguna.id')
        .select(
          'berita.*',
          'pengguna.email as pembuat_email',
          'pengguna.nama_pengguna as pembuat_nama'
        )
        .where('berita.menu_id', menu_id);
        // Urutan kini ditentukan admin lewat seret-lepas di panel, disimpan pada
        // `urutan_tampil`. Kolom itu diisi mengikuti urutan yang berlaku
        // sebelumnya saat migrasi, jadi peralihannya tidak mengubah tampilan
        // apa pun sampai admin benar-benar menggesernya.
        //
        // Pengurutan waktu DIPERTAHANKAN sebagai pemutus seri. Baris yang belum
        // pernah tersentuh pengurutan bernilai 0 semua, dan MySQL tidak
        // menjamin urutan baris yang nilainya seri — tanpa pemutus ini,
        // urutannya dapat berubah-ubah di antara dua permintaan yang sama.
        //
      // Dipakai OLEH SISI ADMIN DAN PENGUNJUNG SEKALIGUS (NewsCardContent
      // memanggil endpoint yang sama), sehingga apa yang disusun admin
      // persis itulah yang dilihat pembaca.
      //
      // Bila kolomnya belum ada, pengurutan menurut waktu di bawah tetap
      // berjalan sendirian — itu PERSIS perilaku sebelum fitur seret-lepas
      // ada, sehingga halaman pengunjung tetap utuh dan terurut wajar.
      if (pakaiUrutan) kueri.orderBy('berita.urutan_tampil', 'asc');
      kueri.orderByRaw('COALESCE(berita.waktu_tayang, berita.dibuat_pada) DESC');

      res.json(await kueri);
    } catch (error) {
      console.error('Error getBerita:', error);
      res.status(500).json({ pesan: 'Gagal mengambil data berita' });
    }
  }

  static async createBerita(req, res) {
    const { menu_id } = req.params;
    const { judul, deskripsi_kaya, statusTayang, waktuTayang, coverUrl } = req.body;
    
    if (!judul) return res.status(400).json({ pesan: 'Judul berita wajib diisi' });

    try {
      const pName = req.user?.nama || 'System';
      const pRole = req.user?.role || 'Unknown';

      const status = statusTayang ? 'terbit' : 'draf';

      const waktu = keWaktuDb(waktuTayang);
      if (!waktu.sah) return res.status(400).json({ pesan: 'Format waktu tayang tidak dikenali' });

      // Berita baru diletakkan PALING ATAS, meneruskan perilaku sebelumnya —
      // dahulu itu terjadi dengan sendirinya karena urutannya menurut waktu.
      //
      // Caranya mengambil nilai terkecil lalu menguranginya satu, bukan
      // menggeser seluruh baris lain ke bawah. Menggeser berarti memperbarui
      // setiap baris pada menu itu untuk satu penambahan, dan dua penambahan
      // yang berbarengan dapat saling menimpa di tengah jalan. Nilai negatif
      // sama sekali tidak menjadi soal: yang dibaca hanya urutan relatifnya,
      // dan penomoran dirapikan kembali begitu admin menyeret sesuatu.
      //
      // Seluruh langkah ini DILEWATI bila kolomnya belum ada di basis data.
      // Tanpa penjagaan itu, satu kolom yang tertinggal membuat penambahan
      // berita mustahil sama sekali — persis yang terjadi di production pada
      // 8 Agustus 2026.
      const pakaiUrutan = await adaKolom('berita', 'urutan_tampil');
      let urutanBaru = 0;
      if (pakaiUrutan) {
        const terkecil = await db('berita').where('menu_id', menu_id).min('urutan_tampil as nilai').first();
        urutanBaru = terkecil && terkecil.nilai !== null ? Number(terkecil.nilai) - 1 : 0;
      }

      // `penulis_id` menunjuk baris di tabel `pengguna` lewat kunci asing.
      // Token berlaku sehari penuh, sehingga ia dapat bertahan melewati
      // penghapusan penggunanya — atau melewati pemulihan basis data yang
      // menomori ulang penggunanya, keadaan yang lazim terjadi saat data
      // dipindahkan ke peladen production.
      //
      // Bila baris itu tidak ada, MySQL menolak SELURUH penyisipan dengan
      // ER_NO_REFERENCED_ROW_2 dan beritanya gagal dibuat — padahal kolom ini
      // sendiri boleh kosong (ON DELETE SET NULL). Inilah bentuk cacat yang
      // sukar dilacak: di komputer sendiri semuanya lancar sebab penggunanya
      // memang ada, sedangkan di production setiap penambahan berita berbalas
      // 500 tanpa keterangan apa pun.
      //
      // Karena itu dipastikan lebih dahulu. Nama penulis yang hilang jauh lebih
      // ringan akibatnya daripada berita yang tidak dapat dibuat sama sekali.
      const idPenulis = req.user?.id || null;
      const penulisTerdaftar = idPenulis
        ? await db('pengguna').where('id', idPenulis).first('id')
        : null;
      if (idPenulis && !penulisTerdaftar) {
        console.warn(`[berita] penulis_id ${idPenulis} tidak ada di tabel pengguna — disimpan sebagai NULL.`);
      }

      const barisBaru = {
        menu_id,
        penulis_id: penulisTerdaftar ? idPenulis : null,
        judul,
        deskripsi_kaya: deskripsi_kaya || '',
        url_foto: coverUrl || null,
        status,
        waktu_tayang: waktu.nilai,
      };
      // Menyebut kolom yang belum ada pada INSERT membatalkan seluruh
      // penyisipan, jadi kolomnya baru disertakan bila memang tersedia.
      if (pakaiUrutan) barisBaru.urutan_tampil = urutanBaru;

      // MySQL tidak mendukung RETURNING, jadi baris baru dibaca ulang lewat insertId.
      const [insertId] = await db('berita').insert(barisBaru);
      const inserted = await db('berita').where({ id: insertId }).first();

      await logActivityInternal(pName, pRole, `Menambahkan berita baru: "${judul}"`);
      res.status(201).json({ pesan: 'Berita berhasil dibuat', data: inserted });
    } catch (error) {
      console.error('Error createBerita:', error);
      res.status(500).json({ pesan: 'Gagal membuat berita' });
    }
  }

  static async updateBerita(req, res) {
    const { id } = req.params;
    const { judul, deskripsi_kaya, statusTayang, waktuTayang, coverUrl } = req.body;

    try {
      const pName = req.user?.nama || 'System';
      const pRole = req.user?.role || 'Unknown';
      
      const updateData = { diperbarui_pada: db.fn.now() };
      if (judul !== undefined) updateData.judul = judul;
      if (deskripsi_kaya !== undefined) updateData.deskripsi_kaya = deskripsi_kaya;
      if (statusTayang !== undefined) updateData.status = statusTayang ? 'terbit' : 'draf';
      if (waktuTayang !== undefined) {
        const waktu = keWaktuDb(waktuTayang);
        if (!waktu.sah) return res.status(400).json({ pesan: 'Format waktu tayang tidak dikenali' });
        updateData.waktu_tayang = waktu.nilai;
      }
      if (coverUrl !== undefined) updateData.url_foto = coverUrl;

      // Pastikan beritanya ada sebelum diperbarui, karena MySQL tidak bisa
      // mengembalikan baris hasil update (tidak mendukung RETURNING).
      const existing = await db('berita').where({ id }).first();
      if (!existing) return res.status(404).json({ pesan: 'Berita tidak ditemukan' });

      await db('berita').where({ id }).update(updateData);
      const updated = await db('berita').where({ id }).first();

      await logActivityInternal(pName, pRole, `Memperbarui berita: "${updated.judul}"`);
      res.json({ pesan: 'Berita berhasil diperbarui', data: updated });
    } catch (error) {
      console.error('Error updateBerita:', error);
      res.status(500).json({ pesan: 'Gagal memperbarui berita' });
    }
  }

  static async deleteBerita(req, res) {
    const { id } = req.params;
    try {
      const pName = req.user?.nama || 'System';
      const pRole = req.user?.role || 'Unknown';

      const berita = await db('berita').where({ id }).first();
      if (!berita) return res.status(404).json({ pesan: 'Berita tidak ditemukan' });

      await db('berita').where({ id }).del();
      await logActivityInternal(pName, pRole, `Menghapus berita: "${berita.judul}"`);
      
      res.json({ pesan: 'Berita berhasil dihapus' });
    } catch (error) {
      console.error('Error deleteBerita:', error);
      res.status(500).json({ pesan: 'Gagal menghapus berita' });
    }
  }
}

module.exports = BeritaController;
