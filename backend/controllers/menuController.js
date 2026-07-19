const MenuModel = require('../models/menuModel');
const { logActivityInternal } = require('./aktivitasAdminController');

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
      
      if (!nama_menu || !ikon_menu || !jenis_menu) {
        return res.status(400).json({ pesan: 'Nama menu, ikon, dan jenis menu wajib diisi.' });
      }

      let finalSlug = slug_atau_tautan;
      if (!finalSlug && jenis_menu !== 'link') {
        finalSlug = nama_menu.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      }

      if (!induk_id) {
        const allMenus = await MenuModel.getAll();
        const mainMenus = allMenus.filter(m => !m.induk_id);
        if (mainMenus.length >= 9) {
          return res.status(400).json({ pesan: 'Batas maksimum menu utama (9 menu) telah tercapai.' });
        }
      }

      const newMenu = await MenuModel.create({
        nama_menu,
        ikon_menu,
        jenis_menu,
        induk_id: induk_id || null,
        slug_atau_tautan: finalSlug,
      });
      
      // LOG AKTIVITAS
      const pName = req.user?.nama || 'System';
      const pRole = req.user?.role || 'Unknown';

      if (induk_id) {
        const parent = await MenuModel.getById(induk_id);
        const parentName = parent ? parent.nama_menu : 'induk_id ' + induk_id;
        await logActivityInternal(pName, pRole, `Menambahkan sub menu baru: "${nama_menu}" pada menu "${parentName}"`);
      } else {
        await logActivityInternal(pName, pRole, `Membuat menu utama baru: "${nama_menu}"`);
      }

      res.status(201).json({ pesan: 'Menu berhasil ditambahkan', data: newMenu });
    } catch (error) {
      console.error('Error createMenu:', error);
      res.status(500).json({ pesan: 'Gagal menambahkan menu' });
    }
  }

  // DELETE /api/menus/:id
  static async deleteMenu(req, res) {
    try {
      const { id } = req.params;
      const menu = await MenuModel.getById(id);
      await MenuModel.delete(id);
      
      const pName = req.user?.nama || 'System';
      const pRole = req.user?.role || 'Unknown';
      await logActivityInternal(pName, pRole, `Menghapus menu: "${menu?.nama_menu || id}"`);

      res.json({ pesan: 'Menu berhasil dihapus' });
    } catch (error) {
      console.error('Error deleteMenu:', error);
      res.status(500).json({ pesan: 'Gagal menghapus menu' });
    }
  }

  // PATCH /api/menus/reorder
  static async reorderMenus(req, res) {
    try {
      const { updates } = req.body; 
      if (!updates || !Array.isArray(updates)) {
        return res.status(400).json({ pesan: 'Format updates tidak valid' });
      }
      await MenuModel.updateUrutan(updates);
      
      const pName = req.user?.nama || 'System';
      const pRole = req.user?.role || 'Unknown';
      await logActivityInternal(pName, pRole, `Mengubah urutan navigasi menu`);

      res.json({ pesan: 'Urutan menu berhasil diperbarui' });
    } catch (error) {
      console.error('Error reorderMenus:', error);
      res.status(500).json({ pesan: 'Gagal mengubah urutan menu' });
    }
  }

  // PATCH /api/menus/:id
  static async updateMenu(req, res) {
    try {
      const { id } = req.params;
      const data = req.body;
      const updatedMenu = await MenuModel.update(id, data);
      
      const pName = req.user?.nama || 'System';
      const pRole = req.user?.role || 'Unknown';
      await logActivityInternal(pName, pRole, `Memperbarui menu: "${data.nama_menu || updatedMenu.nama_menu}"`);

      res.json({ pesan: 'Menu berhasil diperbarui', data: updatedMenu });
    } catch (error) {
      console.error('Error updateMenu:', error);
      res.status(500).json({ pesan: 'Gagal memperbarui menu' });
    }
  }

  // POST /api/menus/convert-to-submenu
  static async convertToSubmenu(req, res) {
    try {
      const { idMenuUtama, namaSubmenuBaru, ikonSubmenuBaru } = req.body;
      if (!idMenuUtama || !namaSubmenuBaru || !ikonSubmenuBaru) {
        return res.status(400).json({ pesan: 'Data tidak lengkap' });
      }

      const menuUtama = await MenuModel.getById(idMenuUtama);
      if (!menuUtama) {
        return res.status(404).json({ pesan: 'Menu utama tidak ditemukan' });
      }

      const newSubmenu = await MenuModel.convertToSubmenu(
        idMenuUtama, 
        namaSubmenuBaru, 
        ikonSubmenuBaru, 
        menuUtama.jenis_menu, 
        menuUtama.slug_atau_tautan
      );
      
      const pName = req.user?.nama || 'System';
      const pRole = req.user?.role || 'Unknown';
      await logActivityInternal(pName, pRole, `Memindahkan konten menu "${menuUtama.nama_menu}" menjadi submenu "${namaSubmenuBaru}"`);

      res.status(201).json({ pesan: 'Konten berhasil dipindahkan ke submenu', data: newSubmenu });
    } catch (error) {
      console.error('Error convertToSubmenu:', error);
      res.status(500).json({ pesan: 'Gagal memindahkan konten ke submenu' });
    }
  }
}

module.exports = MenuController;
