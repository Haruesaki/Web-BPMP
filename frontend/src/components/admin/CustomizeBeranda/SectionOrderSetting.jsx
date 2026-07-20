import { useState } from 'react';
import LogoMitraSectionForm from './LogoMitraSectionForm';
import InstagramSectionForm from './InstagramSectionForm';
import YouTubeSectionNotice from './YouTubeSectionNotice';
import './SectionOrderSetting.css';

const SectionOrderSetting = ({
  sections,
  setSections,
  updateSection,
  toggleSectionVisibility,
  menuOptions,
  mitraList,
  setMitraList,
}) => {
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [isDraggable, setIsDraggable] = useState(false);

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
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
        <span>Urutan Sections Beranda</span>
      </div>

      <div className="cb-section-grid">
        {sections.map((section, index) => {
          const isDragging = index === draggedIndex;

          return (
            <div
              className={`cb-section-box ${isDragging ? 'dragging' : ''} ${
                !section.isVisible ? 'is-hidden' : ''
              }`}
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
                  <div className="cb-section-order-label">{index + 1}</div>
                  <div className="cb-drag-handle">
                    <i className="fa-solid fa-grip-vertical"></i>
                  </div>
                  <span className="cb-section-title-display" style={{ cursor: 'default' }}>
                    {section.menu}
                  </span>
                </div>
                <button
                  className={`cb-icon-btn cb-section-visibility ${!section.isVisible ? 'is-off' : ''}`}
                  title={section.isVisible ? 'Sembunyikan section' : 'Tampilkan section'}
                  onMouseEnter={(e) => {
                    e.stopPropagation();
                    setIsDraggable(false);
                  }}
                  onMouseLeave={() => setIsDraggable(true)}
                  onClick={() => toggleSectionVisibility(section.id)}
                >
                  <i className={`fa-solid ${section.isVisible ? 'fa-eye' : 'fa-eye-slash'}`}></i>
                </button>
              </div>
              
              {/* --- KONDISIONAL FORM --- */}
              <div className="cb-section-form-wrapper">
                {section.menu === 'Logo Mitra' && (
                  <LogoMitraSectionForm 
                    mitraList={mitraList} 
                    setMitraList={setMitraList} 
                  />
                )}

                {section.menu === 'Preview Media Sosial Instagram' && (
                  <InstagramSectionForm />
                )}

                {section.menu === 'Preview Media Sosial YouTube' && (
                  <YouTubeSectionNotice />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default SectionOrderSetting;
