import { useState, useRef, useEffect } from 'react';
import './SectionOrderSetting.css';

const SectionOrderSetting = ({
  sections,
  setSections,
  updateSection,
  toggleSectionVisibility,
  menuOptions,
}) => {
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [isDraggable, setIsDraggable] = useState(false);
  const [editingId, setEditingId] = useState(null); // State to track which title is being edited
  const titleInputRef = useRef(null); // Ref to focus the input

  // Effect to auto-focus the input when editing starts
  useEffect(() => {
    if (editingId !== null && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [editingId]);

  const handleDragStart = (e, index) => {
    if (editingId !== null) {
      e.preventDefault();
      return;
    }
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

  // Handlers for the editable title
  const handleTitleClick = (sectionId) => {
    setIsDraggable(false); // Prevent dragging when trying to click
    setEditingId(sectionId);
  };

  const handleTitleBlur = () => {
    setEditingId(null);
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === 'Escape') {
      setEditingId(null);
    }
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
          const isEditingTitle = editingId === section.id;

          return (
            <div
              className={`cb-section-box ${isDragging ? 'dragging' : ''} ${
                !section.isVisible ? 'is-hidden' : ''
              }`}
              key={section.id}
              draggable={isDraggable && !isEditingTitle}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              onDrop={(e) => handleDrop(e, index)}
            >
              <div
                className="cb-section-head"
                title={!isEditingTitle ? 'Seret untuk memindahkan' : ''}
                onMouseEnter={() => !isEditingTitle && setIsDraggable(true)}
                onMouseLeave={() => setIsDraggable(false)}
              >
                <div className="cb-section-title-wrap">
                  <div className="cb-section-order-label">{index + 1}</div>
                  <div className="cb-drag-handle">
                    <i className="fa-solid fa-grip-vertical"></i>
                  </div>
                  {/* --- EDITABLE TITLE LOGIC --- */}
                  {isEditingTitle ? (
                    <input
                      ref={titleInputRef}
                      type="text"
                      className="cb-section-title-input"
                      value={section.judul}
                      placeholder="Masukan Judul Section"
                      onChange={(e) => updateSection(section.id, 'judul', e.target.value)}
                      onBlur={handleTitleBlur}
                      onKeyDown={handleTitleKeyDown}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span
                      className={`cb-section-title-display ${!section.judul ? 'placeholder' : ''}`}
                      onClick={() => handleTitleClick(section.id)}
                    >
                      {section.judul || 'Masukan Judul Section'}
                    </span>
                  )}
                </div>
                <button
                  className={`cb-icon-btn cb-section-visibility ${!section.isVisible ? 'is-off' : ''}`}
                  title={section.isVisible ? 'Sembunyikan section' : 'Tampilkan section'}
                  onMouseEnter={(e) => {
                    e.stopPropagation();
                    setIsDraggable(false);
                  }}
                  onMouseLeave={() => !isEditingTitle && setIsDraggable(true)}
                  onClick={() => toggleSectionVisibility(section.id)}
                >
                  <i className={`fa-solid ${section.isVisible ? 'fa-eye' : 'fa-eye-slash'}`}></i>
                </button>
              </div>

              <label className="cb-field-label">Menu</label>
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
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default SectionOrderSetting;
