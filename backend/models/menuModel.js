const db = require('../config/database');

class MenuModel {
  // Ambil semua menu, bisa difilter untuk aktif saja
  static async getAll(onlyActive = false) {
    let query = db('menu').orderBy('urutan_tampil', 'asc').orderBy('id', 'asc');
    if (onlyActive) {
      query = query.where('is_aktif', true);
    }
    return await query;
  }

  // Buat menu baru.
  // MySQL tidak mendukung RETURNING, jadi baris utuh diambil ulang lewat insertId.
  static async create(data) {
    const [insertId] = await db('menu').insert(data);
    return await db('menu').where('id', insertId).first();
  }

  // Update menu, lalu kembalikan baris terbarunya.
  static async update(id, data) {
    await db('menu')
      .where('id', id)
      .update({ ...data, diperbarui_pada: db.fn.now() });
    return await db('menu').where('id', id).first();
  }

  // Update urutan secara batch
  static async updateUrutan(updates) {
    // updates adalah array of { id, urutan_tampil }
    const trx = await db.transaction();
    try {
      for (let item of updates) {
        await trx('menu').where('id', item.id).update({ urutan_tampil: item.urutan_tampil });
      }
      await trx.commit();
      return true;
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  // Ambil menu berdasarkan ID
  static async getById(id) {
    return await db('menu').where('id', id).first();
  }

  // Hapus menu beserta sub-menunya
  static async delete(id) {
    const trx = await db.transaction();
    try {
      // Hapus submenus terlebih dahulu (kalau ada)
      await trx('menu').where('induk_id', id).del();
      // Baru hapus menu utama
      await trx('menu').where('id', id).del();
      await trx.commit();
      return true;
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  // Mengubah konten menu utama menjadi submenu pertama
  static async convertToSubmenu(idMenuUtama, namaSubmenuBaru, ikonSubmenuBaru, jenisMenuUtama, slugAtauTautanUtama) {
    const trx = await db.transaction();
    try {
      // 1. Buat submenu baru.
      // Pada MySQL, insert hanya mengembalikan ID barunya — bukan baris utuh —
      // sehingga ID dipakai langsung dan barisnya diambil ulang di akhir.
      const [idSubmenu] = await trx('menu').insert({
        nama_menu: namaSubmenuBaru,
        ikon_menu: ikonSubmenuBaru,
        jenis_menu: jenisMenuUtama,
        slug_atau_tautan: slugAtauTautanUtama,
        induk_id: idMenuUtama
      });

      // 2. Transfer kepemilikan konten di 3 tabel yang terikat menu_id
      await trx('halaman_konten').where('menu_id', idMenuUtama).update({ menu_id: idSubmenu });
      
      // Jika migrasi belum ada/error, abaikan saja tabel lain dengan try catch per query opsional, 
      // tetapi asumsi tabel profil_pegawai & berita sudah ada
      await trx('profil_pegawai').where('menu_id', idMenuUtama).update({ menu_id: idSubmenu });
      await trx('berita').where('menu_id', idMenuUtama).update({ menu_id: idSubmenu });

      // Menu Utama tetap seperti semula (masih memiliki tipe post/link), tapi di frontend ia akan di-render sbg gerbang krn sdh punya submenu.
      const newSubmenu = await trx('menu').where('id', idSubmenu).first();

      await trx.commit();
      return newSubmenu;
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }
}

module.exports = MenuModel;
