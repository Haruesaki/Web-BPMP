import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css';
import './LupaPassword.css';
import { requestOtpApi, verifyOtpApi, resetPasswordApi } from '../../../api/authApi';
import { simpanSesi } from '../../../utils/sesiAdmin';
import { AKAR_ADMIN, JALUR_MASUK } from '../../../config/jalurAdmin';

const OTP_LENGTH = 6;

const LupaPassword = () => {
  const navigate = useNavigate();

  // Load state dari sessionStorage agar tetap persisten saat halaman di-refresh
  const [email, setEmail] = useState(() => sessionStorage.getItem('otpEmail') || '');
  const [step, setStep] = useState(() => sessionStorage.getItem('otpStep') || 'email');
  
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [cooldown, setCooldown] = useState(0);

  const otpRefs = useRef([]);

  // Cek dan pulihkan cooldown dari localStorage saat komponen dipasang
  useEffect(() => {
    const expires = localStorage.getItem('otpCooldownExpires');
    if (expires) {
      const remaining = Math.ceil((Number(expires) - Date.now()) / 1000);
      if (remaining > 0) {
        setCooldown(remaining);
      }
    }
  }, []);

  // Interval timer untuk cooldown
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      const expires = localStorage.getItem('otpCooldownExpires');
      if (expires) {
        const remaining = Math.ceil((Number(expires) - Date.now()) / 1000);
        if (remaining <= 0) {
          setCooldown(0);
          clearInterval(interval);
        } else {
          setCooldown(remaining);
        }
      } else {
        setCooldown(0);
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  // Simpan perubahan step dan email ke sessionStorage
  useEffect(() => {
    sessionStorage.setItem('otpStep', step);
    sessionStorage.setItem('otpEmail', email);
  }, [step, email]);

  // --- HANDLER: Kirim OTP ---
  const handleRequestOtp = async (e) => {
    if (e) e.preventDefault();
    if (!email) {
      setError('Masukkan email Anda terlebih dahulu.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await requestOtpApi(email);
      if (result.status === 'success') {
        const cooldownSeconds = result.data.cooldown;
        const expiresAt = Date.now() + cooldownSeconds * 1000;
        localStorage.setItem('otpCooldownExpires', expiresAt.toString());
        setCooldown(cooldownSeconds);
        setSuccess('Kode OTP telah dikirim ke email Anda.');
        setStep('otp');
        setOtp(Array(OTP_LENGTH).fill(''));
      }
    } catch (err) {
      setError(err.message || 'Gagal mengirim kode OTP.');
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLER: Verifikasi OTP ---
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length < OTP_LENGTH) {
      setError('Harap lengkapi 6-digit kode OTP.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await verifyOtpApi(email, otpCode);
      if (result.status === 'success') {
        setSuccess('Kode OTP terverifikasi. Silakan masukkan kata sandi baru Anda.');
        setStep('password');
      }
    } catch (err) {
      setError(err.message || 'Verifikasi OTP gagal.');
    } finally {
      setLoading(false);
    }
  };

  // Verifikasi otomatis saat seluruh kotak OTP terisi
  useEffect(() => {
    const otpCode = otp.join('');
    if (otpCode.length === OTP_LENGTH && step === 'otp') {
      handleVerifyOtp();
    }
  }, [otp]);

  // --- HANDLER: Reset Password & Langsung Masuk ---
  const handleResetPassword = async (e) => {
    if (e) e.preventDefault();
    if (!newPassword || !confirmPassword) {
      setError('Harap isi password baru dan konfirmasi password.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Kata sandi baru minimal harus 6 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await resetPasswordApi(email, newPassword);
      if (result.status === 'success' && result.data) {
        // Hapus status sesi lupa password
        sessionStorage.removeItem('otpStep');
        sessionStorage.removeItem('otpEmail');
        localStorage.removeItem('otpCooldownExpires');

        // Simpan sesi login baru yang dikembalikan oleh backend.
        // `access` kini ikut dikirim peladen — sebelumnya klaim itu tidak
        // disertakan pada jalur atur-ulang kata sandi, sehingga pengguna masuk
        // dengan daftar akses menu kosong sampai ia keluar lalu login kembali.
        const sessionData = {
          id: result.data.user.id,
          nama: result.data.user.nama,
          role: result.data.user.role,
          email: result.data.user.email,
          access: result.data.user.access,
          token: result.data.token
        };
        simpanSesi(sessionData);
        
        // Langsung arahkan ke Dashboard
        navigate(AKAR_ADMIN);
      }
    } catch (err) {
      setError(err.message || 'Gagal mengubah kata sandi.');
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLER: Input per digit OTP ---
  const handleOtpChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);

    if (digit && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  // Backspace mundur
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  // Mendukung tempel (paste) kode
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    if (pastedData.length === OTP_LENGTH && /^\d+$/.test(pastedData)) {
      setOtp(pastedData.split(''));
      otpRefs.current[OTP_LENGTH - 1]?.focus();
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-card">
        <h1 className="auth-title" style={{ marginBottom: '25px' }}>
          Reset <span className="auth-title-accent">Sandi</span>
        </h1>
        
        {/* STEPPER PROGRESS */}
        <div className="lupa-stepper">
          <div className={`lupa-step-node ${step === 'email' ? 'active' : step === 'otp' || step === 'password' ? 'completed' : ''}`}>
            <span className="lupa-step-circle">
              {step === 'otp' || step === 'password' ? <i className="fa-solid fa-check"></i> : '1'}
            </span>
            <span className="lupa-step-label">Email</span>
          </div>
          <div className={`lupa-step-node ${step === 'otp' ? 'active' : step === 'password' ? 'completed' : ''}`}>
            <span className="lupa-step-circle">
              {step === 'password' ? <i className="fa-solid fa-check"></i> : '2'}
            </span>
            <span className="lupa-step-label">OTP</span>
          </div>
          <div className={`lupa-step-node ${step === 'password' ? 'active' : ''}`}>
            <span className="lupa-step-circle">3</span>
            <span className="lupa-step-label">Sandi</span>
          </div>
        </div>

        {error && (
          <div className="auth-error-message" style={{ 
            color: '#ef4444', 
            background: 'rgba(239, 68, 68, 0.08)', 
            border: '1px solid rgba(239, 68, 68, 0.16)',
            padding: '10px 14px',
            borderRadius: '8px',
            marginBottom: '20px', 
            fontSize: '13px', 
            textAlign: 'center' 
          }}>
            <i className="fa-solid fa-circle-exclamation" style={{ marginRight: '8px' }}></i>
            {error}
          </div>
        )}

        {success && (
          <div className="auth-success-message" style={{ 
            color: '#34d399', 
            background: 'rgba(52, 211, 153, 0.08)', 
            border: '1px solid rgba(52, 211, 153, 0.16)',
            padding: '10px 14px',
            borderRadius: '8px',
            marginBottom: '20px', 
            fontSize: '13px', 
            textAlign: 'center' 
          }}>
            <i className="fa-solid fa-circle-check" style={{ marginRight: '8px' }}></i>
            {success}
          </div>
        )}

        {/* STEP 1: INPUT EMAIL */}
        {step === 'email' && (
          <form onSubmit={handleRequestOtp}>
            <p className="auth-subtitle">
              Silakan masukkan Email akun administrator Anda untuk mengirimkan kode OTP verifikasi.
            </p>
            <div className="auth-field">
              <label className="auth-label">EMAIL ADMINISTRATOR</label>
              <div className="auth-input-wrapper">
                <i className="fa-regular fa-envelope auth-input-icon"></i>
                <input
                  type="email"
                  className="auth-input"
                  placeholder="admin@bpmp.kemdikbud.go.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Mengirim...' : 'Kirim Kode OTP Ke Email'}{' '}
              <i className="fa-solid fa-arrow-right"></i>
            </button>
          </form>
        )}

        {/* STEP 2: VERIFIKASI OTP */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp}>
            <p className="auth-subtitle">
              Kami telah mengirimkan 6 digit kode OTP ke email <strong style={{ color: 'var(--text-main)' }}>{email}</strong>. Harap masukkan kode tersebut di bawah ini.
            </p>
            <div className="auth-field">
              <label className="auth-label">KODE OTP (6 DIGIT)</label>
              <div className="otp-group">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => (otpRefs.current[i] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    className="otp-box"
                    placeholder="•"
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    onPaste={handleOtpPaste}
                    required
                  />
                ))}
              </div>
            </div>
            
            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Memverifikasi...' : 'Verifikasi OTP'}{' '}
              <i className="fa-solid fa-arrow-right"></i>
            </button>

            <div className="otp-cooldown-wrapper">
              {cooldown > 0 ? (
                <span>Kirim ulang kode OTP dalam <strong style={{ color: 'var(--purple)' }}>{cooldown}s</strong></span>
              ) : (
                <button
                  type="button"
                  className="otp-resend-btn"
                  onClick={handleRequestOtp}
                  disabled={loading}
                >
                  Kirim Ulang Kode OTP
                </button>
              )}
            </div>
          </form>
        )}

        {/* STEP 3: BUAT PASSWORD BARU */}
        {step === 'password' && (
          <form onSubmit={handleResetPassword}>
            <p className="auth-subtitle">
              Kode OTP terverifikasi. Silakan masukkan kata sandi baru Anda di bawah ini.
            </p>
            
            {/* PASSWORD BARU */}
            <div className="auth-field">
              <label className="auth-label">KATA SANDI BARU</label>
              <div className="auth-input-wrapper">
                <i className="fa-solid fa-lock auth-input-icon"></i>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  className="auth-input"
                  placeholder="Minimal 6 karakter"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{ paddingRight: '44px' }}
                  required
                />
                <button
                  type="button"
                  className="auth-toggle-password"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  <i className={`fa-solid ${showNewPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>

            {/* KONFIRMASI PASSWORD BARU */}
            <div className="auth-field">
              <label className="auth-label">KONFIRMASI KATA SANDI</label>
              <div className="auth-input-wrapper">
                <i className="fa-solid fa-lock auth-input-icon"></i>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="auth-input"
                  placeholder="Ulangi kata sandi baru"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ paddingRight: '44px' }}
                  required
                />
                <button
                  type="button"
                  className="auth-toggle-password"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <i className={`fa-solid ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Memproses...' : 'Reset Kata Sandi & Masuk'}{' '}
              <i className="fa-solid fa-arrow-right"></i>
            </button>
          </form>
        )}

        {/* KEMBALI KE LOGIN */}
        <Link to={JALUR_MASUK} className="auth-back-link" onClick={() => {
          // Bersihkan session flow jika kembali ke login
          sessionStorage.removeItem('otpStep');
          sessionStorage.removeItem('otpEmail');
        }}>
          <i className="fa-solid fa-arrow-left"></i> Kembali ke Login
        </Link>
      </div>
    </div>
  );
};

export default LupaPassword;
