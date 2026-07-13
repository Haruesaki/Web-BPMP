const MenuModel = require('../models/menuModel');

class MenuController {
  // GET /api/menus
  static async getMenus(req, res) {
    try {
      const menus = await MenuModel.getAll();
      res.json(menus);
    } catch (error) {
      console.error('Error getMenus:', error);
      res.status(500).json({ pesan: 'Gagal mengambil data menu' });
    }
  }

  // POST /api/menus
  static async createMenu(req, res) {
    try {
      const { nama_menu, ikon_menu, jenis_menu, induk_id, slug_atau_tautan } = req.body;
      
      // Validasi wajib (sesuai instruksi: nama, ikon, jenis wajib)
      if (!nama_menu || !ikon_menu || !jenis_menu) {
        return res.status(400).json({ pesan: 'Nama menu, ikon, dan jenis menu wajib diisi.' });
      }

      // Generate slug dari nama menu jika kosong, dan jika bukan link eksternal
      let finalSlug = slug_atau_tautan;
      if (!finalSlug && jenis_menu !== 'link') {
        finalSlug = nama_menu.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      }

      const newMenu = await MenuModel.create({
        nama_menu,
        ikon_menu,
        jenis_menu,
        induk_id: induk_id || null,
        slug_atau_tautan: finalSlug,
      });

      res.status(201).json({ pesan: 'Menu berhasil ditambahkan', data: newMenu });
    } catch (error) {
      console.error('Error createMenu:', error);
      res.status(500).json({ pesan: 'Gagal menambahkan menu' });
    }
  }

  // PUT /api/menus/links
  static async updateLinks(req, res) {
    try {
      const { updates } = req.body;

      if (!Array.isArray(updates) || updates.length === 0) {
        return res.status(400).json({ pesan: 'Format updates tidak valid' });
      }

      const results = [];

      for (const item of updates) {
        if (!item?.id) {
          continue;
        }

        const updated = await MenuModel.update(item.id, {
          slug_atau_tautan: item.link || '',
        });

        results.push(updated);
      }

      res.json({ pesan: 'Link menu berhasil diperbarui', data: results });
    } catch (error) {
      console.error('Error updateLinks:', error);
      res.status(500).json({ pesan: 'Gagal memperbarui link menu' });
    }
  }

  // DELETE /api/menus/:id
  static async deleteMenu(req, res) {
    try {
      const { id } = req.params;
      await MenuModel.delete(id);
      res.json({ pesan: 'Menu berhasil dihapus' });
    } catch (error) {
      console.error('Error deleteMenu:', error);
      res.status(500).json({ pesan: 'Gagal menghapus menu' });
    }
  }

  // PATCH /api/menus/reorder
  static async reorderMenus(req, res) {
    try {
      const { updates } = req.body; // array of { id, urutan_tampil }
      if (!updates || !Array.isArray(updates)) {
        return res.status(400).json({ pesan: 'Format updates tidak valid' });
      }
      await MenuModel.updateUrutan(updates);
      res.json({ pesan: 'Urutan menu berhasil diperbarui' });
    } catch (error) {
      console.error('Error reorderMenus:', error);
      res.status(500).json({ pesan: 'Gagal mengubah urutan menu' });
    }
  }
}

module.exports = MenuController;
