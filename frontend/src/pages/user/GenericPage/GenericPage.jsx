import React from 'react';
import CardContent from '../../../components/user/content-types/CardProfile/CardContent';
import NewsCardContent from '../../../components/user/content-types/CardBerita/NewsCardContent';
import "./GenericPage.css"

const GenericPage = () => {
  return (
    <div className="generic-page-container">
      <CardContent />
      <NewsCardContent/>
    </div>
  );
};

export default GenericPage;
