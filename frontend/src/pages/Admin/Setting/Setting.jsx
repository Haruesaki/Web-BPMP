import React, { useState, useEffect } from 'react';
import axiosInstance from '../../../api/axiosInstance';
import { getAuthHeaders } from '../../../api/userApi';
import { bacaSesi, simpanSesi } from '../../../utils/sesiAdmin';
import '../DashboardAdmin/dashboard-admin.css';
import './Setting.css';

// =========================================================================
//  CATATAN
//  -----------------------------------------------------------------------
//  Endpoint yang dipakai halaman ini (PUT /api/users/me dan
//  PUT /api/users/me/password) BELUM ada di backend saat ini — lihat
//  database.md untuk detail yang perlu ditambahkan rekan backend.
//  Selama endpoint belum tersedia, submit akan gagal dengan pesan error
//  dari catch block (network error / 404), itu wajar untuk sementara.
// =========================================================================

const getSession = () => bacaSesi() || {};

const EMPTY_PASSWORD_FORM = { oldPassword: '', newPassword: '', confirmPassword: '' };

const Setting = () => {
  const session = getSession();

  // ---------- PROFIL SAYA ----------
  const [nama, setNama] = useState(session.nama || '');
  const [email, setEmail] = useState(session.email || '');
  const [role, setRole] = useState(session.role || '-');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    // Ambil profil asli dari database saat komponen dimuat
    const fetchMe = async () => {
      try {
        const res = await axiosInstance.get('/api/users/me', { headers: getAuthHeaders() });
        const data = res.data?.data;
        if (data) {
          setNama(data.nama || '');
          setEmail(data.email || '');
          setRole(data.role || '-');
        }
      } catch (error) {
        console.error('Gagal mengambil profil asli dari database:', error);
      }
    };
    fetchMe();
  }, []);

  const handleSimpanProfil = async (e) => {
    e.preventDefault();
    setProfileMsg({ type: '', text: '' });

    if (!nama.trim() || !email.trim()) {
      setProfileMsg({ type: 'error', text: 'Nama dan email wajib diisi.' });
      return;
    }

    setProfileSaving(true);
    try {
      await axiosInstance.put(
        '/api/users/me',
        { nama, email },
        { headers: getAuthHeaders() }
      );

      // Perbarui sessionStorage supaya nama/email di header ikut ter-update
      // pada kunjungan berikutnya (header hanya baca session saat mount).
      const updatedSession = { ...session, nama, email };
      simpanSesi(updatedSession);

      setProfileMsg({ type: 'success', text: 'Profil berhasil diperbarui.' });
    } catch (error) {
      const msg = error.response?.data?.message || error.response?.data?.pesan || 'Gagal memperbarui profil.';
      setProfileMsg({ type: 'error', text: msg });
    } finally {
      setProfileSaving(false);
    }
  };

  // ---------- GANTI PASSWORD ----------
  const [passwordForm, setPasswordForm] = useState(EMPTY_PASSWORD_FORM);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });
  
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const updatePasswordField = (field, value) =>
    setPasswordForm((prev) => ({ ...prev, [field]: value }));

  const handleGantiPassword = async (e) => {
    e.preventDefault();
    setPasswordMsg({ type: '', text: '' });

    const { oldPassword, newPassword, confirmPassword } = passwordForm;

    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Semua kolom wajib diisi.' });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMsg({ type: 'error', text: 'Password baru minimal 8 karakter.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Konfirmasi password baru tidak cocok.' });
      return;
    }

    setPasswordSaving(true);
    try {
      await axiosInstance.put(
        '/api/users/me/password',
        { oldPassword, newPassword },
        { headers: getAuthHeaders() }
      );

      setPasswordMsg({ type: 'success', text: 'Password berhasil diperbarui.' });
      setPasswordForm(EMPTY_PASSWORD_FORM);
    } catch (error) {
      const msg = error.response?.data?.message || error.response?.data?.pesan || 'Gagal memperbarui password.';
      setPasswordMsg({ type: 'error', text: msg });
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <main className="admin-content">
      {/* ---------- HEADING ---------- */}
      <div className="st-heading">
        <h1>Setting</h1>
        <p>Kelola profil dan keamanan akun Anda.</p>
      </div>

      <div className="content-stack">
        {/* ---------- CARD: PROFIL SAYA ---------- */}
        <section className="card st-card">
          <div className="st-card-title">
            <i className="fa-solid fa-user"></i>
            <span>Profil Saya</span>
          </div>
          <p className="st-card-sub">Informasi akun yang sedang Anda gunakan untuk login.</p>

          <form onSubmit={handleSimpanProfil}>
            <div className="st-form-grid">
              <div className="st-field">
                <label>Nama</label>
                <input
                  type="text"
                  className="st-input"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Nama lengkap"
                />
              </div>

              <div className="st-field">
                <label>Email</label>
                <input
                  type="email"
                  className="st-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@bpmplampung.go.id"
                />
              </div>

              <div className="st-field">
                <label>Role</label>
                <input
                  type="text"
                  className="st-input st-input-readonly"
                  value={role}
                  readOnly
                />
                <span className="st-field-hint">Role hanya bisa diubah oleh Super Admin lewat Manajemen User.</span>
              </div>
            </div>

            {profileMsg.text && (
              <div className={`st-alert st-alert-${profileMsg.type}`}>{profileMsg.text}</div>
            )}

            <button type="submit" className="st-btn-simpan" disabled={profileSaving}>
              {profileSaving ? 'Menyimpan...' : 'Simpan Profil'}
            </button>
          </form>
        </section>

        {/* ---------- CARD: GANTI PASSWORD ---------- */}
        <section className="card st-card">
          <div className="st-card-title">
            <i className="fa-solid fa-lock"></i>
            <span>Ganti Password</span>
          </div>
          <p className="st-card-sub">Gunakan password lama Anda untuk mengonfirmasi perubahan ini.</p>

          <form onSubmit={handleGantiPassword}>
            <div className="st-form-grid">
              <div className="st-field">
                <label>Password Lama</label>
                <div style={{ position: 'relative', width: '100%' }}>
                  <input
                    type={showOldPassword ? "text" : "password"}
                    className="st-input"
                    value={passwordForm.oldPassword}
                    onChange={(e) => updatePasswordField('oldPassword', e.target.value)}
                    placeholder="Masukkan password saat ini"
                    style={{ paddingRight: '40px', width: '100%', boxSizing: 'border-box' }}
                  />
                  <i 
                    className={`fa-solid ${showOldPassword ? 'fa-eye-slash' : 'fa-eye'}`} 
                    style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#666' }}
                    onClick={() => setShowOldPassword(!showOldPassword)}
                  ></i>
                </div>
              </div>

              <div className="st-field">
                <label>Password Baru</label>
                <div style={{ position: 'relative', width: '100%' }}>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    className="st-input"
                    value={passwordForm.newPassword}
                    onChange={(e) => updatePasswordField('newPassword', e.target.value)}
                    placeholder="Minimal 8 karakter"
                    style={{ paddingRight: '40px', width: '100%', boxSizing: 'border-box' }}
                  />
                  <i 
                    className={`fa-solid ${showNewPassword ? 'fa-eye-slash' : 'fa-eye'}`} 
                    style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#666' }}
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  ></i>
                </div>
              </div>

              <div className="st-field">
                <label>Konfirmasi Password Baru</label>
                <div style={{ position: 'relative', width: '100%' }}>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    className="st-input"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => updatePasswordField('confirmPassword', e.target.value)}
                    placeholder="Ulangi password baru"
                    style={{ paddingRight: '40px', width: '100%', boxSizing: 'border-box' }}
                  />
                  <i 
                    className={`fa-solid ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`} 
                    style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#666' }}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  ></i>
                </div>
              </div>
            </div>

            {passwordMsg.text && (
              <div className={`st-alert st-alert-${passwordMsg.type}`}>{passwordMsg.text}</div>
            )}

            <button type="submit" className="st-btn-simpan" disabled={passwordSaving}>
              {passwordSaving ? 'Menyimpan...' : 'Ganti Password'}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
};

export default Setting;