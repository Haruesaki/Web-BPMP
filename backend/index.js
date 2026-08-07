// Dimuat paling awal: modul ini memuat dotenv sekaligus memvalidasi
// kelengkapan konfigurasi. Di production, konfigurasi yang bolong akan
// menghentikan proses di sini — sebelum satu pun rute sempat didaftarkan.
const env = require('./config/env');
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const apiRoutes = require('./routes/api');

const app = express();

// Di Hostinger, permintaan HTTPS diterima proxy lebih dulu lalu diteruskan ke
// proses Node melalui HTTP internal. Tanpa ini Express mengabaikan header
// X-Forwarded-Proto sehingga `req.protocol` mengembalikan 'http' walau
// pengunjung membuka situs lewat https — dan alamat IP yang terbaca adalah IP
// proxy, bukan IP pengunjung (penting bagi pembatas laju pada Tahap 5).
// Hanya di production: di localhost tidak ada proxy di depan aplikasi, jadi
// memercayai header yang tidak ada justru menyesatkan.
if (env.isProduction) {
    app.set('trust proxy', 1);
}

// ---------------------------------------------------------------- KEAMANAN
// Sumber pihak ketiga yang memang dipakai situs. Bila kelak ada penambahan
// (misal peta atau pemutar video lain), daftarkan di sini juga.
const SUMBER_SKRIP = ["'self'", "'unsafe-inline'", 'https://kit.fontawesome.com', 'https://*.fontawesome.com', 'https://www.instagram.com'];
const SUMBER_GAYA = ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://*.fontawesome.com'];
// `blob:` diperlukan docx-preview: font yang tertanam di dalam berkas .docx
// diekstrak ke Blob lalu didaftarkan sebagai @font-face.
const SUMBER_FONT = ["'self'", 'data:', 'blob:', 'https://fonts.gstatic.com', 'https://*.fontawesome.com'];
// `https://*.google.com` menggantikan `https://www.google.com` DENGAN SENGAJA:
// alamat peta pada footer datang dari basis data (`info_kontak.url_google_map`,
// dapat disunting admin), sehingga host persisnya tidak dapat dipastikan dari
// kode — `maps.google.com` sama sahnya dengan `www.google.com`. Pelebaran ini
// tetap terbatas pada satu pemilik domain, bukan pada `https:` seluruhnya.
const SUMBER_BINGKAI = ["'self'", 'https://www.youtube.com', 'https://www.youtube-nocookie.com', 'https://www.instagram.com', 'https://*.google.com', 'https://player.vimeo.com'];
// Pekerja web. `blob:` BUKAN kelengkapan yang boleh dilewatkan: pustaka
// `browser-image-compression` — yang dipakai setiap kali admin menyisipkan
// gambar lewat CKEditor — membuat pekerjanya dari Blob. Tanpa ini, kompresi
// gambar di panel admin mati begitu CSP ditegakkan, dan hanya di production.
const SUMBER_PEKERJA = ["'self'", 'blob:'];
// Setara dengan imgSrc, dan karena alasan yang sama: konten dapat memuat video
// atau audio yang ditumpangkan dari luar. Tanpa direktif ini, media jatuh ke
// `defaultSrc 'self'` dan seluruh sematan luar terblokir.
const SUMBER_MEDIA = ["'self'", 'data:', 'blob:', 'https:'];
// `blob:` diperlukan pemuat dokumen: pdf.js dan pptx-preview membaca berkas
// yang sudah diambil lewat URL objek.
const SUMBER_SAMBUNGAN = ["'self'", 'https:', 'blob:', 'data:'];

app.use(
    helmet({
        // CSP DITEGAKKAN sejak 7 Agustus 2026 (sebelumnya report-only).
        //
        // RIWAYATNYA, supaya tidak dikembalikan tanpa sebab: kebijakan ini
        // sengaja dipasang sebagai laporan saja lebih dulu, sebab kebijakan yang
        // terlalu ketat mematikan sematan Instagram, YouTube, dan iframe Google
        // Maps TANPA galat apa pun di sisi peladen — gejalanya hanya muncul di
        // konsol peramban pengunjung. Penegakannya baru dilakukan setelah
        // seluruh halaman dijalankan sungguhan dalam mode production di lokal
        // dan dipotret dengan peramban tanpa kepala; pelanggaran yang ditemukan
        // di sana justru tiga yang mustahil ditebak dari membaca kode:
        // pekerja Blob milik `browser-image-compression`, font Blob milik
        // docx-preview, dan alamat peta footer yang datang dari basis data.
        //
        // YANG PERLU DIKETAHUI BILA KELAK ADA SEMATAN BARU: penambahan sumber
        // pihak ketiga (peta lain, pemutar video lain, pustaka dari CDN) kini
        // TIDAK cukup ditulis di komponennya saja — ia harus didaftarkan pada
        // tetapan SUMBER_* di atas, atau peramban akan memblokirnya diam-diam.
        // Bukti pertamanya ada di Log Runtime peladen: setiap pelanggaran
        // dilaporkan ke /api/laporan-csp dan dicetak di sana.
        contentSecurityPolicy: {
            reportOnly: false,
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: SUMBER_SKRIP,
                styleSrc: SUMBER_GAYA,
                fontSrc: SUMBER_FONT,
                // Longgar dengan sengaja: gambar sematan berasal dari CDN pihak
                // ketiga yang namanya berubah-ubah (Instagram, thumbnail YouTube),
                // sehingga mustahil didaftarkan satu per satu.
                imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
                mediaSrc: SUMBER_MEDIA,
                frameSrc: SUMBER_BINGKAI,
                workerSrc: SUMBER_PEKERJA,
                connectSrc: SUMBER_SAMBUNGAN,
                objectSrc: ["'none'"],
                upgradeInsecureRequests: env.isProduction ? [] : null,
                // Titik pelaporan. `report-uri` memang berstatus usang di
                // spesifikasi, tetapi ia yang didukung SELURUH peramban yang
                // dipakai pengunjung; penggantinya (`report-to`) menuntut header
                // tambahan dan belum merata. Tanpa ini, penegakan CSP menjadi
                // buta: yang terblokir hanya terlihat oleh pengunjung yang
                // kebetulan membuka konsol peramban.
                reportUri: ['/api/laporan-csp'],
            },
        },
        // Sematan pihak ketiga memuat sumber lintas asal; kebijakan bawaan helmet
        // di sini terlalu ketat dan akan memutus embed.
        crossOriginEmbedderPolicy: false,
        crossOriginResourcePolicy: { policy: 'cross-origin' },
        // WAJIB DISEBUT EKSPLISIT — jangan dihapus dengan anggapan ini bawaan.
        //
        // Bawaan helmet adalah `Referrer-Policy: no-referrer`, yang membuat peramban
        // TIDAK mengirim header Referer sama sekali. YouTube memvalidasi domain
        // penyemat dari header itu, sehingga tanpa referrer pemutarnya berhenti
        // dengan "Error 153 — Terjadi error pada konfigurasi pemutar video".
        // Sematan lain yang memvalidasi hal serupa (Instagram, iframe Google Maps)
        // menanggung risiko yang sama.
        //
        // Kegagalan ini MUSTAHIL tampak di localhost: di sana halaman disajikan Vite,
        // sedangkan helmet hanya menyentuh balasan Express. Barulah di production,
        // ketika Express menyajikan frontend/dist, headernya ikut terkirim. Jadi
        // "aman di lokal" sama sekali bukan bukti aman di peladen untuk header ini.
        //
        // `strict-origin-when-cross-origin` adalah bawaan peramban modern: lintas asal
        // hanya ASAL yang dikirim (https://bpmplampung.com/), tanpa path maupun query,
        // dan tidak dikirim sama sekali bila turun dari HTTPS ke HTTP.
        referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    })
);

// Memadatkan balasan. Berpengaruh nyata karena bundel frontend berukuran besar.
app.use(compression());

// CORS bersyarat menurut mode.
const opsiCors = {
    origin(origin, callback) {
        // Permintaan tanpa header Origin (peralatan baris perintah, pemeriksa
        // kesehatan, permintaan same-origin) sengaja diizinkan agar pemantauan
        // dan penyajian berkas tidak ikut tertolak.
        if (!origin) return callback(null, true);

        // Development: bebaskan localhost apa pun portanya supaya pengembangan
        // dan pengujian di lokal tidak terhambat.
        if (env.isDevelopment) {
            if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) return callback(null, true);
            return callback(null, true); // di lokal tetap longgar
        }

        // Production: hanya asal yang tercantum pada CORS_ORIGIN.
        if (env.CORS_ORIGIN.includes(origin)) return callback(null, true);
        return callback(new Error('Asal permintaan tidak diizinkan oleh kebijakan CORS.'));
    },
    credentials: true,
};
app.use(cors(opsiCors));

// ------------------------------------------------------------ MUATAN MASUK
// Batas muatan dibuat BERLAPIS. Sebelumnya 50 MB berlaku bagi seluruh aplikasi,
// sehingga titik seperti /api/auth/login pun ikut menerima kiriman sebesar itu —
// pemborosan memori yang mudah disalahgunakan untuk melelahkan peladen.
// Batas longgar kini hanya untuk rute yang memang menyimpan konten kaya
// (`deskripsi_kaya` bertipe longtext yang memuat HTML panjang).
const BATAS_KONTEN_KAYA = '50mb';
const BATAS_UMUM = '1mb';

const JALUR_KONTEN_KAYA = ['/api/halaman-konten', '/api/berita', '/api/profil-pegawai'];
const parserKontenKayaJson = express.json({ limit: BATAS_KONTEN_KAYA });
const parserKontenKayaForm = express.urlencoded({ extended: true, limit: BATAS_KONTEN_KAYA });

app.use((req, res, next) => {
    if (!JALUR_KONTEN_KAYA.some((j) => req.path.startsWith(j))) return next();
    // Dua parser dirangkai; yang kedua otomatis melewati bila yang pertama
    // sudah membaca badan permintaan.
    return parserKontenKayaJson(req, res, (err) => (err ? next(err) : parserKontenKayaForm(req, res, next)));
});

app.use(express.json({ limit: BATAS_UMUM }));
app.use(express.urlencoded({ extended: true, limit: BATAS_UMUM }));

// Sajikan berkas hasil upload (gambar dari editor) sebagai file statis.
// Contoh: /uploads/1720-abc.webp → backend/uploads/1720-abc.webp
// Tembolok aman dipasang karena nama berkas mengandung stempel waktu beserta
// byte acak, sehingga tidak pernah dipakai ulang untuk isi yang berbeda.
app.use(
    '/uploads',
    express.static(env.UPLOAD_DIR, {
        maxAge: env.isProduction ? '30d' : 0,
    })
);

// Routes
app.use('/api', apiRoutes);

// --- KONFIGURASI PRODUCTION UNTUK FRONTEND ---
// Di production (Hostinger), Express akan menyajikan file build React secara statis
if (env.isProduction) {
    // Letak hasil build dicari pada beberapa kandidat, bukan satu jalur tunggal.
    //
    // Alasannya berasal dari kejadian nyata: penataan folder di peladen tidak
    // selalu dapat ditentukan sendiri. Pada Hostinger, isi folder backend
    // ditempatkan LANGSUNG di akar aplikasi, sehingga `../frontend/dist` menunjuk
    // ke luar akar aplikasi — jalur yang benar di lokal justru salah di peladen.
    // Menyandarkan diri pada satu jalur berarti setiap perbedaan penataan menjadi
    // kegagalan penempatan, padahal cukup diselesaikan dengan mencoba dua bentuk
    // yang memang mungkin.
    //
    // Urutannya bermakna: yang paling eksplisit menang.
    const fs = require('fs');
    const kandidatDist = [
        // 1. Ditetapkan langsung oleh pengelola — selalu diutamakan.
        env.FRONTEND_DIST_PATH && path.resolve(env.FRONTEND_DIST_PATH),
        // 2. Di dalam akar aplikasi. Bentuk ini dipakai di Hostinger.
        path.join(__dirname, 'frontend/dist'),
        // 3. Bersebelahan dengan folder backend. Bentuk ini dipakai di lokal.
        path.join(__dirname, '../frontend/dist'),
    ].filter(Boolean);

    const punyaIndex = (dir) => {
        try {
            return fs.existsSync(path.join(dir, 'index.html'));
        } catch (e) {
            return false;
        }
    };

    // Bila tidak satu pun kandidat berisi index.html, kandidat pertama tetap
    // dipakai supaya pesan galat di bawah menyebut jalur yang paling relevan.
    const dirDist = kandidatDist.find(punyaIndex) || kandidatDist[0];

    // Diperiksa saat boot, bukan dibiarkan sampai ada permintaan masuk.
    // Tanpa pemeriksaan ini, folder build yang salah letak hanya tampak sebagai
    // galat pada SETIAP halaman sementara /api tetap sehat — gejala yang
    // menyesatkan dan memakan waktu untuk dilacak. Prosesnya sengaja TIDAK
    // dihentikan: API masih berfungsi penuh, dan menghentikan proses akan
    // menjatuhkan seluruh layanan hanya karena satu folder belum terunggah.
    if (punyaIndex(dirDist)) {
        console.log('[frontend] Hasil build ditemukan pada:', dirDist);
    } else {
        console.error('[frontend] index.html tidak ditemukan. Jalur yang dicoba:');
        kandidatDist.forEach((d) => console.error(`  - ${d}`));
        console.error('[frontend] Seluruh halaman akan gagal tampil, meskipun /api tetap berfungsi.');
        console.error('[frontend] Tempatkan folder dist pada salah satu jalur di atas, atau tetapkan FRONTEND_DIST_PATH.');
    }

    // Aset ber-hash Vite (index-AbC123.js, dst) tidak pernah berubah isi untuk
    // nama yang sama, sehingga aman di-cache setahun penuh (immutable). Namun
    // index.html WAJIB tidak disimpan: ia merujuk nama aset ber-hash terbaru,
    // jadi bila ikut ter-cache lama, pengunjung tetap memuat versi lama setelah
    // deploy baru.
    //
    // `etag` dan `lastModified` DIMATIKAN — jangan dihidupkan kembali tanpa
    // membaca sebabnya. Ini setengah dari perbaikan bug 7 Agustus 2026:
    //
    //   Gejalanya, pengunjung membuka halaman berdokumen dan mendapat tampilan
    //   LAMA; sesudah refresh barulah tampilan baru. Sebabnya bukan pada kode
    //   tampilan sama sekali, melainkan pada VALIDATOR tembolok. Express
    //   menyusun ETag lemah dari ukuran + mtime berkas. Paket penempatan dahulu
    //   menulis stempel waktu nol ke dalam ZIP, sehingga setiap berkas hasil
    //   ekstraksi bertanggal 1980 — sama pada setiap penempatan. Maka ETag
    //   menjadi fungsi UKURAN semata, dan ukuran `index.html` praktis tak
    //   pernah berubah antar-build (yang berganti hanya sidik nama aset, yang
    //   panjangnya selalu sama). Peramban memvalidasi ulang, ETag-nya kebetulan
    //   cocok, peladen menjawab 304, dan pengunjung terus memakai index.html
    //   lama yang menunjuk bundel lama — bundel yang masih tergeletak di
    //   peladen karena ekstraksi ZIP tidak pernah menghapus berkas.
    //
    // Pembangun paket kini menulis stempel waktu yang sebenarnya, sehingga
    // sebab pokoknya sudah hilang. Tetapi bersandar pada itu saja berarti
    // menaruh keselamatan situs pada satu baris di skrip yang DIABAIKAN GIT dan
    // tidak pernah sampai ke rekan tim. Mematikan validator di sini membuat
    // 304 palsu mustahil terjadi, apa pun stempel waktu berkasnya.
    //
    // Aman bagi aset: namanya sudah memuat sidik isi, jadi tidak pernah perlu
    // divalidasi ulang — `immutable` sudah menjamin itu. Yang hilang hanya
    // penghematan pada berkas yang namanya sama tetapi isinya berubah, dan
    // berkas semacam itu memang tidak ada di sini.
    app.use(express.static(dirDist, {
        maxAge: env.isProduction ? '1y' : 0,
        immutable: env.isProduction,
        etag: false,
        lastModified: false,
        setHeaders: (res, filePath) => {
            if (filePath.endsWith('index.html')) {
                // `no-store`, bukan `no-cache`: yang kedua masih membolehkan
                // peramban menyimpan salinan lalu memvalidasinya. Selama salinan
                // itu ada, ia dapat dipakai kembali begitu validasinya berkata
                // "belum berubah" — dan justru di situlah bugnya bersarang.
                res.setHeader('Cache-Control', 'no-store, must-revalidate');
            }
        },
    }));

    // Tangkap semua route yang tidak ada di /api dan serahkan ke React Router.
    //
    // Dipasang sebagai middleware TANPA pola, bukan `app.get('*')`. Sejak
    // Express 5 (path-to-regexp v8) tanda '*' tidak lagi sah sebagai wildcard
    // dan melempar PathError begitu rute didaftarkan — artinya proses mati saat
    // modul ini dimuat, bukan saat permintaan masuk. Middleware tanpa pola tidak
    // bersandar pada tata bahasa path sama sekali, sehingga aman terhadap
    // perubahan tata bahasa pada versi Express berikutnya.
    app.use((req, res, next) => {
        // Permintaan ke /api yang tidak dikenali harus dijawab 404 JSON, jangan
        // dibalas index.html. Bila tertelan, klien menyangka permintaannya
        // berhasil (status 200) padahal endpoint-nya memang tidak ada.
        // Perbandingan sengaja memakai '/api/' agar jalur lain yang kebetulan
        // berawalan sama (misal '/apixyz') tidak ikut terjaring.
        if (req.path === '/api' || req.path.startsWith('/api/')) {
            return res.status(404).json({ pesan: 'Endpoint tidak ditemukan' });
        }

        // Berkas unggahan yang tidak ada pun sebaiknya 404 apa adanya. Kalau
        // dibalas index.html, tag <img> menerima HTML berstatus 200 sehingga
        // gambar tampak rusak tanpa petunjuk penyebabnya saat ditelusuri.
        if (req.path.startsWith('/uploads/')) {
            return res.status(404).json({ pesan: 'Berkas tidak ditemukan' });
        }

        // Hanya permintaan halaman yang wajar dibalas index.html. Metode tulis
        // ke jalur acak tidak boleh menerima HTML.
        if (req.method !== 'GET' && req.method !== 'HEAD') {
            return res.status(404).json({ pesan: 'Halaman tidak ditemukan' });
        }

        // index.html tidak boleh disimpan sama sekali (lihat alasan panjang di
        // express.static di atas). Jalur INI yang melayani seluruh deep-link —
        // /berita/..., /halaman/..., /admin — sehingga justru di sinilah
        // pengunjung paling sering menerima index.html. Melewatkannya berarti
        // memperbaiki setengah masalah.
        res.setHeader('Cache-Control', 'no-store, must-revalidate');
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        // `root` + nama file relatif — BUKAN jalur absolut. Sebabnya: di Hostinger
        // aplikasi berjalan dari dalam `.builds/versions/<id>/nodejs/...`, dan
        // segmen `.builds` diawali titik. Bila jalur absolut dikirim, pustaka
        // `send` (default `dotfiles: 'ignore'`) menganggapnya "dotfile" dan
        // membalas 404 walau index.html jelas ada — sehingga SEMUA deep-link
        // (/admin, /berita/..) gagal. Dengan `root`, cek dotfile hanya berlaku
        // pada bagian relatif ('index.html', bersih); `.builds` di atas root
        // diabaikan — persis cara express.static bekerja.
        // BERKASNYA DIBACA DAN DIKIRIM SENDIRI, tidak lewat `res.sendFile`.
        //
        // Sebabnya bukan selera. `res.sendFile` MENIMPA pilihan etag yang
        // diberikan pemanggilnya — di express/lib/response.js tertulis:
        //
        //     // wire application etag option to send
        //     opts.etag = this.app.enabled('etag');
        //
        // sehingga `{ etag: false }` diabaikan diam-diam, dan balasannya tetap
        // membawa ETag turunan mtime. Itu persis validator yang menyebabkan
        // bug 7 Agustus 2026, dan pintu inilah yang melayani seluruh deep-link.
        // Mematikannya lewat `app.set('etag', false)` memang bisa, tetapi ikut
        // mencabut ETag dari seluruh balasan JSON API — harga yang tidak perlu
        // dibayar untuk memperbaiki satu berkas.
        //
        // Membacanya sendiri sekaligus melenyapkan sebab dipakainya `root`:
        // pemeriksaan "dotfile" milik pustaka `send` yang dahulu membalas 404
        // untuk seluruh deep-link, sebab di Hostinger aplikasi berjalan dari
        // dalam `.builds/versions/<id>/nodejs/...`. `fs` tidak mengenal aturan
        // dotfile sama sekali, jadi persoalan itu tidak dapat terulang.
        //
        // Dibaca pada tiap permintaan, bukan disimpan di memori saat boot:
        // berkasnya hanya ~2,5 KB dan sudah berada di tembolok halaman sistem
        // berkas, sementara salinan memori justru menghidupkan kembali jenis
        // kebasian yang sedang diperbaiki.
        return fs.readFile(path.join(dirDist, 'index.html'), (err, isi) => {
            if (err) return next(err);
            // Badan tidak dikirim untuk HEAD — hanya tajuknya.
            if (req.method === 'HEAD') return res.end();
            return res.end(isi);
        });
    });
}

// ------------------------------------------------------- PENANGAN GALAT
// Dipasang PALING AKHIR, setelah seluruh rute. Express mengenali middleware
// bergalat dari jumlah argumennya yang empat — `next` wajib ditulis walau
// tidak dipakai, jangan dihapus.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    // Penolakan CORS sengaja dibedakan agar terbaca jelas oleh pemanggilnya.
    if (err && /kebijakan CORS/i.test(err.message || '')) {
        return res.status(403).json({ pesan: 'Asal permintaan tidak diizinkan.' });
    }

    // Muatan melampaui batas — beri pesan yang menjelaskan, bukan galat umum.
    if (err && (err.type === 'entity.too.large' || err.status === 413)) {
        return res.status(413).json({ pesan: 'Data yang dikirim terlalu besar.' });
    }

    // Badan JSON yang rusak.
    if (err && err.type === 'entity.parse.failed') {
        return res.status(400).json({ pesan: 'Format data tidak sah.' });
    }

    // Rincian teknis cukup di log peladen. Jejak tumpukan TIDAK PERNAH dikirim
    // ke klien di production karena dapat membocorkan struktur internal.
    console.error('[galat tak tertangani]', req.method, req.originalUrl, '-', err && err.stack ? err.stack : err);

    const status = err && Number.isInteger(err.status) ? err.status : 500;
    return res.status(status).json({ pesan: 'Terjadi kesalahan pada server.' });
});

// Jaring pengaman terakhir. Tanpa ini, satu janji yang gagal tanpa penangkap
// dapat mematikan proses di shared hosting — dan galat aslinya hilang tanpa
// jejak sehingga sangat sukar ditelusuri.
process.on('unhandledRejection', (alasan) => {
    console.error('[unhandledRejection]', alasan instanceof Error ? alasan.stack : alasan);
});

process.on('uncaughtException', (galat) => {
    console.error('[uncaughtException]', galat && galat.stack ? galat.stack : galat);
    // Proses sengaja TIDAK dimatikan seketika: pada shared hosting, mematikan
    // diri membuat situs tidak dapat diakses sampai pengelola proses
    // menghidupkannya kembali. Galatnya dicatat agar dapat ditindaklanjuti.
});

// Ekspor app untuk digunakan di server.js (Pemisahan MVC)
module.exports = app;