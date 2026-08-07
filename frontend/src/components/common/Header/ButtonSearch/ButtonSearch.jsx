import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../../../api/axiosInstance';
import './ButtonSearch.css';

const ButtonSearch = () => {
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchError, setSearchError] = useState(null);

  const searchContainerRef = useRef(null);
  const searchInputRef = useRef(null);

  const [isTapped, setIsTapped] = useState(false);
  const tapTimeoutRef = useRef(null);

  const handleSearchToggle = (e) => {
    if (e) e.preventDefault();
    
    // Deteksi touchscreen untuk tap-feedback
    const isTouchScreen = window.matchMedia("(hover: none)").matches;
    if (isTouchScreen) {
      if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);

      setIsTapped(true);
      tapTimeoutRef.current = setTimeout(() => {
        setIsTapped(false);
      }, 1000);
    }

    setIsSearchActive(!isSearchActive);
    if (!isSearchActive && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current.focus();
      }, 300);
    } else {
      setShowSuggestions(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    if (searchQuery.trim().length === 0) {
      setSearchResults([]);
      setShowSuggestions(false);
      setIsSearching(false);
      return;
    }

    setShowSuggestions(true);
    setIsSearching(true);
    setSearchError(null);

    const searchHandler = setTimeout(async () => {
      try {
        const response = await axiosInstance.get(
          `/api/search?q=${encodeURIComponent(searchQuery)}`,
          { signal }
        );
        const backendResults = response.data.data || [];
        
        const filteredResults = backendResults.filter(result => {
          // Abaikan HANYA jika item tersebut adalah Menu Induk Utama (induk_id null/falsy)
          const isMainMenu = result.type === 'Menu' && !result.induk_id;
          if (isMainMenu) return false;
          
          // Memastikan pencarian berdasarkan judul aman dari nilai NULL di database
          const titleSafe = result.title || '';
          return titleSafe.toLowerCase().includes(searchQuery.toLowerCase());
        });
        
        setSearchResults(filteredResults);

      } catch (error) {
        if (error.name !== 'CanceledError') {
          console.error('Search error:', error);
          setSearchError('Gagal melakukan pencarian.');
        }
      } finally {
        if (!signal.aborted) {
          setIsSearching(false);
        }
      }
    }, 400);

    return () => {
      clearTimeout(searchHandler);
      controller.abort();
    };
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsSearchActive(false);
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
    };
  }, []);

  const getHighlightedText = (text, highlight) => {
    if (!highlight.trim() || !text) {
      return text || '';
    }
    const escapedHighlight = highlight.replace(/[-\/\^$*+?.()|[\]{}]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escapedHighlight})`, 'gi'));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === highlight.toLowerCase() ? (
            <strong key={i} className="highlighted-text">
              {part}
            </strong>
          ) : (
            part
          )
        )}
      </>
    );
  };

  return (
    <div className="search-container" style={{ position: 'relative', display: 'flex', alignItems: 'center' }} ref={searchContainerRef}>
      <div className={`search-wrapper ${isSearchActive ? 'active' : ''}`}>
        <input
          type="text"
          className="search-input"
          placeholder="Cari informasi..."
          maxLength={100} // Pengaman UI: Batasi panjang kueri untuk mencegah browser hang/lagging
          autoComplete="off" // Pengaman Privasi: Mencegah kebocoran riwayat pencarian di komputer publik
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          ref={searchInputRef}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onClick={() => { if (searchQuery.trim().length > 0) setShowSuggestions(true); }}
        />
         <button 
          className={`search-trigger ${isTapped ? 'hover-active' : ''}`} 
          aria-label="Pencarian" 
          onClick={handleSearchToggle}
        >
          <i className="fa-solid fa-magnifying-glass"></i>
        </button>
      </div>

      {showSuggestions && (
        <div 
          className="search-suggestions-dropdown"
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          {searchError ? (
            <div className="search-suggestion-item empty" style={{ color: 'red' }}>Error: {searchError}</div>
          ) : isSearching ? (
            <div className="search-skeleton-group">
              {[...Array(3)].map((_, i) => (
                <div 
                  key={i} 
                  className="search-suggestion-item skeleton"
                  style={{ '--skeleton-delay': `${i * 0.15}s` }}
                >
                  <div className="skeleton-line title"></div>
                  <div className="skeleton-line meta"></div>
                </div>
              ))}
            </div>
          ) : searchResults.length > 0 ? (
            searchResults.map((result, idx) => (
              <Link 
                key={idx} 
                to={result.path} 
                className="search-suggestion-item"
                style={{ '--animation-delay': `${idx * 0.07}s` }}
                onClick={() => {
                  setIsSearchActive(false);
                  setShowSuggestions(false);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
              >
                <div className="search-suggestion-title">
                  {getHighlightedText(result.title, searchQuery)}
                </div>
                {(result.menu_location || result.submenu_location) && (
                  <div className="search-suggestion-meta">
                    {result.menu_location && (
                      <div className="location-row">
                        <span className="location-label">Menu :</span>
                        <span className="location-value menu">{result.menu_location}</span>
                      </div>
                    )}
                    {result.submenu_location && (
                      <div className="location-row">
                        <span className="location-label">SubMenu :</span>
                        <span className="location-value submenu">{result.submenu_location}</span>
                      </div>
                    )}
                  </div>
                )}
              </Link>
            ))
          ) : (
            <div className="search-suggestion-item empty">
              Data Tidak Ditemukan.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ButtonSearch;
