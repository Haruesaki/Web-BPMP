import { Plugin, Command, SwitchButtonView } from 'ckeditor5';
import { KELAS_AUTO_POTONG, apakahPotret } from './rasioGambar';

// =========================================================================
//  POTONG OTOMATIS GAMBAR — saklar di bilah alat gambar CKEditor
//  -----------------------------------------------------------------------
//  Sejak aturan tampilan gambar dibenahi, gambar isi konten TIDAK PERNAH
//  dipotong di sisi pengunjung. Untuk gambar lanskap dan kotak itu jelas lebih
//  baik: potongannya dahulu bergantung pada tingkat zoom pembaca, sehingga dua
//  orang melihat gambar yang berbeda (sebabnya diuraikan di utils/rasioGambar).
//
//  Gambar POTRET adalah perkaranya sendiri. Ditampilkan utuh selebar kolom,
//  sebuah foto 577x1280 pada kolom 800px menjadi hampir 1.800 piksel tinggi —
//  pembaca menggulir jauh dan yang terlihat masih gambar yang sama. Karena itu
//  gambar potret dibatasi TINGGINYA (bukan dipotong), dan bila penyunting
//  memang menghendaki gambar yang mengisi lebar kolom, ia dapat menyalakan
//  saklar ini untuk memotongnya menjadi sebuah bidang mendatar.
//
//  Pilihan itu diserahkan kepada penyunting, bukan ditebak program, sebab hanya
//  ia yang tahu apakah bagian atas-bawah gambarnya boleh hilang. Poster dan
//  infografik potret akan rusak bila dipotong; foto suasana tidak.
//
//  BENTUK DATANYA
//  --------------
//  Menyala → kelas `gambar-auto-potong` menempel pada elemen terpetakan gambar:
//  <figure class="image gambar-auto-potong"> untuk gambar blok, dan <img> itu
//  sendiri untuk gambar sebaris. Ini persis cara ImageStyle bawaan CKEditor
//  menyimpan gaya gambarnya, jadi bentuknya tidak asing bagi fitur lain — dan
//  karena hanya berupa kelas, konten lama yang tidak memilikinya tetap terbaca
//  tanpa migrasi apa pun.
// =========================================================================

const NAMA = 'autoPotongGambar';

// Kedua jenis gambar CKEditor ditangani. Gambar sebaris memang jarang dipakai
// di sini, tetapi membiarkannya tanpa dukungan berarti saklar yang tampak aktif
// namun diam-diam tidak tersimpan.
const JENIS_GAMBAR = ['imageBlock', 'imageInline'];

// Elemen terpetakan gambar blok adalah <figure>-nya, bukan <img>. Untuk
// membaca ukuran asli berkas kita tetap perlu <img>-nya sendiri, dan letaknya
// tidak selalu di anak pertama: ImageCaption menambahkan <figcaption>,
// ImageResize menambahkan pegangan pengubah ukuran, dan LinkImage membungkusnya
// dengan <a>. Karena itu dicari menurun, bukan diambil berdasarkan posisi.
const cariImgView = (elemen, kedalaman = 0) => {
  if (!elemen || kedalaman > 3) return null;
  if (elemen.is && elemen.is('element', 'img')) return elemen;
  if (!elemen.getChildren) return null;
  for (const anak of elemen.getChildren()) {
    const ketemu = cariImgView(anak, kedalaman + 1);
    if (ketemu) return ketemu;
  }
  return null;
};

class PerintahAutoPotong extends Command {
  constructor(editor) {
    super(editor);

    // Nilai bantu bagi antarmuka: apakah gambar yang sedang terpilih berasio
    // potret. `null` berarti belum diketahui — lihat apakahPotret().
    this.set('potret', null);

    // Gambar yang sedang ditunggu pemuatannya. refresh() berjalan pada SETIAP
    // perubahan model — termasuk tiap ketukan papan tik — jadi tanpa catatan
    // ini satu gambar yang belum termuat akan menumpuk puluhan pendengar.
    this._ditunggu = new WeakSet();
  }

  refresh() {
    const editor = this.editor;
    const gambar = this._gambarTerpilih();

    if (!gambar) {
      this.isEnabled = false;
      this.value = false;
      this.potret = null;
      return;
    }

    this.value = Boolean(gambar.getAttribute(NAMA));
    this.potret = this._ukurPotret(gambar);

    // Saklar dimatikan hanya bila gambarnya SUDAH DIPASTIKAN bukan potret dan
    // penandanya memang belum menyala. Syarat kedua penting: gambar yang
    // terlanjur ditandai lalu diganti dengan foto lanskap harus tetap bisa
    // dimatikan penandanya — kalau tidak, tandanya terkunci selamanya.
    const bolehDipakai =
      editor.model.schema.checkAttribute(gambar, NAMA) &&
      (this.potret !== false || this.value);

    this.isEnabled = bolehDipakai;
  }

  execute() {
    const gambar = this._gambarTerpilih();
    if (!gambar) return;

    const nyalakan = !gambar.getAttribute(NAMA);

    this.editor.model.change((penulis) => {
      // Dimatikan → atributnya DIBUANG, bukan disetel `false`. Atribut bernilai
      // false tetap akan tersimpan di dokumen dan hanya menambah derau pada
      // data; ketiadaan atribut sudah bermakna "tidak dipotong".
      if (nyalakan) penulis.setAttribute(NAMA, true, gambar);
      else penulis.removeAttribute(NAMA, gambar);
    });
  }

  _gambarTerpilih() {
    const editor = this.editor;
    if (!editor.plugins.has('ImageUtils')) return null;
    return editor.plugins
      .get('ImageUtils')
      .getClosestSelectedImageElement(editor.model.document.selection);
  }

  // Membaca ukuran asli berkas dari elemen <img> di DOM penyuntingan. Ini satu-
  // satunya sumber yang tahu rasio sebenarnya — model CKEditor tidak
  // menyimpannya.
  _ukurPotret(gambar) {
    const penyuntingan = this.editor.editing;
    const elemenView = penyuntingan.mapper.toViewElement(gambar);
    const imgView = cariImgView(elemenView);
    if (!imgView) return null;

    const dom = penyuntingan.view.domConverter.mapViewToDom(imgView);
    if (!dom) return null;

    // Gambar yang belum selesai dimuat belum punya ukuran. Alih-alih menebak,
    // kita menunggu: sekali termuat (atau gagal), perintahnya dihitung ulang
    // sehingga saklarnya menyesuaikan diri tanpa perlu diklik ulang.
    //
    // `once: true` menjaga agar pendengar ini tidak menumpuk. Gambar yang
    // berkasnya rusak tidak akan pernah `complete`, dan itu ditangani sendiri
    // oleh nilai `null` — saklarnya dibiarkan hidup, sebab kita tidak berhak
    // memastikan gambar itu bukan potret.
    if (!dom.complete) {
      if (!this._ditunggu.has(dom)) {
        this._ditunggu.add(dom);
        const hitungUlang = () => {
          this._ditunggu.delete(dom);
          this.refresh();
        };
        dom.addEventListener('load', hitungUlang, { once: true });
        dom.addEventListener('error', hitungUlang, { once: true });
      }
      return null;
    }

    return apakahPotret(dom.naturalWidth, dom.naturalHeight);
  }
}

export class AutoPotongGambarPlugin extends Plugin {
  static get pluginName() {
    return 'AutoPotongGambar';
  }

  // Ketiganya WAJIB disebut. Tanpa itu urutan jalannya plugin tidak terjamin,
  // dan `schema.extend` di bawah dapat berjalan sebelum jenis gambarnya
  // terdaftar — yang berakhir dengan galat, atau lebih buruk lagi, dilewati
  // diam-diam sehingga atributnya tidak pernah tersimpan.
  static get requires() {
    return ['ImageUtils', 'ImageBlockEditing', 'ImageInlineEditing'];
  }

  // Seluruh pemasangan dikerjakan di init(), bukan afterInit().
  //
  // Sebabnya bilah alat gambar: ImageToolbar merakit isinya pada afterInit()
  // miliknya dengan membaca componentFactory. Karena CKEditor menjalankan
  // SELURUH init() lebih dahulu, barulah seluruh afterInit(), pendaftaran di
  // sini pasti sudah terlihat olehnya. Bila dipindah ke afterInit(), urutannya
  // bergantung pada posisi plugin di daftar — dan plugin tambahan berada di
  // belakang, jadi tombolnya akan hilang tanpa pesan galat.
  init() {
    const editor = this.editor;
    const schema = editor.model.schema;

    for (const jenis of JENIS_GAMBAR) {
      if (schema.isRegistered(jenis)) {
        schema.extend(jenis, { allowAttributes: NAMA });
      }
    }

    this._pasangDowncast();
    this._pasangUpcast();

    editor.commands.add(NAMA, new PerintahAutoPotong(editor));
    this._pasangTombol();
  }

  // Model → tampilan. Kelasnya menempel pada elemen terpetakan (figure untuk
  // gambar blok, img untuk gambar sebaris) baik pada keluaran data maupun pada
  // tampilan penyuntingan — yang terakhir dipakai CSS editor untuk memberi
  // penanda visual agar penyunting melihat saklarnya berpengaruh.
  _pasangDowncast() {
    this.editor.conversion.for('downcast').add((dispatcher) => {
      for (const jenis of JENIS_GAMBAR) {
        dispatcher.on(`attribute:${NAMA}:${jenis}`, (evt, data, conversionApi) => {
          if (!conversionApi.consumable.consume(data.item, evt.name)) return;

          const elemen = conversionApi.mapper.toViewElement(data.item);
          if (!elemen) return;

          if (data.attributeNewValue) {
            conversionApi.writer.addClass(KELAS_AUTO_POTONG, elemen);
          } else {
            conversionApi.writer.removeClass(KELAS_AUTO_POTONG, elemen);
          }
        });
      }
    });
  }

  // Tampilan → model. Dipasang pada prioritas 'low' supaya berjalan SESUDAH
  // pengubah gambar bawaan; barulah `data.modelRange` terisi elemen model yang
  // baru dibuat. Ini pola yang sama dengan ImageStyle bawaan CKEditor.
  _pasangUpcast() {
    this.editor.conversion.for('upcast').add((dispatcher) => {
      const baca = (evt, data, conversionApi) => {
        if (!data.modelRange) return;

        const simpul = data.viewItem;
        if (!simpul || !simpul.hasClass || !simpul.hasClass(KELAS_AUTO_POTONG)) return;

        for (const item of data.modelRange.getItems()) {
          if (conversionApi.schema.checkAttribute(item, NAMA)) {
            conversionApi.writer.setAttribute(NAMA, true, item);
            break;
          }
        }
      };

      dispatcher.on('element:figure', baca, { priority: 'low' });
      dispatcher.on('element:img', baca, { priority: 'low' });
    });
  }

  // SwitchButtonView dipilih alih-alih tombol biasa karena inilah bentuk
  // "kotak centang" milik CKEditor: keadaan menyala/mati terbaca langsung dari
  // bentuknya, tanpa penyunting harus menebak arti sebuah tombol yang tampak
  // tertekan.
  _pasangTombol() {
    const editor = this.editor;

    editor.ui.componentFactory.add(NAMA, (locale) => {
      const perintah = editor.commands.get(NAMA);
      const tampilan = new SwitchButtonView(locale);

      tampilan.set({
        label: 'Potong otomatis',
        withText: true,
        class: 'bpmp-saklar-potong',
      });

      tampilan.bind('isOn').to(perintah, 'value');
      tampilan.bind('isEnabled').to(perintah, 'isEnabled');

      // Keterangannya berubah mengikuti keadaan supaya saklar yang mati tidak
      // terlihat seperti kerusakan.
      tampilan.bind('tooltip').to(perintah, 'potret', (potret) =>
        potret === false
          ? 'Hanya berlaku untuk gambar berasio potret'
          : 'Potong gambar potret menjadi bidang mendatar selebar kolom'
      );

      tampilan.on('execute', () => {
        editor.execute(NAMA);
        editor.editing.view.focus();
      });

      return tampilan;
    });
  }
}

export default AutoPotongGambarPlugin;
