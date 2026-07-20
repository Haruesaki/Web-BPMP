import React from 'react';
import { createPortal } from 'react-dom';
import './CustomAlert.css';

// types: 'info', 'success', 'warning', 'error', 'confirm'
const CustomAlert = ({ 
  isOpen, 
  type = 'info', 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = 'Oke', 
  cancelText = 'Batal' 
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch(type) {
      case 'success': return <i className="fa-solid fa-circle-check ca-icon-success"></i>;
      case 'error': return <i className="fa-solid fa-circle-xmark ca-icon-error"></i>;
      case 'warning': return <i className="fa-solid fa-triangle-exclamation ca-icon-warning"></i>;
      case 'confirm': return <i className="fa-regular fa-circle-question ca-icon-confirm"></i>;
      default: return <i className="fa-solid fa-circle-info ca-icon-info"></i>;
    }
  };

  // Provide a default title based on type if not supplied
  const getDefaultTitle = () => {
    if (title) return title;
    switch(type) {
      case 'success': return 'Berhasil';
      case 'error': return 'Terjadi Kesalahan';
      case 'warning': return 'Peringatan';
      case 'confirm': return 'Konfirmasi';
      default: return 'Informasi';
    }
  };

  return createPortal(
    <div className="ca-overlay">
      <div className={`ca-modal ca-${type}`}>
        <div className="ca-icon-wrapper">
          {getIcon()}
        </div>
        <div className="ca-content">
          <h3 className="ca-title">{getDefaultTitle()}</h3>
          <p className="ca-message">{message}</p>
        </div>
        <div className="ca-actions">
          {type === 'confirm' && (
            <button className="ca-btn ca-btn-cancel" onClick={onCancel}>{cancelText}</button>
          )}
          <button className={`ca-btn ca-btn-${type}`} onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CustomAlert;
