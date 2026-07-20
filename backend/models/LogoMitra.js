const db = require('../config/database');

const TABLE = 'logo_mitra';

const LogoMitra = {
  getAll: () => {
    return db(TABLE).orderBy('urutan_tampil', 'asc');
  },
  
  getById: (id) => {
    return db(TABLE).where({ id }).first();
  },

  create: (data) => {
    return db(TABLE).insert(data).returning('*');
  },

  update: (id, data) => {
    return db(TABLE).where({ id }).update(data).returning('*');
  },

  delete: (id) => {
    return db(TABLE).where({ id }).del();
  }
};

module.exports = LogoMitra;
