import React, { useState, useEffect } from 'react';
import './NewsSection.css';
import NewsCard from './NewsCard';

// Import assets untuk data tiruan (mock data)
import PreviewBerita1Jpg from "../source/Preveiw-berita (1).jpg";
import PreviewBerita2 from "../source/Preveiw-berita (2).jpg";
import PreviewBerita3 from "../source/Preveiw-berita (3).jpg";
import FotoInstagram1 from "../source/Foto-Instagram-1.png";
import FotoInstagram2 from "../source/Foto-Instagram-2.png";
import FotoInstagram3 from "../source/Foto-Instagram-3.png";
import FotoInstagram4 from "../source/Foto-Instagram-4.png";

// Data tiruan untuk semua artikel berita. Nantinya ini bisa diambil dari API.
const allNewsData = [
    { id: 1, category: 'Berita', title: 'Awali Pekan dengan Semangat Melayani, BPMP Lampung Perkuat Budaya Kerja dan Kualitas Layanan', date: '15 Juni 2026', image: PreviewBerita1Jpg },
    { id: 2, category: 'Artikel', title: 'Pentingnya Digitalisasi Sekolah di Era Merdeka Belajar', date: '14 Juni 2026', image: PreviewBerita2 },
    { id: 3, category: 'Pengumuman', title: 'Jadwal Pelatihan Guru Penggerak Angkatan 12 Telah Dirilis', date: '13 Juni 2026', image: PreviewBerita3 },
    { id: 4, category: 'Berita', title: 'BPMP Lampung Kembali Raih Penghargaan Zona Integritas Wilayah Bebas Korupsi', date: '12 Juni 2026', image: FotoInstagram1 },
    // Halaman 2
    { id: 5, category: 'Artikel', title: 'Strategi Jitu Peningkatan Mutu Pendidikan Dasar di Provinsi Lampung', date: '11 Juni 2026', image: FotoInstagram2 },
    { id: 6, category: 'Berita', title: 'Kolaborasi dengan Universitas Lampung untuk Riset Pendidikan Terapan', date: '10 Juni 2026', image: FotoInstagram3 },
    { id: 7, category: 'Pengumuman', title: 'Hasil Seleksi Administrasi Calon Fasilitator Program Sekolah Penggerak', date: '09 Juni 2026', image: FotoInstagram4 },
    { id: 8, category: 'Berita', title: 'Workshop Implementasi Kurikulum Merdeka di Daerah Terpencil, Terluar, dan Tertinggal', date: '08 Juni 2026', image: PreviewBerita1Jpg },
];

const ITEMS_PER_PAGE = 4;

const NewsSection = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [featuredNews, setFeaturedNews] = useState(null);
    const [paginatedNews, setPaginatedNews] = useState([]);
    const [thumbnailNews, setThumbnailNews] = useState([]);

    const totalPages = Math.ceil(allNewsData.length / ITEMS_PER_PAGE);

    // Efek untuk memperbarui berita saat halaman berubah
    useEffect(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        const currentNews = allNewsData.slice(startIndex, endIndex);
        
        setPaginatedNews(currentNews);
        
        if (currentNews.length > 0) {
            // Atur item pertama sebagai pratinjau utama (default)
            setFeaturedNews(currentNews[0]);
            // Atur sisanya sebagai thumbnail
            setThumbnailNews(currentNews.slice(1, 4));
        }
    }, [currentPage]);

    // Fungsi untuk mengubah pratinjau utama saat mouse hover di daftar berita
    const handleSetFeatured = (newsItem) => {
        if (featuredNews && featuredNews.id === newsItem.id) return; // Jangan render ulang jika itemnya sama
        setFeaturedNews(newsItem);
        // Perbarui thumbnail dengan item lain di halaman yang sama
        const otherNews = paginatedNews.filter(item => item.id !== newsItem.id);
        setThumbnailNews(otherNews.slice(0, 3));
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

            <div className="news-grid">
                <div className="news-left">
                    {featuredNews && (
                        <div className="featured-card">
                            <img src={featuredNews.image} alt={featuredNews.title} className="featured-img" />
                            <div className="featured-overlay">
                                <h3>{featuredNews.title}</h3>
                            </div>
                        </div>
                    )}

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