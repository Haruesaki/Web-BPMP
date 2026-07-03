import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css';

// =========================================================================
//  HALAMAN LOGIN CMS — Web BPMP Lampung
//  -----------------------------------------------------------------------
//  Scope CSS: seluruh isi dibungkus <div className="auth-layout"> agar
//  variabel warna & style tidak bocor ke halaman lain (Beranda/Dashboard).
//  Link "Lupa password?" mengarah ke /admin/lupa-password.
// =========================================================================

const Login = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = () => {
    // TODO: integrasi ke backend (POST /api/auth/login).
    console.log({ email, password, rememberMe });
    // Contoh redirect setelah login sukses:
    // navigate('/admin');
  };

  return (
    <div className="auth-layout">
      <div className="auth-card">
        <h1 className="auth-title">
          Login <span className="auth-title-accent">CMS</span>
        </h1>
        <p className="auth-subtitle">
          Silakan masukkan Email akun Anda untuk melanjutkan ke dashboard CMS.
        </p>

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
              type="password"
              className="auth-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        {/* OPSI: INGAT SAYA + LUPA PASSWORD */}
        <div className="auth-options">
          <label className="auth-remember">
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
        <button className="auth-btn" onClick={handleSubmit}>
          Masuk <i className="fa-solid fa-arrow-right"></i>
        </button>
      </div>
    </div>
  );
};

export default Login;
