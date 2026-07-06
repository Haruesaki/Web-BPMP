import React from 'react';
import './GenericPage.css';
import DefaultContent from '../../../components/user/content-types/Default/DefaultContent';

const GenericPage = () => {
  return (
    <main className="generic-page-container">
      <DefaultContent />
      <DefaultContent />
    </main>
  );
};

export default GenericPage;
