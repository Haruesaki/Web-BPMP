import React from 'react';
import './GenericPage.css';
import CardContent from '../../../components/user/content-types/CardProfile/CardContent';
import DefaultContent from '../../../components/user/content-types/Default/DefaultContent';
import NewsCardContent from '../../../components/user/content-types/CardBerita/NewsCardContent';

const GenericPage = () => {
  return (
    <main className="generic-page-container">
      <CardContent/>
      <NewsCardContent/>
      {/* <DefaultContent/> */}
    </main>
  );
};

export default GenericPage;
