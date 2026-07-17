import React from 'react';
import './SocialMediaSetting.css';

const SocialMediaSetting = ({
  socials,
  updateSocial,
  handleSocialAvatarChange,
  tambahPlatform,
  hapusPlatform,
}) => {
  return (
    <section className="cb-card">
      <div className="cb-card-title">
        <i className="fa-solid fa-share-nodes"></i>
        <span>Floating Media Sosial</span>
      </div>

      <div className="cb-social-list">
        {socials.map((social) => (
          <div className="cb-social-row" key={social.id}>
            <label className="cb-social-avatar" htmlFor={`social-avatar-${social.id}`}>
              {social.avatar ? (
                <img src={social.avatar} alt={social.label || 'Avatar platform'} />
              ) : (
                <i className="fa-regular fa-image"></i>
              )}
            </label>
            <input
              id={`social-avatar-${social.id}`}
              type="file"
              accept="image/*"
              className="cb-hidden-input"
              onChange={(e) => handleSocialAvatarChange(social.id, e)}
            />

            <div className="cb-social-field">
              <label className="cb-field-label cb-field-label-caps">Label</label>
              <input
                type="text"
                className="cb-input"
                value={social.label}
                onChange={(e) => updateSocial(social.id, 'label', e.target.value)}
                placeholder="Isi Label Disini..."
              />
            </div>

            <div className="cb-social-field">
              <label className="cb-field-label cb-field-label-caps">URL Link</label>
              <input
                type="text"
                className="cb-input"
                value={social.url}
                onChange={(e) => updateSocial(social.id, 'url', e.target.value)}
                placeholder="https://..."
              />
            </div>

            <button
              className="cb-icon-btn cb-icon-btn-danger"
              title="Hapus"
              onClick={() => hapusPlatform(social.id)}
            >
              <i className="fa-solid fa-trash"></i>
            </button>
          </div>
        ))}
      </div>

      <button className="cb-btn-dashed" onClick={tambahPlatform}>
        <i className="fa-solid fa-plus"></i> Tambah Platform
      </button>
    </section>
  );
};

export default SocialMediaSetting;
