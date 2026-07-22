import React, { useState, useEffect } from 'react';
import axiosInstance from '../../../api/axiosInstance';
import './PengaturanPengunjungSection.css';

const PengaturanPengunjungSection = ({ triggerAlert }) => {
  const [pengunjungHariIni, setPengunjungHariIni] = useState(0);
  const [totalPengunjung, setTotalPengunjung] = useState(0);
  const [isSynced, setIsSynced] = useState(true);
  const [loading, setLoading] = useState(false);

  const formatNumberId = (val) => {
    if (!val) return '';
    // Hapus semua karakter non-angka
    const rawValue = val.toString().replace(/[^0-9]/g, '');
    if (!rawValue) return '';
    // Format ribuan gaya Indonesia (titik)
    return parseInt(rawValue, 10).toLocaleString('id-ID');
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await axiosInstance.get('/api/beranda/pengunjung');
      const data = res.data?.data;
      if (data) {
        // Gunakan manual_* agar form admin tetap menampilkan angka aslinya, lalu format jadi ribuan
        const hIni = data.manual_pengunjung_hari_ini ?? data.pengunjung_hari_ini ?? 0;
        const hTot = data.manual_total_pengunjung ?? data.total_pengunjung ?? 0;
        setPengunjungHariIni(formatNumberId(hIni));
        setTotalPengunjung(formatNumberId(hTot));
        setIsSynced(data.is_synced);
      }
    } catch (err) {
      console.error('Gagal mengambil pengaturan pengunjung:', err);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Hilangkan titik sebelum dikirim ke database
      const cleanHariIni = pengunjungHariIni ? parseInt(pengunjungHariIni.toString().replace(/\./g, ''), 10) : 0;
      const cleanTotal = totalPengunjung ? parseInt(totalPengunjung.toString().replace(/\./g, ''), 10) : 0;

      await axiosInstance.put('/api/beranda/pengunjung', {
        pengunjung_hari_ini: cleanHariIni,
        total_pengunjung: cleanTotal,
        is_synced: isSynced
      });
      if (triggerAlert) {
        triggerAlert('success', 'Pengaturan jumlah pengunjung berhasil disimpan!', 'Tersimpan');
      }
      // Fetch ulang agar angka update jika is_synced aktif
      fetchData();
    } catch (err) {
      if (triggerAlert) {
        triggerAlert('error', 'Gagal menyimpan pengaturan pengunjung.', 'Gagal');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cb-pengunjung-section-form">
      <div className="sync-toggle-group">
        <label className="toggle-label">
          <input 
            type="checkbox" 
            checked={isSynced} 
            onChange={(e) => setIsSynced(e.target.checked)} 
            className="sync-checkbox"
          />
          Sinkronkan dengan data riil (Statistik Pengunjung Otomatis)
        </label>
        <p className="sync-help-text">
          {isSynced 
            ? "Angka di bawah ini akan diabaikan dan pengunjung akan dihitung secara otomatis berdasarkan data asli situs." 
            : "Situs akan menampilkan angka manual yang Anda ketikkan di bawah ini."}
        </p>
      </div>

      <div className={`pengunjung-inputs ${isSynced ? 'is-synced' : ''}`} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label className="cb-field-label">Pengunjung Hari Ini</label>
          <input 
            type="text" 
            value={pengunjungHariIni}
            onChange={(e) => setPengunjungHariIni(formatNumberId(e.target.value))}
            disabled={isSynced}
            className="cb-input"
            placeholder="Contoh: 123"
          />
        </div>
        <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label className="cb-field-label">Total Pengunjung</label>
          <input 
            type="text" 
            value={totalPengunjung}
            onChange={(e) => setTotalPengunjung(formatNumberId(e.target.value))}
            disabled={isSynced}
            className="cb-input"
            placeholder="Contoh: 107030"
          />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
        <button className="cb-btn cb-btn-simpan" onClick={handleSave} disabled={loading}>
          {loading ? (
            <>
              <i className="fa-solid fa-spinner fa-spin"></i> Menyimpan...
            </>
          ) : (
            <>
              <i className="fa-solid fa-save"></i> Simpan Pengaturan
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default PengaturanPengunjungSection;
