import { ButtonView } from 'ckeditor5';
import axiosInstance from '../api/axiosInstance';
import { mulaiUnggah, majukanUnggah, selesaikanUnggah, gagalkanUnggah } from './statusUnggah';

// Ikon dokumen sederhana (SVG inline) untuk tombol toolbar.
const DOC_ICON =
  '<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M5 1.5h6L15.5 6v11.5A1 1 0 0 1 14.5 18h-9A1 1 0 0 1 4.5 17V2.5A1 1 0 0 1 5 1.5Zm5.5 1.2V6h3.3L10.5 2.7ZM7 9h6v1.2H7V9Zm0 3h6v1.2H7V12Z"/></svg>';

const ACCEPT =
  '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.odt,.ods,.odp,.rtf,.txt,.csv';

// Plugin CKEditor: menambah tombol "Sisipkan Dokumen" ke toolbar. Saat diklik,
// membuka pemilih berkas, mengunggah ke `endpoint`, lalu menyisipkan TAUTAN
// (teks = nama file, href = URL) ke posisi kursor. Sisi pengunjung yang
// mengubah tautan berekstensi dokumen menjadi preview.
//
// KEMAJUAN UNGGAHAN
// -----------------
// Dokumen lazimnya jauh lebih besar daripada gambar — berkas PDF puluhan
// megabita bukan hal aneh. Sebelumnya penyisipan ini berjalan tanpa isyarat apa
// pun: tombol diklik, lalu tidak terjadi apa-apa sampai tautannya tiba-tiba
// muncul. Pada berkas besar jeda itu terasa seperti tombol yang tidak berfungsi,
// dan pengguna cenderung mengkliknya berulang kali sehingga berkas yang sama
// terunggah beberapa kali.
//
// Kemajuannya kini dilaporkan ke `utils/statusUnggah`, yang ditampilkan
// `OverlayUnggah`. Pemberitahuan galat juga dipindahkan ke sana — `window.alert`
// menghentikan seluruh halaman dan memaksa pengguna menekan OK sebelum dapat
// berbuat apa pun. Sejak 7 Agustus 2026 pemberitahuan BERHASIL ikut ke sana,
// menggantikan panel pratinjau yang dahulu terbuka di tengah layar.
export function InsertDocumentPlugin(endpoint = '/api/upload/dokumen') {
  return function (editor) {
    editor.ui.componentFactory.add('insertDocument', (locale) => {
      const view = new ButtonView(locale);
      view.set({
        label: 'Sisipkan Dokumen',
        icon: DOC_ICON,
        tooltip: true,
      });

      view.on('execute', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = ACCEPT;

        input.onchange = async () => {
          const file = input.files && input.files[0];
          if (!file) return;

          const id = mulaiUnggah({
            judul: 'Mengunggah dokumen',
            berkas: file.name,
            tahap: 'Menyiapkan berkas…',
          });

          try {
            const formData = new FormData();
            formData.append('upload', file);

            const res = await axiosInstance.post(endpoint, formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
              onUploadProgress: (evt) => {
                // `evt.total` bisa tidak terisi bila peramban tidak mengetahui
                // panjang muatan. Dalam keadaan itu persentase tidak dapat
                // dihitung, dan bilahnya dibiarkan pada mode tak terukur.
                if (!evt.total) {
                  majukanUnggah(id, 100, 'Mengunggah…');
                  return;
                }
                const bagian = evt.loaded / evt.total;
                majukanUnggah(
                  id,
                  bagian * 100,
                  bagian >= 1 ? 'Diproses peladen…' : 'Mengunggah ke peladen…'
                );
              },
            });

            const url = res.data?.url;
            const name = res.data?.name || file.name;

            if (!url) {
              gagalkanUnggah(id, 'Peladen tidak mengembalikan URL dokumen.');
              return;
            }

            editor.model.change((writer) => {
              const linkText = writer.createText(name, { linkHref: url });
              editor.model.insertContent(linkText, editor.model.document.selection);
            });

            // Pemberitahuan berhasil menempati KARTU YANG SAMA dengan bilah
            // kemajuannya, bukan panel tersendiri di tengah layar.
            //
            // Sebelumnya di sini terbuka panel pratinjau: dokumennya ditarik
            // ulang dari peladen lalu ditampilkan sebagai pembuktian bahwa
            // unggahannya utuh. Maksudnya benar, tetapi ongkosnya tidak
            // sebanding — panel itu menutupi editor tepat pada saat penyunting
            // hendak melanjutkan mengetik, dan menuntut ditutup sendiri untuk
            // sesuatu yang sebenarnya sudah berhasil. Pembuktian keutuhan
            // berkas tetap dapat dilakukan lewat tautan yang tersisip, kapan
            // pun penyunting memang memerlukannya.
            selesaikanUnggah(id, {
              judul: 'Dokumen berhasil diunggah',
              tahap: 'Tautan sudah disisipkan di posisi kursor.',
            });
          } catch (err) {
            console.error('Gagal mengunggah dokumen:', err);
            gagalkanUnggah(
              id,
              err?.response?.data?.error?.message || 'Gagal mengunggah dokumen.'
            );
          }
        };

        input.click();
      });

      return view;
    });
  };
}
