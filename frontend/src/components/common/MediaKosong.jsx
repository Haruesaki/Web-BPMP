import './MediaKosong.css';

/**
 * Slot media kosong — pengganti gambar fallback statis.
 *
 * Dipakai saat sebuah gambar (foto profil, thumbnail berita, avatar sosial, dll)
 * belum tersedia. Alih-alih menampilkan gambar bawaan yang di-hardcode, kita
 * tampilkan wadah kosong yang rapi; isinya akan diatur lewat CMS nanti.
 *
 * - `fill`  : isi penuh container induk (untuk slot berbasis wadah: profil, berita).
 * - `className` : untuk mewarisi ukuran/bentuk elemen aslinya (mis. `ig-avatar`, `yt-icon`).
 * - `label` : teks aksesibilitas (dibaca pembaca layar).
 */
const MediaKosong = ({ className = '', fill = false, label = 'Konten belum tersedia' }) => (
    <div
        className={['media-kosong', fill && 'media-kosong--isi', className].filter(Boolean).join(' ')}
        role="img"
        aria-label={label}
    >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <circle cx="8.5" cy="8.5" r="1.6" />
            <path d="M21 15l-4.5-4.5L5 21" />
        </svg>
    </div>
);

export default MediaKosong;
