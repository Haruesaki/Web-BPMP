import { useState } from 'react';
import './SectionOrderSetting.css';

const SectionOrderSetting = ({
  sections,
  setSections,
  updateSection,
  tambahSection,
  hapusSection,
  menuOptions,
}) => {
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [isDraggable, setIsDraggable] = useState(false);

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // Diperlukan agar event drop bisa terpicu
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const reorderedSections = [...sections];
    const [draggedItem] = reorderedSections.splice(draggedIndex, 1);
    reorderedSections.splice(targetIndex, 0, draggedItem);

    if (setSections) {
      setSections(reorderedSections);
    }
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <section className="cb-card">
      <div className="cb-card-title">
        <i className="fa-solid fa-table-cells"></i>
        <span>Sections Halaman Beranda</span>
      </div>

      <div className="cb-section-grid">
        {sections.map((section, index) => {
          const isDragging = index === draggedIndex;
          return (
            <div
              className={`cb-section-box ${isDragging ? 'dragging' : ''}`}
              key={section.id}
              draggable={isDraggable}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              onDrop={(e) => handleDrop(e, index)}
            >
              <div
                className="cb-section-head"
                title="Seret untuk memindahkan"
                onMouseEnter={() => setIsDraggable(true)}
                onMouseLeave={() => setIsDraggable(false)}
              >
                <div className="cb-section-title-wrap">
                  <div className="cb-drag-handle">
                    <i className="fa-solid fa-grip-vertical"></i>
                  </div>
                  <label className="cb-field-label">Menu</label>
                </div>
                <button
                  className="cb-icon-btn cb-icon-btn-danger cb-section-delete"
                  title="Hapus section"
                  onMouseEnter={(e) => {
                    e.stopPropagation();
                    setIsDraggable(false);
                  }}
                  onMouseLeave={() => setIsDraggable(true)}
                  onClick={() => hapusSection(section.id)}
                >
                  <i className="fa-solid fa-trash"></i>
                </button>
              </div>

              <div className="cb-select-wrap">
                <select
                  className="cb-select"
                  value={section.menu}
                  onChange={(e) => updateSection(section.id, 'menu', e.target.value)}
                >
                  {menuOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                <i className="fa-solid fa-chevron-down cb-select-caret"></i>
              </div>

              <label className="cb-field-label">Judul Section</label>
              <input
                type="text"
                className="cb-input"
                value={section.judul}
                placeholder="Isi Judul Section Disini..."
                onChange={(e) => updateSection(section.id, 'judul', e.target.value)}
              />
            </div>
          );
        })}
      </div>

      <button className="cb-btn-dashed" onClick={tambahSection}>
        <i className="fa-solid fa-plus"></i> Tambah Section
      </button>
    </section>
  );
};

export default SectionOrderSetting;
