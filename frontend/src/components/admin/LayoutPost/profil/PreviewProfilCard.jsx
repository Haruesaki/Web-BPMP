import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../../../api/axiosInstance';
import CardContent from '../../../user/content-types/CardProfile/CardContent';
import './PreviewProfilCard.css';

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

                const session = JSON.parse(sessionStorage.getItem('adminSession'));
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
        navigate(`/admin/kelola-profil/tambah/${menuId}`);
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

            <section className="ppc-preview-grid">
                {profiles.length > 0 ? (
                    profiles.map(profile => (
                        <div 
                            key={profile.id || profile.nama_lengkap} 
                            className="ppc-preview-card-wrapper"
                            onClick={() => navigate(`/admin/kelola-profil/edit/${menuId}/${profile.id}`)}
                            style={{ cursor: 'pointer', transition: 'transform 0.2s ease', position: 'relative' }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            title="Klik untuk mengedit profil ini"
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