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
// =========================================================================

const OverlayUnggah = () => {
  const pekerjaan = useSyncExternalStore(langgananUnggah, bacaUnggah, bacaUnggah);

  if (!pekerjaan.length) return null;

  return (
    <div className="ou-tumpukan" role="status" aria-live="polite">
      {pekerjaan.map((p) => {
        const gagal = Boolean(p.galat);
        // 100% tetapi belum disudahi = peladen sedang memproses.
        const takTerukur = !gagal && p.persen >= 100;

        return (
          <div key={p.id} className={`ou-kartu${gagal ? ' ou-kartu--gagal' : ''}`}>
            <div className="ou-baris-atas">
              <span className="ou-ikon" aria-hidden="true">
                {gagal ? (
                  <i className="fa-solid fa-triangle-exclamation" />
                ) : (
                  <i className="fa-solid fa-arrow-up-from-bracket" />
                )}
              </span>

              <div className="ou-teks">
                <span className="ou-judul">{gagal ? 'Unggahan gagal' : p.judul}</span>
                {p.berkas && <span className="ou-berkas" title={p.berkas}>{p.berkas}</span>}
              </div>

              {gagal ? (
                <button
                  type="button"
                  className="ou-tutup"
                  onClick={() => tutupUnggah(p.id)}
                  aria-label="Tutup"
                >
                  <i className="fa-solid fa-xmark" />
                </button>
              ) : (
                <span className="ou-persen">{takTerukur ? '' : `${p.persen}%`}</span>
              )}
            </div>

            {!gagal && (
              <div className="ou-rel" aria-hidden="true">
                <div
                  className={`ou-isi${takTerukur ? ' ou-isi--takterukur' : ''}`}
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
