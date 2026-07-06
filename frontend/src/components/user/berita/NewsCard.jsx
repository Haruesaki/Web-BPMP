import React from 'react';
import './NewsCard.css';

const NewsCard = ({ category, title, date, link = "#" }) => {
  return (
    <a href={link} className="news-item">
      <div className="white-curve"></div>
      <div className="news-text">
        <span className="news-category">| {category}</span>
        <h4 className="news-title">{title}</h4>
        <span className="news-date">
          {date} &nbsp;<i className="fa-regular fa-clock"></i>
        </span>
      </div>
    </a>
  );
};

export default NewsCard;
