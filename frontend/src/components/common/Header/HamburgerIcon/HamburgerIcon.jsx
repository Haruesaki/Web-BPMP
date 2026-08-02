import React from 'react';
import './HamburgerIcon.css';

const HamburgerIcon = ({ onClick }) => {
  return (
    <button className="hamburger-icon" onClick={onClick} aria-label="Buka menu">
      <i className="fa-solid fa-bars"></i>
    </button>
  );
};

export default HamburgerIcon;
