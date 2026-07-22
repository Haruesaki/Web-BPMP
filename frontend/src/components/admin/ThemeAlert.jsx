import React from 'react';
import './ThemeAlert.css';

// =========================================================================
//  THEME ALERT — pop-up notifikasi bergaya TEMA admin (ungu + aksen warna).
//  -----------------------------------------------------------------------
//  Pengganti drop-in untuk CustomAlert pada halaman Customize Beranda: props
//  sama persis (isOpen, type, title, message, onConfirm, onCancel, confirmText,
//  cancelText) sehingga cukup ganti nama komponennya.
//
//  Perbedaan: tampilannya menyatu dengan tema (kartu var(--bg-elevated), sudut
//  18px, garis aksen ungu di atas, tombol var(--purple)). Warna ikon & aksen
//  mengikuti tipe:
//    success → hijau  (ungu/hijau)
//    error   → merah  (ungu/merah)
//    warning → kuning, confirm/info → ungu.
//
//  Dirender INLINE (bukan portal) agar variabel tema `--purple`/`--bg-elevated`
//  yang dideklarasikan di scope `.admin-layout` tetap terpakai — sama seperti
//  modal sukses lama yang menyatu dengan tema.
// =========================================================================

const ICONS = {
  success: 'fa-check',
  error: 'fa-xmark',
  warning: 'fa-triangle-exclamation',
  confirm: 'fa-question',
  info: 'fa-circle-info',
};

const DEFAULT_TITLE = {
  success: 'Berhasil',
  error: 'Terjadi Kesalahan',
  warning: 'Peringatan',
  confirm: 'Konfirmasi',
  info: 'Informasi',
};

const ThemeAlert = ({
  isOpen,
  type = 'info',
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Oke',
  cancelText = 'Batal',
}) => {
  if (!isOpen) return null;

  const icon = ICONS[type] || ICONS.info;
  const dismiss = onCancel || onConfirm;

  // Klik latar: untuk konfirmasi jangan menutup (harus pilih tombol) agar tidak
  // memicu aksi tak sengaja; selain itu (sukses/error) boleh menutup.
  const handleOverlay = () => {
    if (type !== 'confirm' && onConfirm) onConfirm();
  };

  return (
    <div className="ta-overlay" data-lenis-prevent="true" onClick={handleOverlay}>
      <div
        className={`ta-modal ta-${type}`}
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="ta-close"
          aria-label="Tutup notifikasi"
          onClick={dismiss}
        >
          <i className="fa-solid fa-xmark" aria-hidden="true" />
        </button>

        <div className={`ta-icon ta-icon-${type}`} aria-hidden="true">
          <i className={`fa-solid ${icon}`} />
        </div>

        <h2 className="ta-title">{title || DEFAULT_TITLE[type] || DEFAULT_TITLE.info}</h2>
        {message && <p className="ta-message">{message}</p>}

        <div className="ta-actions">
          {type === 'confirm' && (
            <button type="button" className="ta-btn ta-btn-cancel" onClick={onCancel}>
              {cancelText}
            </button>
          )}
          <button type="button" className="ta-btn ta-btn-confirm" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThemeAlert;
