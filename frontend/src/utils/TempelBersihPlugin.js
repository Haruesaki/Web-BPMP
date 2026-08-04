import { Plugin, UpcastWriter, ClipboardPipeline } from 'ckeditor5';
import { bersihkanPohon } from './tempelBersih';

// =========================================================================
//  PLUGIN TEMPEL BERSIH
//  -----------------------------------------------------------------------
//  Menyambung ke `ClipboardPipeline#inputTransformation`, yakni tahap ketika
//  isi papan klip sudah diurai menjadi pohon view TETAPI belum dimasukkan ke
//  dokumen. Di titik itulah format bawaan sumber tempelan dibuang.
//
//  Prioritas `high` dipakai supaya pembersihan berjalan SEBELUM pendengar
//  bawaan lain sempat mengolah isinya.
//
//  Alasan lengkap mengapa penyaringan dilakukan di sini — dan bukan dengan
//  mencabut wildcard General Html Support — ada di `tempelBersih.js`.
//  Ringkasnya: mencabut GHS juga akan membuang format konten LAMA saat dibuka
//  lalu disimpan ulang, dan itu kehilangan data yang senyap.
// =========================================================================
export class TempelBersih extends Plugin {
  static get pluginName() {
    return 'TempelBersih';
  }

  // Kelasnya dirujuk langsung, bukan lewat nama berupa untai: bila kelak
  // ClipboardPipeline luput dimuat, kegagalannya muncul saat editor dibangun
  // dengan pesan yang jelas, bukan diam-diam tidak berfungsi saat menempel.
  static get requires() {
    return [ClipboardPipeline];
  }

  init() {
    const editor = this.editor;
    const clipboard = editor.plugins.get(ClipboardPipeline);

    clipboard.on(
      'inputTransformation',
      (evt, data) => {
        if (!data || !data.content) return;

        // Tempel-sebagai-teks-polos (Ctrl+Shift+V) sudah polos sejak awal,
        // jadi tidak perlu diolah lagi.
        if (data.method === 'paste' || data.method === 'drop') {
          const writer = new UpcastWriter(editor.editing.view.document);
          bersihkanPohon(data.content, writer);
        }
      },
      { priority: 'high' }
    );
  }
}

export default TempelBersih;
