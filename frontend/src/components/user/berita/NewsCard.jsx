import React from 'react';
import { Link } from 'react-router-dom';
import './NewsCard.css';

const NewsCard = ({ title, date, link = "#", onMouseEnter, onFocus }) => {
  return (
    <Link
      to={link}
      className="news-item"
      onMouseEnter={onMouseEnter}
      onFocus={onFocus}
    >
      <div className="news-item-inner">
        <div className="white-curve"></div>
        <div className="news-text">
          <h4 className="news-title">{title}</h4>
          <span className="news-date">
            {date} &nbsp;<i className="fa-regular fa-clock"></i>
          </span>
        </div>
      </div>
    </Link>
  );
};

export default NewsCard;
