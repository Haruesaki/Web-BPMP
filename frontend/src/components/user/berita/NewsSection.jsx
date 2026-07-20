import React, { useState, useEffect, useRef, useCallback } from 'react';
import './NewsSection.css';
import NewsCard from './NewsCard';
import axiosInstance from '../../../api/axiosInstance';

const ITEMS_PER_PAGE = 4;
const AUTO_SLIDE_INTERVAL = 5000; // 5 detik

const NewsSection = () => {
    const [allNewsData, setAllNewsData] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [paginatedNews, setPaginatedNews] = useState([]);
    const [featuredIndex, setFeaturedIndex] = useState(0);
    const intervalRef = useRef(null);

    const totalPages = Math.max(1, Math.ceil(allNewsData.length / ITEMS_PER_PAGE));

    // State turunan: Dapatkan berita unggulan dan thumbnail dari state utama
    const featuredNews = paginatedNews[featuredIndex] || null;
    const thumbnailNews = paginatedNews.filter((_, index) => index !== featuredIndex).slice(0, 3);

    // Fungsi untuk menghentikan auto-slide
    const stopAutoSlide = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);
    
    // Fungsi untuk memulai auto-slide
    const startAutoSlide = useCallback(() => {
        stopAutoSlide(); // Hentikan dulu untuk menghindari duplikasi interval
        if (paginatedNews.length <= 1) return;

        intervalRef.current = setInterval(() => {
            setFeaturedIndex(prevIndex => (prevIndex + 1) % paginatedNews.length);
        }, AUTO_SLIDE_INTERVAL);
    }, [paginatedNews.length, stopAutoSlide]);

    // Efek untuk memuat data dari API
    useEffect(() => {
        const fetchNews = async () => {
            try {
                const res = await axiosInstance.get('/api/beranda/berita');
                if (res.data?.success) {
                    const fetchedData = res.data.data.map(item => ({
                        id: item.id,
                        category: item.kategori || 'Informasi',
                        title: item.judul,
                        date: new Date(item.tanggal).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }),
                        image: item.coverUrl || '' // Kita bisa kasih fallback image jika perlu
                    }));
                    setAllNewsData(fetchedData);
                }
            } catch (err) {
                console.error("Gagal mengambil data berita:", err);
            }
        };
        fetchNews();
    }, []);

    // Efek untuk memuat data berita saat halaman berubah
    useEffect(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        const currentNews = allNewsData.slice(startIndex, endIndex);

        setPaginatedNews(currentNews);

        setFeaturedIndex(0);

        // Cleanup interval saat berpindah halaman
        return () => stopAutoSlide();
    }, [currentPage, allNewsData, stopAutoSlide]);

    // Efek untuk memulai/menghentikan auto-slide saat data berubah
    useEffect(() => {
        startAutoSlide();
        return () => stopAutoSlide();
    }, [paginatedNews, startAutoSlide]);

    // Fungsi untuk mengubah pratinjau utama saat di-hover secara manual
    const handleSetFeatured = (newsItem) => {
        const newIndex = paginatedNews.findIndex(item => item.id === newsItem.id);
        if (newIndex !== -1 && newIndex !== featuredIndex) {
            setFeaturedIndex(newIndex);
            startAutoSlide(); // Reset timer saat interaksi manual
        }
    };

    const handlePageChange = (pageNumber) => {
        if (pageNumber < 1 || pageNumber > totalPages) return;
        setCurrentPage(pageNumber);
    };

    return (
        <section className="container-news-section"> 
        <section className="news-section">
            <div className="news-header-bar">
                <h2>BERITA TERKINI</h2>
            </div>

            <div 
                className="news-grid"
                onMouseEnter={stopAutoSlide}
                onMouseLeave={startAutoSlide}
            >
                <div className="news-left">
                    <div className="featured-card-wrapper">
                        {paginatedNews.map((news, index) => (
                            <div
                                className="featured-card"
                                key={news.id}
                                style={{ 
                                    transform: `translateX(${(index - featuredIndex) * 100}%)`,
                                    border: news.image ? undefined : 'none',
                                    backgroundColor: news.image ? undefined : 'transparent',
                                    boxShadow: news.image ? undefined : 'none'
                                }}
                            >
                                {news.image ? (
                                    <>
                                        <img src={news.image} alt={news.title} className="featured-img" />
                                        <div className="featured-overlay">
                                            <h3>{news.title}</h3>
                                        </div>
                                    </>
                                ) : null}
                            </div>
                        ))}
                    </div>

                    <div className="thumbnail-row">
                        {thumbnailNews.map(thumb => (
                            thumb.image ? (
                                <img
                                    key={thumb.id}
                                    src={thumb.image}
                                    alt={`Thumbnail: ${thumb.title}`}
                                    className="thumb-img"
                                    onMouseEnter={() => handleSetFeatured(thumb)}
                                    onClick={() => handleSetFeatured(thumb)}
                                    onFocus={() => handleSetFeatured(thumb)} 
                                    tabIndex="0"
                                    role="button" 
                                />
                            ) : null
                        ))}
                    </div>
                </div>

                <div className="news-divider"></div>

                <div className="news-right">
                    <h3 className="right-title">INFORMASI TERKINI</h3>

                    <div className="news-list">
                        {paginatedNews.map(news => (
                            <NewsCard
                                key={news.id}
                                category={news.category}
                                title={news.title}
                                date={news.date}
                                onMouseEnter={() => handleSetFeatured(news)}
                                onFocus={() => handleSetFeatured(news)} // Prop onFocus untuk aksesibilitas
                            />
                        ))}
                    </div>

                    <div className="pagination">
                        <button className="page-arrow" aria-label="Previous" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
                            <i className="fa-solid fa-chevron-left"></i>
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(num => (
                            <button key={num} className={`page-num ${currentPage === num ? 'active' : ''}`} onClick={() => handlePageChange(num)}>
                                {num}
                            </button>
                        ))}
                        <button className="page-arrow" aria-label="Next" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
                            <i className="fa-solid fa-chevron-right"></i>
                        </button>
                    </div>
                </div>
            </div>
        </section>
        </section>
    );
};

export default NewsSection;
