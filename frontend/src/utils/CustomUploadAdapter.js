import imageCompression from 'browser-image-compression';
import { mulaiUnggah, majukanUnggah, sudahiUnggah, gagalkanUnggah } from './statusUnggah';

// =========================================================================
//  ADAPTER UNGGAH GAMBAR UNTUK CKEditor
//  -----------------------------------------------------------------------
//  Menyisipkan gambar melewati dua tahap yang lamanya sangat berbeda, dan
//  keduanya perlu terlihat terpisah:
//
//    1. KOMPRESI di peramban — hanya bila berkas melebihi 2 MB. Dikerjakan
//       di Web Worker, tetapi pada foto besar tetap memakan beberapa detik.
//       Sebelum ini, tahap tersebut hanya ditandai satu baris teks tanpa
//       kemajuan, sehingga tidak dapat dibedakan dari aplikasi yang macet.
//
//    2. UNGGAH ke peladen — kemajuannya terukur dari peristiwa progres XHR.
//
//  Keduanya dipetakan ke satu bilah 0–100% supaya pengguna melihat satu
//  perjalanan, bukan dua bilah yang masing-masing mulai dari nol. Pembagian
//  porsinya di bawah.
//
//  Kemajuan tetap dilaporkan ke `loader` bawaan CKEditor — itulah yang
//  menggerakkan bilah tipis pada gambar sisipan di dalam editor. Overlay ini
//  melengkapinya, bukan menggantikan: bilah bawaan CKEditor mudah luput dari
//  perhatian, terlebih ketika halaman sedang digulir ke bagian lain.
// =========================================================================

// Porsi tahap kompresi pada bilah gabungan. Sengaja tidak setengah-setengah:
// kompresi lazimnya lebih cepat daripada unggah pada koneksi biasa, sehingga
// porsi yang terlalu besar membuat bilah tampak melompat.
const PORSI_KOMPRESI = 35;

const MAKS_MB = 2;
const MAKS_BITA = MAKS_MB * 1024 * 1024;

export default class CustomUploadAdapter {
    constructor(loader, uploadUrl, authHeader, setCompressMsg) {
        this.loader = loader;
        this.uploadUrl = uploadUrl;
        this.authHeader = authHeader;
        // Dipertahankan demi pemanggil lama; overlay kini menjadi saluran utama.
        this.setCompressMsg = setCompressMsg;
        this.idTugas = null;
    }

    // Sengaja TIDAK memakai `new Promise(async ...)`. Pada bentuk itu, galat yang
    // dilempar sebelum `reject` sempat dipanggil tidak tertangkap siapa pun:
    // janjinya menggantung selamanya, dan CKEditor menunggu unggahan yang tak
    // akan pernah selesai. Di sini bagian asinkronnya berada di fungsi async
    // biasa — galatnya menolak janji dengan sendirinya — sementara `new Promise`
    // hanya membungkus XHR yang memang berbasis callback.
    async upload() {
        const file = await this.loader.file;

        this.idTugas = mulaiUnggah({
            judul: 'Mengunggah gambar',
            berkas: file.name,
            tahap: 'Menyiapkan berkas…',
        });

        const perluKompresi = file.size > MAKS_BITA;
        let berkasKirim = file;

        if (perluKompresi) {
            majukanUnggah(
                this.idTugas,
                0,
                `Mengompres gambar (${(file.size / 1024 / 1024).toFixed(1)} MB)…`
            );
            try {
                berkasKirim = await imageCompression(file, {
                    maxSizeMB: MAKS_MB,
                    // Disamakan dengan batas lebar di backend supaya gambar tidak
                    // dikecilkan dua kali dan menjadi pecah.
                    maxWidthOrHeight: 1600,
                    useWebWorker: true,
                    initialQuality: 0.8,
                    onProgress: (p) => majukanUnggah(this.idTugas, (p / 100) * PORSI_KOMPRESI),
                });
            } catch (error) {
                console.error('Gagal mengompres gambar:', error);
                gagalkanUnggah(this.idTugas, 'Gagal mengompres gambar.');
                if (this.setCompressMsg) this.setCompressMsg('');
                // `cause` dipertahankan supaya galat aslinya dari pustaka
                // kompresi tidak hilang saat ditelusuri di konsol.
                throw new Error('Gagal mengompres gambar.', { cause: error });
            }
        }

        if (this.setCompressMsg) this.setCompressMsg('');

        return new Promise((resolve, reject) => {
            this._kirim(berkasKirim, perluKompresi, resolve, reject);
        });
    }

    abort() {
        if (this.xhr) this.xhr.abort();
        if (this.idTugas) sudahiUnggah(this.idTugas);
        if (this.setCompressMsg) this.setCompressMsg('');
    }

    _kirim(file, adaKompresi, resolve, reject) {
        const dasar = adaKompresi ? PORSI_KOMPRESI : 0;
        const rentang = 100 - dasar;

        const xhr = (this.xhr = new XMLHttpRequest());
        xhr.open('POST', this.uploadUrl, true);
        if (this.authHeader) xhr.setRequestHeader('Authorization', this.authHeader);
        xhr.responseType = 'json';

        majukanUnggah(this.idTugas, dasar, 'Mengunggah ke peladen…');

        xhr.addEventListener('error', () => {
            gagalkanUnggah(this.idTugas, 'Gagal menghubungi peladen.');
            reject('Gagal menghubungi peladen.');
        });

        xhr.addEventListener('abort', () => {
            sudahiUnggah(this.idTugas);
            reject();
        });

        xhr.addEventListener('load', () => {
            const balasan = xhr.response;
            if (!balasan || balasan.error) {
                const pesan = (balasan && balasan.error && balasan.error.message) || 'Gagal mengunggah berkas.';
                gagalkanUnggah(this.idTugas, pesan);
                return reject(pesan);
            }
            sudahiUnggah(this.idTugas);
            // CKEditor menuntut bentuk { default: '<url>' }; backend mengembalikan { url }.
            resolve({ default: balasan.url });
        });

        if (xhr.upload) {
            xhr.upload.addEventListener('progress', (evt) => {
                if (!evt.lengthComputable) return;

                // Tetap disuapkan ke loader CKEditor — inilah yang menggerakkan
                // bilah tipis pada gambar sisipan di dalam editor.
                this.loader.uploadTotal = evt.total;
                this.loader.uploaded = evt.loaded;

                const bagian = evt.loaded / evt.total;
                majukanUnggah(
                    this.idTugas,
                    dasar + bagian * rentang,
                    // Bita terakhir terkirim bukan berarti selesai: peladen masih
                    // mengubah ukuran dan memampatkan gambar dengan `sharp`. Tahap
                    // itu tidak dapat diukur dari sisi peramban, jadi dinyatakan
                    // apa adanya alih-alih membiarkan angka mandek di 100%.
                    bagian >= 1 ? 'Diproses peladen…' : 'Mengunggah ke peladen…'
                );
            });
        }

        const data = new FormData();
        data.append('upload', file);
        xhr.send(data);
    }
}

export function CustomUploadAdapterPlugin(uploadUrl, authHeader, setCompressMsg) {
    return function (editor) {
        editor.plugins.get('FileRepository').createUploadAdapter = (loader) =>
            new CustomUploadAdapter(loader, uploadUrl, authHeader, setCompressMsg);
    };
}
