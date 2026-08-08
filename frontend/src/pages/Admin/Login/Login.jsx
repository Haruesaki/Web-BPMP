import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css';
import { useAuth } from '../../../hooks/useAuth';

// =========================================================================
//  HALAMAN LOGIN CMS — Web BPMP Lampung
//  -----------------------------------------------------------------------
//  Scope CSS: seluruh isi dibungkus <div className="auth-layout"> agar
//  variabel warna & style tidak bocor ke halaman lain (Beranda/Dashboard).
//  Link "Lupa password?" mengarah ke /admin/lupa-password.
// =========================================================================

const Login = () => {
  const navigate = useNavigate();
  const { login, loading, error } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    // Penjaga terhadap kiriman ganda: menekan Enter berulang kali sebelum
    // jawaban peladen tiba akan mengirim beberapa permintaan login sekaligus.
    if (loading) return;
    const result = await login(email, password, rememberMe);
    if (result.success) {
      navigate('/admin');
    }
  };

  // PINTASAN ENTER
  // Ditangani di tingkat <form> supaya Enter berlaku dari mana pun di dalam
  // formulir — termasuk saat fokus berada di kotak centang "Ingat saya", yang
  // TIDAK ikut memicu pengiriman otomatis bawaan peramban (perilaku bawaan itu
  // hanya berlaku pada kolom teks, dan tidak seragam antar peramban).
  //
  // `preventDefault` dipanggil lebih dahulu justru agar pengiriman bawaan
  // peramban tidak ikut berjalan; tanpa itu Enter di kolom teks akan memanggil
  // handleSubmit DUA KALI.
  const tanganiEnter = (e) => {
    if (e.key !== 'Enter' || e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) return;
    // Tautan "Lupa password?" dan tombol mata harus tetap menjalankan
    // fungsinya sendiri saat ditekan Enter, bukan mengirim formulir.
    const tag = e.target?.tagName;
    if (tag === 'A' || tag === 'BUTTON' || tag === 'TEXTAREA') return;
    e.preventDefault();
    handleSubmit();
  };

  return (
    <div className="auth-layout">
      <form className="auth-card" onSubmit={handleSubmit} onKeyDown={tanganiEnter}>
        <h1 className="auth-title">
          Login <span className="auth-title-accent">CMS</span>
        </h1>
        <p className="auth-subtitle">
          Silakan masukkan Email akun Anda untuk melanjutkan ke dashboard CMS.
        </p>

        {error && (
          <div className="auth-error-message" style={{ 
            color: '#ef4444', 
            background: 'rgba(239, 68, 68, 0.1)', 
            border: '1px solid rgba(239, 68, 68, 0.2)',
            padding: '10px 14px',
            borderRadius: '8px',
            marginBottom: '20px', 
            fontSize: '13.5px', 
            textAlign: 'center' 
          }}>
            <i className="fa-solid fa-circle-exclamation" style={{ marginRight: '8px' }}></i>
            {error}
          </div>
        )}

        {/* EMAIL */}
        <div className="auth-field">
          <label className="auth-label">EMAIL</label>
          <div className="auth-input-wrapper">
            <i className="fa-regular fa-envelope auth-input-icon"></i>
            <input
              type="email"
              className="auth-input"
              placeholder="admin@midnightcms.id"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        {/* PASSWORD */}
        <div className="auth-field">
          <label className="auth-label">PASSWORD</label>
          <div className="auth-input-wrapper">
            <i className="fa-solid fa-lock auth-input-icon"></i>
            <input
              type={showPassword ? 'text' : 'password'}
              className="auth-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ paddingRight: '44px' }}
            />
            <button
              type="button"
              className="auth-toggle-password"
              onClick={() => setShowPassword(!showPassword)}
            >
              <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
            </button>
          </div>
        </div>

        {/* OPSI: INGAT SAYA + LUPA PASSWORD */}
        <div className="auth-options">
          <label
            className="auth-remember"
            title="Sesi bertahan 7 hari di peramban ini. Tanpa dicentang, sesi berakhir dalam 8 jam."
          >
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <span>Ingat saya</span>
          </label>
          <Link to="/admin/lupa-password" className="auth-link">
            Lupa password?
          </Link>
        </div>

        {/* TOMBOL MASUK */}
        <button type="submit" className="auth-btn" disabled={loading}>
          {loading ? 'Memuat...' : 'Masuk'} <i className="fa-solid fa-arrow-right"></i>
        </button>
      </form>
    </div>
  );
};

export default Login;
