import React from 'react';
import './GenericPage.css';
import DefaultContent from '../../../components/user/content-types/Default/DefaultContent';

const GenericPage = () => {
  return (
    <main className="generic-page-container">
      {/* 
        Wadah ini akan membungkus semua jenis konten dinamis.
        Styling seperti padding-top untuk memberi ruang dari Navbar,
        max-width untuk keterbacaan, dan margin untuk sentralisasi
        diatur dalam file GenericPage.css.
      */}
      <DefaultContent />
    </main>
  );
};

export default GenericPage;
