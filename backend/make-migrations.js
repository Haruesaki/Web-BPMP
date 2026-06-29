const fs = require('fs');
const path = require('path');

const migrationsDir = path.join(__dirname, 'db', 'migrations');
if (!fs.existsSync(migrationsDir)) fs.mkdirSync(migrationsDir, { recursive: true });

function formatTime(date, offset) {
    const d = new Date(date.getTime() + offset * 1000);
    return d.toISOString().replace(/[-T:.Z]/g, '').substring(0, 14);
}

const now = new Date();

const migrations = [
    {
        name: 'create_peran_table',
        up: `
exports.up = function(knex) {
  return knex.schema.createTable('peran', (table) => {
    table.increments('id').primary();
    table.string('nama_peran', 50).notNullable().unique();
    table.boolean('is_superadmin').notNullable().defaultTo(false);
    table.timestamp('dibuat_pada', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });
};
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('peran');
};
`
    },
    {
        name: 'create_pengguna_table',
        up: `
exports.up = function(knex) {
  return knex.schema.createTable('pengguna', (table) => {
    table.increments('id').primary();
    table.integer('peran_id').notNullable().references('id').inTable('peran').onDelete('RESTRICT');
    table.string('nama_pengguna', 100).notNullable().unique();
    table.string('email', 150).notNullable().unique();
    table.string('kata_sandi_hash', 255).notNullable();
    table.boolean('is_aktif').notNullable().defaultTo(true);
    table.timestamp('dibuat_pada', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('diperbarui_pada', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.index('peran_id', 'idx_pengguna_peran_id');
  });
};
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('pengguna');
};
`
    },
    {
        name: 'create_menu_table',
        up: `
exports.up = async function(knex) {
  await knex.raw("CREATE TYPE jenis_menu_enum AS ENUM ('post', 'page', 'link')");
  return knex.schema.createTable('menu', (table) => {
    table.increments('id').primary();
    table.integer('induk_id').references('id').inTable('menu').onDelete('CASCADE');
    table.string('nama_menu', 150).notNullable();
    table.string('ikon_menu', 100);
    table.specificType('jenis_menu', 'jenis_menu_enum').notNullable().defaultTo('page');
    table.string('slug_atau_tautan', 255);
    table.integer('urutan_tampil').notNullable().defaultTo(0);
    table.boolean('is_aktif').notNullable().defaultTo(true);
    table.timestamp('dibuat_pada', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('diperbarui_pada', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.index('induk_id', 'idx_menu_induk_id');
  });
};
exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('menu');
  await knex.raw("DROP TYPE IF EXISTS jenis_menu_enum");
};
`
    },
    {
        name: 'create_hak_akses_menu_table',
        up: `
exports.up = function(knex) {
  return knex.schema.createTable('hak_akses_menu', (table) => {
    table.increments('id').primary();
    table.integer('peran_id').notNullable().references('id').inTable('peran').onDelete('CASCADE');
    table.integer('menu_id').notNullable().references('id').inTable('menu').onDelete('CASCADE');
    table.boolean('bisa_lihat').notNullable().defaultTo(true);
    table.boolean('bisa_edit').notNullable().defaultTo(false);
    table.unique(['peran_id', 'menu_id']);
  });
};
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('hak_akses_menu');
};
`
    },
    {
        name: 'create_halaman_konten_table',
        up: `
exports.up = async function(knex) {
  await knex.raw("CREATE TYPE status_konten_enum AS ENUM ('draf', 'terbit', 'arsip')");
  return knex.schema.createTable('halaman_konten', (table) => {
    table.increments('id').primary();
    table.integer('menu_id').references('id').inTable('menu').onDelete('SET NULL');
    table.string('kunci_halaman', 100).notNullable().unique();
    table.string('judul', 255).notNullable();
    table.text('deskripsi_kaya');
    table.specificType('status', 'status_konten_enum').notNullable().defaultTo('draf');
    table.timestamp('tanggal_terbit', { useTz: true });
    table.integer('dibuat_oleh').references('id').inTable('pengguna').onDelete('SET NULL');
    table.timestamp('dibuat_pada', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('diperbarui_pada', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.index('menu_id', 'idx_halaman_konten_menu_id');
    table.index('status', 'idx_halaman_konten_status');
  });
};
exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('halaman_konten');
  await knex.raw("DROP TYPE IF EXISTS status_konten_enum");
};
`
    },
    {
        name: 'create_bagian_konten_table',
        up: `
exports.up = function(knex) {
  return knex.schema.createTable('bagian_konten', (table) => {
    table.increments('id').primary();
    table.integer('halaman_konten_id').notNullable().references('id').inTable('halaman_konten').onDelete('CASCADE');
    table.string('jenis_bagian', 50).notNullable().defaultTo('default');
    table.string('judul', 255);
    table.text('deskripsi');
    table.string('warna_latar_override', 20);
    table.integer('urutan_tampil').notNullable().defaultTo(0);
    table.timestamp('dibuat_pada', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('diperbarui_pada', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.index('halaman_konten_id', 'idx_bagian_konten_halaman_id');
  });
};
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('bagian_konten');
};
`
    },
    {
        name: 'create_linimasa_konten_table',
        up: `
exports.up = function(knex) {
  return knex.schema.createTable('linimasa_konten', (table) => {
    table.increments('id').primary();
    table.integer('halaman_konten_id').notNullable().references('id').inTable('halaman_konten').onDelete('CASCADE');
    table.date('tanggal_terbit').notNullable();
    table.text('catatan_versi');
    table.timestamp('dibuat_pada', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.index('halaman_konten_id', 'idx_linimasa_konten_halaman_id');
  });
};
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('linimasa_konten');
};
`
    },
    {
        name: 'create_media_konten_table',
        up: `
exports.up = async function(knex) {
  await knex.raw("CREATE TYPE jenis_pemilik_media_enum AS ENUM ('berita', 'halaman_konten', 'bagian_konten')");
  await knex.raw("CREATE TYPE jenis_media_enum AS ENUM ('gambar', 'dokumen', 'video')");
  return knex.schema.createTable('media_konten', (table) => {
    table.increments('id').primary();
    table.specificType('jenis_pemilik', 'jenis_pemilik_media_enum').notNullable();
    table.integer('pemilik_id').notNullable();
    table.string('url_berkas', 500).notNullable();
    table.specificType('jenis_media', 'jenis_media_enum').notNullable().defaultTo('gambar');
    table.string('teks_alternatif', 255);
    table.integer('urutan_tampil').notNullable().defaultTo(0);
    table.timestamp('dibuat_pada', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.index(['jenis_pemilik', 'pemilik_id'], 'idx_media_konten_pemilik');
  });
};
exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('media_konten');
  await knex.raw("DROP TYPE IF EXISTS jenis_media_enum");
  await knex.raw("DROP TYPE IF EXISTS jenis_pemilik_media_enum");
};
`
    },
    {
        name: 'create_berita_table',
        up: `
exports.up = async function(knex) {
  await knex.raw("CREATE TYPE status_berita_enum AS ENUM ('draf', 'terbit', 'arsip')");
  return knex.schema.createTable('berita', (table) => {
    table.increments('id').primary();
    table.integer('penulis_id').references('id').inTable('pengguna').onDelete('SET NULL');
    table.string('judul', 255).notNullable();
    table.text('deskripsi_kaya');
    table.string('url_foto', 500);
    table.specificType('status', 'status_berita_enum').notNullable().defaultTo('draf');
    table.timestamp('waktu_tayang', { useTz: true });
    table.integer('jumlah_dilihat').notNullable().defaultTo(0);
    table.timestamp('dibuat_pada', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('diperbarui_pada', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.index('status', 'idx_berita_status');
    table.index('waktu_tayang', 'idx_berita_waktu_tayang');
    table.index('penulis_id', 'idx_berita_penulis_id');
  });
};
exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('berita');
  await knex.raw("DROP TYPE IF EXISTS status_berita_enum");
};
`
    },
    {
        name: 'create_pengaturan_tema_table',
        up: `
exports.up = function(knex) {
  return knex.schema.createTable('pengaturan_tema', (table) => {
    table.increments('id').primary();
    table.string('warna_latar', 20).notNullable().defaultTo('#FFFFFF');
    table.string('warna_utama', 20).notNullable().defaultTo('#1D4ED8');
    table.string('warna_sekunder', 20).notNullable().defaultTo('#64748B');
    table.string('warna_teks', 20).notNullable().defaultTo('#111111');
    table.string('font_pilihan', 100).notNullable().defaultTo('Inter');
    table.string('url_logo_header', 500);
    table.timestamp('diperbarui_pada', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  }).then(() => {
    return knex.raw('ALTER TABLE pengaturan_tema ADD CONSTRAINT ck_pengaturan_tema_tunggal CHECK (id = 1)');
  });
};
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('pengaturan_tema');
};
`
    },
    {
        name: 'create_pengaturan_situs_table',
        up: `
exports.up = function(knex) {
  return knex.schema.createTable('pengaturan_situs', (table) => {
    table.increments('id').primary();
    table.string('nama_situs', 150).notNullable().defaultTo('BPMP');
    table.string('teks_sambutan', 255);
    table.timestamp('diperbarui_pada', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  }).then(() => {
    return knex.raw('ALTER TABLE pengaturan_situs ADD CONSTRAINT ck_pengaturan_situs_tunggal CHECK (id = 1)');
  });
};
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('pengaturan_situs');
};
`
    },
    {
        name: 'create_tautan_media_sosial_table',
        up: `
exports.up = function(knex) {
  return knex.schema.createTable('tautan_media_sosial', (table) => {
    table.increments('id').primary();
    table.string('platform', 50).notNullable().unique();
    table.string('nama_pengguna_atau_no', 150);
    table.string('url_tautan', 500);
    table.boolean('is_tampil').notNullable().defaultTo(true);
    table.integer('urutan_tampil').notNullable().defaultTo(0);
  });
};
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('tautan_media_sosial');
};
`
    },
    {
        name: 'create_info_kontak_table',
        up: `
exports.up = function(knex) {
  return knex.schema.createTable('info_kontak', (table) => {
    table.increments('id').primary();
    table.string('posel', 150);
    table.string('no_telepon', 50);
    table.text('alamat');
    table.timestamp('diperbarui_pada', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  }).then(() => {
    return knex.raw('ALTER TABLE info_kontak ADD CONSTRAINT ck_info_kontak_tunggal CHECK (id = 1)');
  });
};
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('info_kontak');
};
`
    },
    {
        name: 'create_logo_mitra_table',
        up: `
exports.up = function(knex) {
  return knex.schema.createTable('logo_mitra', (table) => {
    table.increments('id').primary();
    table.string('nama_mitra', 150);
    table.string('url_logo', 500).notNullable();
    table.boolean('is_tampil').notNullable().defaultTo(true);
    table.integer('urutan_tampil').notNullable().defaultTo(0);
    table.timestamp('dibuat_pada', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });
};
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('logo_mitra');
};
`
    },
    {
        name: 'create_banner_beranda_table',
        up: `
exports.up = async function(knex) {
  await knex.raw("CREATE TYPE jenis_banner_enum AS ENUM ('banner_1', 'banner_2')");
  return knex.schema.createTable('banner_beranda', (table) => {
    table.increments('id').primary();
    table.specificType('jenis_banner', 'jenis_banner_enum').notNullable();
    table.string('judul', 255);
    table.string('subjudul', 255);
    table.string('url_gambar', 500);
    table.string('warna_latar_override', 20);
    table.integer('urutan_tampil').notNullable().defaultTo(0);
    table.boolean('is_aktif').notNullable().defaultTo(true);
    table.timestamp('dibuat_pada', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });
};
exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('banner_beranda');
  await knex.raw("DROP TYPE IF EXISTS jenis_banner_enum");
};
`
    },
    {
        name: 'create_tautan_footer_table',
        up: `
exports.up = function(knex) {
  return knex.schema.createTable('tautan_footer', (table) => {
    table.increments('id').primary();
    table.string('label', 150).notNullable();
    table.string('url', 500).notNullable();
    table.integer('urutan_tampil').notNullable().defaultTo(0);
  });
};
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('tautan_footer');
};
`
    },
    {
        name: 'create_youtube_cache_table',
        up: `
exports.up = function(knex) {
  return knex.schema.createTable('youtube_cache', (table) => {
    table.increments('id').primary();
    table.jsonb('videos_data').notNullable();
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });
};
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('youtube_cache');
};
`
    },
    {
        name: 'seed_initial_data',
        up: `
exports.up = async function(knex) {
  await knex('peran').insert([
    { nama_peran: 'superadmin', is_superadmin: true },
    { nama_peran: 'admin', is_superadmin: false }
  ]);
  await knex('pengaturan_tema').insert({ id: 1, warna_latar: '#FFFFFF', warna_utama: '#1D4ED8', warna_teks: '#111111', font_pilihan: 'Inter' });
  await knex('pengaturan_situs').insert({ id: 1, nama_situs: 'BPMP', teks_sambutan: 'Selamat datang di Website BPMP' });
  await knex('info_kontak').insert({ id: 1, posel: null, no_telepon: null, alamat: null });
};
exports.down = async function(knex) {
  await knex('info_kontak').where({ id: 1 }).del();
  await knex('pengaturan_situs').where({ id: 1 }).del();
  await knex('pengaturan_tema').where({ id: 1 }).del();
  await knex('peran').whereIn('nama_peran', ['superadmin', 'admin']).del();
};
`
    }
];

migrations.forEach((migration, index) => {
    const ts = formatTime(now, index);
    const fileName = ts + "_" + migration.name + ".js";
    const filePath = path.join(migrationsDir, fileName);
    fs.writeFileSync(filePath, migration.up);
});

console.log('Successfully created all migration files in individual pieces!');
