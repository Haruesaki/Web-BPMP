import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../../../api/axiosInstance';
import { bacaSesi } from '../../../../utils/sesiAdmin';
import { jAdmin } from '../../../../config/jalurAdmin';
import CardContent from '../../../user/content-types/CardProfile/CardContent';
import useSeretUrutan from '../../../../hooks/useSeretUrutan';
import './PreviewProfilCard.css';

// Lama tahan sebelum kartu boleh diseret. 280ms dipilih sebagai jalan tengah:
// cukup panjang agar klik biasa — yang lazimnya di bawah 150ms — tidak pernah
// tertukar menjadi seretan, tetapi belum terasa seperti menunggu.
const TAHAN_MS = 280;

const PreviewProfilCard = () => {
    const { menuId } = useParams();
    const navigate = useNavigate();
    const [profiles, setProfiles] = useState([]);
    const [menuName, setMenuName] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            if (!menuId) {
                setLoading(false);
                setError('Menu ID tidak ditemukan.');
                return;
            }
            try {
                setLoading(true);
                setError('');

                const session = bacaSesi();
                const token = session?.token;

                const menuRes = await axiosInstance.get('/api/menus');
                const currentMenu = menuRes.data.find(m => String(m.id) === menuId);
                if (currentMenu) {
                    setMenuName(currentMenu.nama_menu);
                } else {
                    throw new Error('Menu tidak ditemukan.');
                }

                const contentRes = await axiosInstance.get(`/api/profil-pegawai/${menuId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setProfiles(contentRes.data || []);

            } catch (err) {
                console.error('Gagal memuat data profil:', err);
                setError(err.response?.data?.pesan || 'Gagal memuat data profil.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [menuId]);

    const handleAddProfile = () => {
        navigate(jAdmin(`kelola-profil/tambah/${menuId}`));
    };

    // --- PENGURUTAN: KLIK vs TAHAN ---
    // Kartu ini mengemban dua perintah pada gerakan yang awalnya sama persis.
    // Pembedanya waktu: lepas cepat = "buka editor", tahan = "angkat kartu".
    // Hook-nya juga menahan `click` yang menyusul sesudah seretan — tanpa itu,
    // setiap kali selesai menyusun ulang, halaman akan berpindah ke editor
    // kartu yang barusan dijatuhkan.
    const simpanUrutan = async (daftarBaru) => {
        const sebelumnya = profiles;
        setError('');
        setProfiles(daftarBaru);

        try {
            // Endpoint pengurutan tersendiri, BUKAN penyimpanan profil biasa.
            // Penyimpanan biasa menghapus lalu menyisipkan ulang seluruh baris,
            // sehingga ID-nya berganti — dan ID itulah tujuan tautan edit pada
            // tiap kartu di halaman ini.
            await axiosInstance.put(`/api/profil-pegawai/urutan/${menuId}`, {
                urutan: daftarBaru.map((p) => p.id),
            });
        } catch (err) {
            setProfiles(sebelumnya);
            const pesanPeladen = typeof err?.response?.data === 'object' ? err.response.data?.pesan : null;
            setError(pesanPeladen || 'Gagal menyimpan urutan profil. Coba lagi.');
            console.error('Gagal menyimpan urutan profil:', err);
        }
    };

    const seret = useSeretUrutan({
        daftar: profiles,
        onUrutBaru: simpanUrutan,
        tahanMs: TAHAN_MS,
    });

    const bukaEditor = (profileId) => {
        if (seret.klikDitahan()) return; // klik sisa seretan → abaikan
        navigate(jAdmin(`kelola-profil/edit/${menuId}/${profileId}`));
    };

    if (loading) {
        return <main className="admin-content"><p>Memuat data profil...</p></main>;
    }

    return (
        <main className="admin-content">
            <div className="ppc-preview-header">
                <div className="ppc-preview-heading">
                    <h1>Kelola Profil - {menuName}</h1>
                    <p>Kelola daftar kartu profil yang akan ditampilkan di halaman pengguna.</p>
                </div>
                <button className="ppc-preview-btn-tambah" onClick={handleAddProfile}>
                    Tambah Profil
                </button>
            </div>

            {error && <div className="lk-error">{error}</div>}

            {profiles.length > 0 && (
                <p className="ppc-seret-catatan">
                    <i className="fa-solid fa-hand-pointer" aria-hidden="true"></i>
                    <span>
                        <b>Klik</b> kartu untuk mengedit profilnya. <b>Tahan</b> lalu geser untuk
                        menukar posisinya — urutan di halaman pengunjung ikut berubah.
                    </span>
                </p>
            )}

            <section className="ppc-preview-grid">
                {seret.daftarTampil.length > 0 ? (
                    seret.daftarTampil.map(profile => (
                        <div
                            key={profile.id || profile.nama_lengkap}
                            {...seret.propsWadah(profile.id)}
                            className={`ppc-preview-card-wrapper${
                                seret.idDiseret === String(profile.id) ? ' ppc-kartu-diseret' : ''
                            }${seret.sedangMenyeret ? ' ppc-sedang-menyusun' : ''}`}
                            onPointerDown={(e) => seret.padaTekan(e, profile.id)}
                            onClick={() => bukaEditor(profile.id)}
                            // Menu konteks pada tekan-lama di layar sentuh akan
                            // memotong seretan tepat saat ia mulai.
                            onContextMenu={(e) => e.preventDefault()}
                            title="Klik untuk mengedit — tahan untuk memindahkan"
                        >
                            <CardContent name={profile.nama_lengkap} role={profile.jabatan} quote={profile.quotes} imageSrc={profile.url_foto} />
                        </div>
                    ))
                ) : (
                    <div className="ppc-preview-empty">
                        <i className="fa-solid fa-users-slash"></i>
                        <h3>Belum Ada Data Profil</h3>
                        <p>Silahkan menambahkan data profil terlebih dahulu dengan menekan tombol di atas.</p>
                    </div>
                )}
            </section>
        </main>
    );
};

export default PreviewProfilCard;