// =========================================================================
//  SESI ADMIN — satu-satunya sumber kebenaran penyimpanan sesi login CMS
//  -----------------------------------------------------------------------
//  MENGAPA BERKAS INI ADA
//
//  Sebelumnya sesi disimpan di `sessionStorage`. Menurut spesifikasi HTML,
//  sessionStorage terikat pada SATU tab: setiap tab baru memulai penyimpanan
//  yang kosong sama sekali. Itulah sebab pasti mengapa membuka tab baru lalu
//  mengetik alamat /admin selalu meminta login ulang, walaupun peramban dan
//  akun penggunanya sama persis. Bukan kesalahan token, dan bukan pula
//  kesalahan peladen — tokennya memang tidak pernah ada di tab yang baru.
//
//  `localStorage` terikat pada ASAL (origin) di dalam profil peramban, bukan
//  pada tab. Satu profil peramban — yakni satu akun yang dipakai masuk ke
//  peramban itu — berbagi penyimpanan yang sama di seluruh tab dan jendela,
//  dan isinya bertahan setelah peramban ditutup. Persis perilaku yang diminta.
//
//  CATATAN PENTING soal istilah "SSO": ini BUKAN Google OAuth. Yang dipakai
//  adalah kegigihan (persistence) per-profil peramban. Efeknya sama seperti
//  yang diminta — satu kali login berlaku untuk seluruh tab pada peramban itu
//  selama 7 hari — tetapi identitasnya tetap berasal dari email/kata sandi
//  CMS, bukan dari akun Google. Login Google yang sebenarnya menuntut kredensial
//  Google Cloud, layar persetujuan, dan pemetaan akun Google ke tabel pengguna;
//  itu pekerjaan tersendiri, bukan sekadar perubahan tempat penyimpanan.
//
//  MASA BERLAKU
//  Batas waktu yang sesungguhnya dipegang oleh JWT di sisi peladen. Berkas ini
//  membaca klaim `exp` LANGSUNG dari token, sehingga masa berlaku di peramban
//  tidak akan pernah berbeda dari yang diakui peladen — walau kelak durasinya
//  diubah di backend. Pemeriksaan di sini hanya kenyamanan: mengarahkan ke
//  halaman login sebelum pengguna sempat menekan tombol yang pasti ditolak.
//  Penjaga yang sebenarnya tetap `authMiddleware` di peladen.
// =========================================================================

const KUNCI = 'adminSession';

// Cadangan di memori. localStorage dapat melempar galat saat kuota penuh, saat
// mode penyamaran menutup aksesnya, atau saat pengguna memblokir kuki situs.
// Tanpa cadangan ini, satu galat penyimpanan membuat seluruh panel admin tidak
// dapat dipakai sama sekali — dengan cadangan, sesi tetap jalan sampai tab
// ditutup.
let cadanganMemori = null;

const gudang = () => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    // Sekadar menyentuh objeknya belum tentu melempar; uji tulis singkat.
    const uji = '__uji_sesi__';
    window.localStorage.setItem(uji, '1');
    window.localStorage.removeItem(uji);
    return window.localStorage;
  } catch {
    return null;
  }
};

// Mengambil klaim `exp` (detik epoch) dari JWT tanpa pustaka tambahan.
// Muatan JWT memakai base64url. Karakter multibita UTF-8 pada nama pengguna
// tetap aman diurai: seluruh bita UTF-8 lanjutan bernilai >= 0x80, sehingga
// tidak pernah menghasilkan tanda kutip, garis miring terbalik, ataupun
// karakter kendali yang dapat merusak struktur JSON.
const kedaluwarsaToken = (token) => {
  try {
    const bagian = String(token).split('.');
    if (bagian.length !== 3) return null;
    const b64 = bagian[1].replace(/-/g, '+').replace(/_/g, '/');
    const rata = b64.padEnd(Math.ceil(b64.length / 4) * 4, '=');
    const muatan = JSON.parse(window.atob(rata));
    return typeof muatan.exp === 'number' ? muatan.exp * 1000 : null;
  } catch {
    return null;
  }
};

const tulisMentah = (nilai) => {
  cadanganMemori = nilai;
  const g = gudang();
  if (!g) return;
  try {
    if (nilai === null) g.removeItem(KUNCI);
    else g.setItem(KUNCI, nilai);
  } catch {
    /* penyimpanan penuh atau diblokir — cadangan memori tetap dipakai */
  }
};

const bacaMentah = () => {
  const g = gudang();
  if (g) {
    try {
      const nilai = g.getItem(KUNCI);
      if (nilai) return nilai;
    } catch {
      /* jatuh ke cadangan memori */
    }
  }
  return cadanganMemori;
};

// Pemindahan sekali jalan dari penyimpanan lama. Tanpa ini, setiap admin yang
// sedang login pada saat pembaruan dipasang akan terlempar ke halaman login
// tanpa sebab yang terlihat olehnya.
const pindahkanSesiLama = () => {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) return;
    const lama = window.sessionStorage.getItem(KUNCI);
    if (!lama) return;
    window.sessionStorage.removeItem(KUNCI);
    if (!bacaMentah()) tulisMentah(lama);
  } catch {
    /* sessionStorage diblokir — tidak ada yang perlu dipindahkan */
  }
};

/** Menyimpan sesi. Dipanggil sesudah login dan sesudah ubah kata sandi. */
export const simpanSesi = (data) => {
  const batas = kedaluwarsaToken(data?.token);
  tulisMentah(JSON.stringify(batas ? { ...data, kedaluwarsa: batas } : data));
};

/** Menghapus sesi di profil peramban ini. */
export const hapusSesi = () => {
  tulisMentah(null);
  try {
    window.sessionStorage?.removeItem(KUNCI);
  } catch {
    /* diabaikan */
  }
};

/**
 * Membaca sesi, atau null bila tidak ada / rusak / sudah lewat masa berlaku.
 * Sesi yang kedaluwarsa langsung dibuang supaya tidak ada token mati yang
 * tertinggal di peramban.
 */
export const bacaSesi = () => {
  pindahkanSesiLama();
  const mentah = bacaMentah();
  if (!mentah) return null;

  let sesi;
  try {
    sesi = JSON.parse(mentah);
  } catch {
    hapusSesi();
    return null;
  }
  if (!sesi || typeof sesi !== 'object' || !sesi.token) {
    hapusSesi();
    return null;
  }

  // `exp` di dalam token selalu didahulukan; nilai tersimpan hanya cadangan
  // untuk token yang — karena satu dan lain hal — tidak dapat diurai.
  const batas = kedaluwarsaToken(sesi.token) ?? sesi.kedaluwarsa ?? null;
  if (batas && Date.now() >= batas) {
    hapusSesi();
    return null;
  }
  return sesi;
};

/** Token siap pakai untuk header Authorization, atau null. */
export const ambilToken = () => bacaSesi()?.token || null;

/** Header Authorization yang sudah jadi; objek kosong bila tak ada sesi. */
export const headerOtorisasi = () => {
  const token = ambilToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/** Sisa masa berlaku dalam milidetik (0 bila habis / tak diketahui). */
export const sisaMasaBerlaku = () => {
  const sesi = bacaSesi();
  if (!sesi) return 0;
  const batas = kedaluwarsaToken(sesi.token) ?? sesi.kedaluwarsa ?? null;
  return batas ? Math.max(0, batas - Date.now()) : 0;
};

/**
 * Memantau perubahan sesi dari TAB LAIN pada profil peramban yang sama.
 * Peristiwa `storage` hanya menyala di tab selain yang mengubah, sehingga
 * keluar di satu tab akan mengeluarkan tab lainnya juga — tanpa ini, tab yang
 * sudah "keluar" masih menampilkan panel admin sampai dimuat ulang.
 * Mengembalikan fungsi pembatal langganan.
 */
export const pantauSesi = (saatBerubah) => {
  if (typeof window === 'undefined') return () => {};
  const tangani = (e) => {
    if (e.key !== null && e.key !== KUNCI) return;
    saatBerubah(bacaSesi());
  };
  window.addEventListener('storage', tangani);
  return () => window.removeEventListener('storage', tangani);
};
