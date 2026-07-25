const db = require('../config/database');

const TABLE = 'logo_mitra';

const LogoMitra = {
  getAll: () => {
    return db(TABLE).orderBy('urutan_tampil', 'asc');
  },
  
  getById: (id) => {
    return db(TABLE).where({ id }).first();
  },

  // MySQL tidak mendukung RETURNING, jadi baris hasil diambil ulang setelah simpan.
  // Keduanya mengembalikan satu objek baris (bukan array).
  create: async (data) => {
    const [insertId] = await db(TABLE).insert(data);
    return await db(TABLE).where({ id: insertId }).first();
  },

  update: async (id, data) => {
    await db(TABLE).where({ id }).update(data);
    return await db(TABLE).where({ id }).first();
  },

  delete: (id) => {
    return db(TABLE).where({ id }).del();
  }
};

module.exports = LogoMitra;
