import React, { useState, useEffect, useRef, useCallback } from 'react';
import './NewsSection.css';
import NewsCard from './NewsCard';

// Import assets untuk data tiruan (mock data)
import PreviewBerita1Jpg from "../source/Preveiw-berita (1).jpg";
import PreviewBerita2 from "../source/Preveiw-berita (2).jpg";
import PreviewBerita3 from "../source/Preveiw-berita (3).jpg";

// Data tiruan untuk semua artikel berita. Nantinya ini bisa diambil dari API.
const allNewsData = [
    { id: 1, category: 'Berita', title: 'Awali Pekan dengan Semangat Melayani, BPMP Lampung Perkuat Budaya Kerja dan Kualitas Layanan', date: '15 Juni 2026', image: PreviewBerita1Jpg },
    { id: 2, category: 'Artikel', title: 'Pentingnya Digitalisasi Sekolah di Era Merdeka Belajar', date: '14 Juni 2026', image: PreviewBerita2 },
    { id: 3, category: 'Pengumuman', title: 'Jadwal Pelatihan Guru Penggerak Angkatan 12 Telah Dirilis', date: '13 Juni 2026', image: PreviewBerita3 },
    { id: 4, category: 'Berita', title: 'BPMP Lampung Kembali Raih Penghargaan Zona Integritas Wilayah Bebas Korupsi', date: '12 Juni 2026', image: PreviewBerita1Jpg },
    // Halaman 2
    { id: 5, category: 'Artikel', title: 'Strategi Jitu Peningkatan Mutu Pendidikan Dasar di Provinsi Lampung', date: '11 Juni 2026', image: PreviewBerita2 },
    { id: 6, category: 'Berita', title: 'Kolaborasi dengan Universitas Lampung untuk Riset Pendidikan Terapan', date: '10 Juni 2026', image: PreviewBerita3 },
    { id: 7, category: 'Pengumuman', title: 'Hasil Seleksi Administrasi Calon Fasilitator Program Sekolah Penggerak', date: '09 Juni 2026', image: PreviewBerita1Jpg },
    { id: 8, category: 'Berita', title: 'Workshop Implementasi Kurikulum Merdeka di Daerah Terpencil, Terluar, dan Tertinggal', date: '08 Juni 2026', image: PreviewBerita1Jpg },
];

const ITEMS_PER_PAGE = 4;
const AUTO_SLIDE_INTERVAL = 5000; // 5 detik

const NewsSection = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [paginatedNews, setPaginatedNews] = useState([]);
    const [featuredIndex, setFeaturedIndex] = useState(0);
    const intervalRef = useRef(null);

    const totalPages = Math.ceil(allNewsData.length / ITEMS_PER_PAGE);

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

    // Efek untuk memuat data berita saat halaman berubah
    useEffect(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        const currentNews = allNewsData.slice(startIndex, endIndex);

        setPaginatedNews(currentNews);

        if (currentNews.length > 0) {
            setFeaturedIndex(0);
        } else {
            setFeaturedIndex(0);
        }

        // Cleanup interval saat berpindah halaman
        return () => stopAutoSlide();
    }, [currentPage, stopAutoSlide]);

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
        }
    };

    const handlePageChange = (pageNumber) => {
        if (pageNumber < 1 || pageNumber > totalPages) return;
        setCurrentPage(pageNumber);
    };

    return (
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
                                style={{ transform: `translateX(${(index - featuredIndex) * 100}%)` }}
                            >
                                <img src={news.image} alt={news.title} className="featured-img" />
                                <div className="featured-overlay">
                                    <h3>{news.title}</h3>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="thumbnail-row">
                        {thumbnailNews.map(thumb => (
                            <img key={thumb.id} src={thumb.image} alt={`Thumbnail: ${thumb.title}`} className="thumb-img" />
                        ))}
                    </div>
                </div>

                <div className="news-divider"></div>

                <div className="news-right">
                    <h3 className="right-title">INFORMASI TERKINI</h3>

                    <div className="news-list">
                        {paginatedNews.map(news => (
                            <div key={news.id} onMouseEnter={() => handleSetFeatured(news)}>
                                <NewsCard category={news.category} title={news.title} date={news.date} />
                            </div>
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
    );
};

export default NewsSection;