import { useSyncExternalStore } from 'react';
import { langgananUnggah, bacaUnggah, tutupUnggah } from '../../../utils/statusUnggah';
import './OverlayUnggah.css';

// =========================================================================
//  OVERLAY KEMAJUAN UNGGAHAN
//  -----------------------------------------------------------------------
//  Menampilkan satu kartu per unggahan yang sedang berjalan, menumpuk di
//  sudut kanan bawah. Sumber datanya `utils/statusUnggah` — lihat di sana
//  alasan penyimpannya berada di luar React.
//
//  MENGAPA BILAH KEMAJUAN, BUKAN SEKADAR PEMUTAR
//  ---------------------------------------------
//  Pemutar berputar hanya menyatakan "sedang sibuk". Ia tidak membedakan
//  unggahan yang berjalan lancar dari yang tersendat, sehingga pengguna tidak
//  tahu apakah perlu menunggu atau mengulang. Persentase nyata dari peristiwa
//  progres XHR menjawab itu.
//
//  Ada satu keadaan yang memang tidak dapat diukur: setelah bita terakhir
//  terkirim, peladen masih memproses gambar dengan `sharp`. Selama itu tidak
//  ada kemajuan yang bisa dilaporkan. Keadaan tersebut ditandai bilah
//  BERGARIS BERGERAK — jujur menyatakan "sedang dikerjakan, lamanya tak
//  diketahui" alih-alih memacetkan angka di 100% yang justru tampak seperti
//  aplikasi menggantung.
//
//  SATU KARTU, TIGA KEADAAN
//  ------------------------
//  Kartu yang sama menampung kemajuan, keberhasilan, dan kegagalan — ia hanya
//  berganti rupa. Sebelumnya keberhasilan diumumkan panel tersendiri di tengah
//  layar: pengguna menonton bilah kemajuan di sudut kanan bawah, lalu pada
//  saat bilah itu selesai perhatiannya dilempar ke seberang layar untuk membaca
//  kabar yang sama, sambil editor tertutup. Menyatukannya membuat mata tidak
//  perlu berpindah, dan tidak ada yang perlu ditutup sendiri: kartunya pergi
//  setelah tujuh detik.
// =========================================================================

const OverlayUnggah = () => {
  const pekerjaan = useSyncExternalStore(langgananUnggah, bacaUnggah, bacaUnggah);

  if (!pekerjaan.length) return null;

  return (
    <div className="ou-tumpukan" role="status" aria-live="polite">
      {pekerjaan.map((p) => {
        const gagal = Boolean(p.galat);
        const selesai = !gagal && Boolean(p.selesai);
        // 100% tetapi BELUM dinyatakan selesai = peladen masih memproses.
        const takTerukur = !gagal && !selesai && p.persen >= 100;

        const kelas = [
          'ou-kartu',
          gagal ? 'ou-kartu--gagal' : '',
          selesai ? 'ou-kartu--selesai' : '',
          p.memudar ? 'ou-kartu--memudar' : '',
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <div key={p.id} className={kelas}>
            <div className="ou-baris-atas">
              <span className="ou-ikon" aria-hidden="true">
                {gagal && <i className="fa-solid fa-triangle-exclamation" />}
                {selesai && <i className="fa-solid fa-check" />}
                {!gagal && !selesai && <i className="fa-solid fa-arrow-up-from-bracket" />}
              </span>

              <div className="ou-teks">
                <span className="ou-judul">{gagal ? 'Unggahan gagal' : p.judul}</span>
                {p.berkas && <span className="ou-berkas" title={p.berkas}>{p.berkas}</span>}
              </div>

              {/* Kartu yang sudah berhenti bergerak boleh ditutup lebih awal.
                  Selama masih berjalan yang tampil justru persentasenya —
                  menutup unggahan yang sedang berlangsung hanya akan
                  menyembunyikan kemajuannya tanpa membatalkan apa pun. */}
              {gagal || selesai ? (
                <button
                  type="button"
                  className="ou-tutup"
                  onClick={() => tutupUnggah(p.id)}
                  aria-label="Tutup pemberitahuan"
                >
                  <i className="fa-solid fa-xmark" />
                </button>
              ) : (
                <span className="ou-persen">{takTerukur ? '' : `${p.persen}%`}</span>
              )}
            </div>

            {!gagal && (
              <div className="ou-rel" aria-hidden="true">
                {/* Bilahnya sengaja TIDAK dihilangkan saat selesai — ia menjadi
                    penuh dan berganti warna. Kartu yang isinya berganti total
                    akan terbaca sebagai pemberitahuan BARU, padahal justru
                    kesinambungannya yang hendak disampaikan. */}
                <div
                  className={`ou-isi${takTerukur ? ' ou-isi--takterukur' : ''}${
                    selesai ? ' ou-isi--selesai' : ''
                  }`}
                  style={takTerukur ? undefined : { width: `${p.persen}%` }}
                />
              </div>
            )}

            <span className={`ou-tahap${gagal ? ' ou-tahap--gagal' : ''}`}>
              {gagal ? p.galat : p.tahap}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default OverlayUnggah;
