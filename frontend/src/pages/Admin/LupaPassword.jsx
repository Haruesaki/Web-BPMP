import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import './Login.css';
import './LupaPassword.css';

// =========================================================================
//  HALAMAN LUPA PASSWORD CMS — Web BPMP Lampung
//  -----------------------------------------------------------------------
//  Dua state dalam satu halaman:
//   1. State awal  : hanya field EMAIL + tombol "Kirim Kode OTP Ke Email".
//   2. State OTP   : setelah tombol ditekan, muncul 6 kotak KODE OTP di
//                    bawah email, dan tombol berubah jadi "Kirim Kode OTP".
//  Toggle dikontrol oleh state `otpSent`.
// =========================================================================

const OTP_LENGTH = 6;

const LupaPassword = () => {
  const [email, setEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const otpRefs = useRef([]);

  // --- HANDLER: Tombol utama ---
  const handleKirimOtp = () => {
    if (!otpSent) {
      // TODO: integrasi ke backend (POST /api/auth/forgot-password) kirim OTP ke email.
      console.log('Kirim OTP ke:', email);
      setOtpSent(true);
    } else {
      // TODO: integrasi ke backend (POST /api/auth/verify-otp) verifikasi kode OTP.
      console.log('Verifikasi OTP:', otp.join(''), 'untuk email:', email);
    }
  };

  // --- HANDLER: Input tiap kotak OTP ---
  const handleOtpChange = (index, value) => {
    // hanya ambil 1 digit angka terakhir
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);

    // auto-focus ke kotak berikutnya
    if (digit && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  // --- HANDLER: Tombol keyboard (Backspace mundur ke kotak sebelumnya) ---
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-card">
        <h1 className="auth-title">
          Login <span className="auth-title-accent">CMS</span>
        </h1>
        <p className="auth-subtitle">
          Silakan isi form di bawah ini untuk mengirimkan kode OTP ke Email anda.
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

        {/* KODE OTP (muncul setelah tombol ditekan) */}
        {otpSent && (
          <div className="auth-field">
            <label className="auth-label">KODE OTP</label>
            <div className="otp-group">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => (otpRefs.current[i] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  className="otp-box"
                  placeholder="0"
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                />
              ))}
            </div>
          </div>
        )}

        {/* TOMBOL UTAMA (label berubah sesuai state) */}
        <button className="auth-btn" onClick={handleKirimOtp}>
          {otpSent ? 'Kirim Kode OTP' : 'Kirim Kode OTP Ke Email'}{' '}
          <i className="fa-solid fa-arrow-right"></i>
        </button>

        {/* KEMBALI KE LOGIN */}
        <Link to="/admin/login" className="auth-back-link">
          <i className="fa-solid fa-arrow-left"></i> Kembali ke Login
        </Link>
      </div>
    </div>
  );
};

export default LupaPassword;
