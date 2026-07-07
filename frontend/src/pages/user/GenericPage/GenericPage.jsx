import React from 'react';
import './GenericPage.css';
import CardContent from '../../../components/user/content-types/CardProfile/CardContent';
import DefaultContent from '../../../components/user/content-types/Default/DefaultContent';

const GenericPage = () => {
  return (
    <main className="generic-page-container">
      <CardContent/>
      {/* <DefaultContent/> */}
    </main>
  );
};

export default GenericPage;
