import React from 'react';
import './FooterSetting.css';

const FooterSetting = ({
  footer,
  setFooter,
  googleMaps,
  setGoogleMaps,
  tautan,
  updateTautan,
  tambahTautan,
  hapusTautan,
}) => {
  return (
    <section className="cb-card">
      <div className="cb-card-title">
        <i className="fa-regular fa-comment-dots"></i>
        <span>Footer</span>
      </div>

      <div className="cb-grid-2">
        {/* Hubungi Kami + Lokasi */}
        <div className="cb-footer-col">
          <div className="cb-footer-box">
            <h3 className="cb-footer-title">Hubungi Kami</h3>

            <label className="cb-field-label">Email</label>
            <input
              type="email"
              className="cb-input"
              placeholder="admin@instansi.go.id"
              value={footer.email}
              onChange={(e) => setFooter((prev) => ({ ...prev, email: e.target.value }))}
            />

            <label className="cb-field-label">No. Telepon</label>
            <input
              type="text"
              className="cb-input"
              placeholder="(021) 1234567"
              value={footer.telepon}
              onChange={(e) => setFooter((prev) => ({ ...prev, telepon: e.target.value }))}
            />

            <label className="cb-field-label">Alamat</label>
            <textarea
              className="cb-textarea"
              rows={2}
              placeholder="Jl. Jenderal Sudirman No. 1..."
              value={footer.alamat}
              onChange={(e) => setFooter((prev) => ({ ...prev, alamat: e.target.value }))}
            />
          </div>

          <div className="cb-footer-box">
            <h3 className="cb-footer-title">Lokasi</h3>

            <label className="cb-field-label">Link Google Maps</label>
            <input
              type="text"
              className="cb-input"
              placeholder="https://goo.gl/maps/..."
              value={googleMaps}
              onChange={(e) => setGoogleMaps(e.target.value)}
            />
          </div>
        </div>

        {/* Tautan */}
        <div className="cb-footer-box">
          <h3 className="cb-footer-title">Tautan</h3>

          {tautan.map((item) => (
            <div className="cb-tautan-row" key={item.id}>
              <div className="cb-tautan-field">
                <label className="cb-field-label">Label</label>
                <input
                  type="text"
                  placeholder="Isi Label Disini..."
                  className="cb-input"
                  value={item.label}
                  onChange={(e) => updateTautan(item.id, 'label', e.target.value)}
                />
              </div>
              <div className="cb-tautan-field">
                <label className="cb-field-label">Link</label>
                <input
                  type="text"
                  className="cb-input"
                  placeholder="https://tautan..."
                  value={item.link}
                  onChange={(e) => updateTautan(item.id, 'link', e.target.value)}
                />
              </div>
              <button
                className="cb-icon-btn cb-icon-btn-danger cb-tautan-delete"
                title="Hapus tautan"
                onClick={() => hapusTautan(item.id)}
              >
                <i className="fa-solid fa-trash"></i>
              </button>
            </div>
          ))}

          <button className="cb-btn-dashed" onClick={tambahTautan}>
            <i className="fa-solid fa-plus"></i> Tambah Link
          </button>
        </div>
      </div>
    </section>
  );
};

export default FooterSetting;
