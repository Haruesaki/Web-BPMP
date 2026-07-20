import React, { useState, useEffect } from 'react';
import axiosInstance from '../../../api/axiosInstance';
import InstagramSection from '../../user/instagram/InstagramSection';
import './InstagramSectionForm.css';

const InstagramSectionForm = () => {
  const [username, setUsername] = useState('');
  const [embedLinks, setEmbedLinks] = useState(['', '', '', '']);
  const [igProfile, setIgProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingEmbeds, setIsSavingEmbeds] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setIsFetching(true);
    try {
      const res = await axiosInstance.get('/api/instagram');
      if (res.data?.success && res.data?.data) {
        const data = typeof res.data.data === 'string' ? JSON.parse(res.data.data) : res.data.data;
        setIgProfile(data);
        setUsername(data.username || '');
        if (data.embed_links && Array.isArray(data.embed_links)) {
          const loadedLinks = [...data.embed_links];
          while (loadedLinks.length < 4) loadedLinks.push('');
          setEmbedLinks(loadedLinks.slice(0, 4));
        }
      }
    } catch (error) {
      console.error('Gagal mengambil data profil Instagram:', error);
    } finally {
      setIsFetching(false);
    }
  };

  const handleSimpan = async () => {
    if (!username.trim()) return;
    setIsLoading(true);
    try {
      const res = await axiosInstance.put('/api/instagram/update-username', { username });
      if (res.data?.success && res.data?.data) {
        const data = typeof res.data.data === 'string' ? JSON.parse(res.data.data) : res.data.data;
        setIgProfile(data);
        alert('Informasi akun Instagram berhasil diperbarui!');
      }
    } catch (error) {
      console.error('Gagal memperbarui profil Instagram:', error);
      alert(error.response?.data?.pesan || 'Gagal memperbarui profil Instagram');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSimpanEmbeds = async () => {
    setIsSavingEmbeds(true);
    try {
      // Extract post ID from full URL if user pasted a URL
      const cleanLinks = embedLinks.map(link => {
        if (!link) return '';
        // Extract from https://www.instagram.com/p/ID/ or /reel/ID/ or /tv/ID/
        const match = link.match(/\/(?:p|reel|tv)\/([a-zA-Z0-9_-]+)/);
        return match ? match[1] : link.trim();
      });

      const res = await axiosInstance.put('/api/instagram/update-embeds', { links: cleanLinks });
      if (res.data?.success && res.data?.data) {
        const data = typeof res.data.data === 'string' ? JSON.parse(res.data.data) : res.data.data;
        setIgProfile(data);
        
        // Update form inputs to show the cleaned IDs instantly
        if (data.embed_links && Array.isArray(data.embed_links)) {
          const loadedLinks = [...data.embed_links];
          while (loadedLinks.length < 4) loadedLinks.push('');
          setEmbedLinks(loadedLinks.slice(0, 4));
        }

        alert('Link embed postingan berhasil disimpan!');
      }
    } catch (error) {
      console.error('Gagal menyimpan link embed:', error);
      alert(error.response?.data?.pesan || 'Gagal menyimpan link embed');
    } finally {
      setIsSavingEmbeds(false);
    }
  };

  const updateEmbedLink = (index, value) => {
    const newLinks = [...embedLinks];
    newLinks[index] = value;
    setEmbedLinks(newLinks);
  };

  return (
    <div className="cb-ig-section-form">
      <div className="cb-ig-input-group">
        <label className="cb-field-label cb-field-label-caps">Username Akun Instagram</label>
        <div className="cb-ig-input-row">
          <div className="cb-ig-input-wrapper">
            <span className="cb-ig-at">@</span>
            <input
              type="text"
              className="cb-input cb-ig-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Contoh: bpmplampung"
              disabled={isLoading || isFetching}
            />
          </div>
          <button 
            className="cb-btn cb-btn-simpan cb-ig-btn-simpan"
            onClick={handleSimpan}
            disabled={isLoading || isFetching || !username.trim()}
          >
            {isLoading ? (
              <><i className="fa-solid fa-circle-notch fa-spin"></i> Menyinkronkan</>
            ) : (
              <><i className="fa-solid fa-cloud-arrow-down"></i> Simpan & Scrape Data</>
            )}
          </button>
        </div>
        <p className="cb-ig-help-text">
          Sistem akan men-scrape data (foto profil, postingan, pengikut) secara otomatis dari RapidAPI berdasarkan username ini.
        </p>
      </div>

      <div className="cb-mitra-preview-container">
        <div className="cb-mitra-preview-header">
          <i className="fa-solid fa-desktop"></i>
          <span>Live Preview Beranda</span>
        </div>
        <div className="cb-ig-preview-box">
          {igProfile ? (
            <InstagramSection igProfile={igProfile} loading={isFetching} isPreviewMode={true} />
          ) : (
            <div className="cb-mitra-preview-empty">
              Sedang memuat data pratinjau Instagram...
            </div>
          )}
        </div>
      </div>

      <div className="cb-ig-embed-group">
        <label className="cb-field-label cb-field-label-caps">Postingan Instagram (Embed)</label>
        <p className="cb-ig-help-text" style={{ marginBottom: '12px' }}>
          Masukkan ID Postingan atau URL lengkap Instagram (contoh: <code>DaMGvRKAb7z</code> atau <code>https://www.instagram.com/p/DaMGvRKAb7z/</code>)
        </p>
        <div className="cb-ig-embed-grid">
          {embedLinks.map((link, index) => (
            <div key={index} className="cb-ig-embed-item">
              <span className="cb-ig-embed-label">Post #{index + 1}</span>
              <input
                type="text"
                className="cb-input"
                value={link}
                onChange={(e) => updateEmbedLink(index, e.target.value)}
                placeholder="ID atau URL Postingan"
                disabled={isSavingEmbeds || isFetching}
              />
            </div>
          ))}
        </div>
        <button 
          className="cb-btn cb-btn-simpan cb-ig-btn-simpan"
          style={{ marginTop: '16px', alignSelf: 'flex-start' }}
          onClick={handleSimpanEmbeds}
          disabled={isSavingEmbeds || isFetching}
        >
          {isSavingEmbeds ? (
            <><i className="fa-solid fa-circle-notch fa-spin"></i> Menyimpan</>
          ) : (
            <><i className="fa-solid fa-save"></i> Simpan Postingan</>
          )}
        </button>
      </div>
    </div>
  );
};

export default InstagramSectionForm;
