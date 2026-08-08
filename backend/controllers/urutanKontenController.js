const db = require('../config/database');
const { logActivityInternal } = require('./aktivitasAdminController');

// =========================================================================
//  PENGURUTAN ISI KONTEN — dipakai bersama tiga tabel
//  -----------------------------------------------------------------------
//  halaman_konten (layout Default), berita, dan profil_pegawai sama-sama
//  memiliki kolom `urutan_tampil`, dan ketiganya diurutkan menaik berdasarkan
//  kolom itu di sisi pengunjung. Yang berbeda hanya nama tabelnya, jadi
//  pengendalinya dibuat satu dan dicetak tiga kali.
//
//  MENGAPA ENDPOINT TERSENDIRI, PADAHAL SUDAH ADA "upsert"
//  -------------------------------------------------------
//  Penyimpanan yang sudah ada (upsertKonten / upsertProfil) bekerja dengan cara
//  MENGHAPUS SELURUH baris milik satu menu lalu menyisipkannya kembali. Dipakai
//  untuk sekadar menggeser urutan, cara itu membawa dua ongkos berat:
//
//    1. Seluruh isi konten harus dikirim ulang dari peramban. Satu halaman
//       dapat memuat puluhan ribu aksara HTML per baris — dikirim bolak-balik
//       hanya untuk menukar dua posisi.
//    2. Baris yang disisipkan kembali mendapat ID BARU. Padahal ID itu dipakai
//       sebagai tujuan tautan edit dan penyorotan baris; sesudah satu kali
//       seret, seluruh tautan yang sudah terbuka menunjuk baris yang tidak ada.
//
//  Endpoint ini hanya menyentuh satu kolom. ID, isi, status, dan waktu tayang
//  tidak berubah sama sekali.
//
//  MENGAPA DAFTARNYA HARUS UTUH
//  ----------------------------
//  Yang diterima adalah SELURUH id milik menu itu dalam urutan barunya, dan
//  kelengkapannya diperiksa. Daftar sebagian tampak lebih hemat, tetapi
//  menyisakan lubang dan nilai kembar pada baris yang tidak disebut — dan dua
//  baris ber-`urutan_tampil` sama akan tampil dalam urutan yang tidak menentu,
//  sebab MySQL tidak menjamin urutan baris yang nilainya seri. Menolak daftar
//  yang tidak utuh juga menangkap keadaan di mana peramban memegang data basi:
//  lebih baik gagal terang-terangan daripada mengacak urutan diam-diam.
// =========================================================================

// Nama yang dipakai pada catatan aktivitas admin.
const { adaKolom } = require('../utils/skema');

const SEBUTAN = {
  halaman_konten: 'isi konten',
  berita: 'berita',
  profil_pegawai: 'profil pegawai',
};

const buatPengubahUrutan = (tabel) =>
  async function ubahUrutan(req, res) {
    const { menu_id } = req.params;
    const { urutan } = req.body;

    if (!Array.isArray(urutan) || urutan.length === 0) {
      return res.status(400).json({ pesan: 'Daftar urutan tidak valid (harus array id yang tidak kosong).' });
    }

    // Id dinormalkan menjadi bilangan lebih dahulu. Tanpa ini "12" dan 12
    // terhitung sebagai dua anggota berbeda saat kelengkapannya diperiksa.
    const idBaru = urutan.map((v) => Number(v));
    if (idBaru.some((v) => !Number.isInteger(v))) {
      return res.status(400).json({ pesan: 'Daftar urutan memuat id yang bukan bilangan.' });
    }

    const himpunanBaru = new Set(idBaru);
    if (himpunanBaru.size !== idBaru.length) {
      return res.status(400).json({ pesan: 'Daftar urutan memuat id kembar.' });
    }

    try {
      // Tanpa kolomnya, penyusunan ulang mustahil dilakukan. Yang penting di
      // sini adalah MENGATAKANNYA: seandainya dibiarkan, admin hanya melihat
      // urutan yang melompat kembali ke semula tanpa keterangan apa pun,
      // dan tidak akan pernah menduga penyebabnya ada di basis data.
      if (!(await adaKolom(tabel, 'urutan_tampil'))) {
        return res.status(503).json({
          pesan:
            `Pengurutan ${SEBUTAN[tabel] || tabel} belum aktif di peladen ini karena ` +
            'struktur basis datanya belum diperbarui. Jalankan migrasi (npm run migrasi) ' +
            'atau tempelkan .deploy_plan/query.txt di phpMyAdmin, lalu coba lagi.',
        });
      }

      const idTersimpan = await db(tabel).where('menu_id', menu_id).pluck('id');
      const himpunanTersimpan = new Set(idTersimpan.map(Number));

      const cocok =
        himpunanBaru.size === himpunanTersimpan.size &&
        [...himpunanBaru].every((v) => himpunanTersimpan.has(v));

      if (!cocok) {
        // Termasuk keadaan di mana peramban menyertakan id milik menu LAIN —
        // pemeriksaan ini sekaligus menutup kemungkinan satu menu mengubah
        // urutan menu tetangganya.
        return res.status(409).json({
          pesan:
            'Daftar urutan tidak sesuai dengan data terakhir di peladen. ' +
            'Muat ulang halaman lalu susun kembali urutannya.',
        });
      }

      await db.transaction(async (trx) => {
        for (let i = 0; i < idBaru.length; i++) {
          await trx(tabel)
            .where('id', idBaru[i])
            .andWhere('menu_id', menu_id)
            .update({ urutan_tampil: i });
        }
      });

      const menuInfo = await db('menu').select('nama_menu').where('id', menu_id).first();
      const namaMenu = menuInfo ? menuInfo.nama_menu : `ID ${menu_id}`;
      await logActivityInternal(
        req.user?.nama || 'System',
        req.user?.role || 'Unknown',
        `Mengubah urutan ${SEBUTAN[tabel]} pada menu "${namaMenu}"`
      );

      return res.json({ pesan: 'Urutan berhasil disimpan' });
    } catch (error) {
      // Detail teknisnya cukup di log peladen; mengirim error.message ke
      // peramban membocorkan nama tabel beserta kuerinya.
      console.error(`Error ubahUrutan(${tabel}):`, error);
      return res.status(500).json({ pesan: 'Gagal menyimpan urutan' });
    }
  };

module.exports = {
  urutanHalamanKonten: buatPengubahUrutan('halaman_konten'),
  urutanBerita: buatPengubahUrutan('berita'),
  urutanProfilPegawai: buatPengubahUrutan('profil_pegawai'),
};
