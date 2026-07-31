import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './NewsSection.css';
import NewsCard from './NewsCard';
import axiosInstance from '../../../api/axiosInstance';

const ITEMS_PER_PAGE = 4;
const AUTO_SLIDE_INTERVAL = 5000; // 5 detik

const NewsSection = ({ previewData }) => {
    const navigate = useNavigate();
    const [allNewsData, setAllNewsData] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [paginatedNews, setPaginatedNews] = useState([]);
    const [featuredIndex, setFeaturedIndex] = useState(0);
    const intervalRef = useRef(null);

    const totalPages = Math.max(1, Math.ceil(allNewsData.length / ITEMS_PER_PAGE));

    // Hanya berita YANG PUNYA GAMBAR yang boleh tampil sebagai featured.
    // Berita tanpa gambar tidak ikut di-slide agar area featured tidak pernah kosong.
    const featurableIndexes = useMemo(
        () => paginatedNews.reduce((acc, news, index) => (news.image ? [...acc, index] : acc), []),
        [paginatedNews]
    );

    // Thumbnail: saring yang bergambar DULU, baru ambil 3 — agar jumlahnya konsisten.
    const thumbnailNews = paginatedNews
        .filter((news, index) => index !== featuredIndex && news.image)
        .slice(0, 3);

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
        // Hanya berputar di antara berita bergambar.
        if (featurableIndexes.length <= 1) return;

        intervalRef.current = setInterval(() => {
            setFeaturedIndex(prevIndex => {
                const pos = featurableIndexes.indexOf(prevIndex);
                const nextPos = (pos + 1) % featurableIndexes.length;
                return featurableIndexes[nextPos];
            });
        }, AUTO_SLIDE_INTERVAL);
    }, [featurableIndexes, stopAutoSlide]);

    // Efek untuk memuat data dari API atau preview
    useEffect(() => {
        if (previewData) {
            const formattedPreview = previewData.map(item => ({
                id: item.id,
                menuId: item.menu_id,
                category: item.kategori || 'Informasi',
                title: item.judul,
                date: new Date(item.tanggal).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }),
                image: item.coverUrl || ''
            }));
            setAllNewsData(formattedPreview);
            return;
        }

        const fetchNews = async () => {
            try {
                const res = await axiosInstance.get('/api/beranda/berita');
                if (res.data?.success) {
                    const fetchedData = res.data.data.map(item => ({
                        id: item.id,
                        menuId: item.menu_id,
                        category: item.kategori || 'Informasi',
                        title: item.judul,
                        date: new Date(item.tanggal).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }),
                        image: item.coverUrl || ''
                    }));
                    setAllNewsData(fetchedData);
                }
            } catch (err) {
                console.error("Gagal mengambil data berita:", err);
            }
        };
        fetchNews();
    }, [previewData]);

    // Efek untuk memuat data berita saat halaman berubah
    useEffect(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        const currentNews = allNewsData.slice(startIndex, endIndex);

        setPaginatedNews(currentNews);

        // Mulai dari berita bergambar pertama, bukan selalu indeks 0 — agar
        // area featured tidak kosong saat berita pertama tak punya gambar.
        const firstWithImage = currentNews.findIndex(news => news.image);
        setFeaturedIndex(firstWithImage === -1 ? 0 : firstWithImage);

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
        // Abaikan berita tanpa gambar: pratinjau tetap pada gambar terakhir,
        // tidak berpindah ke kartu kosong.
        if (!newsItem.image) return;

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

    // Daftar nomor halaman ringkas (pakai "…") agar tidak meluber saat
    // halaman banyak — pola sama seperti tabel di panel admin.
    const buildPageList = () => {
        if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
        const pages = new Set([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);
        const sorted = [...pages].filter(p => p >= 1 && p <= totalPages).sort((a, b) => a - b);
        const result = [];
        let prev = 0;
        for (const p of sorted) {
            if (prev && p - prev > 1) result.push('...');
            result.push(p);
            prev = p;
        }
        return result;
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
                    {/* Hanya render kartu bergambar — tak ada lagi "sisa pembungkus" kosong. */}
                    {featurableIndexes.length > 0 && (
                        <div className="featured-card-wrapper">
                            {paginatedNews.map((news, index) => (
                                news.image ? (
                                    <div
                                        className="featured-card"
                                        key={news.id}
                                        style={{ transform: `translateX(${(index - featuredIndex) * 100}%)`, cursor: 'pointer' }}
                                        onClick={() => news.menuId && navigate(`/halaman/${news.menuId}#content-${news.id}`)}
                                    >
                                        <img src={news.image} alt={news.title} className="featured-img" loading="lazy" decoding="async" />
                                        <div className="featured-overlay">
                                            {/* title: judul utuh saat hover, karena teks dipotong "…" */}
                                            <h3 title={news.title}>{news.title}</h3>
                                        </div>
                                    </div>
                                ) : null
                            ))}
                        </div>
                    )}

                    {thumbnailNews.length > 0 && (
                        <div className="thumbnail-row">
                            {thumbnailNews.map(thumb => (
                                // Wadah statis: ukuran & rasio tetap, tidak bergantung
                                // jumlah thumbnail. Gambar hanya mengisi wadah ini.
                                <div
                                    key={thumb.id}
                                    className="thumb-item"
                                    onMouseEnter={() => handleSetFeatured(thumb)}
                                    onClick={() => handleSetFeatured(thumb)}
                                    onFocus={() => handleSetFeatured(thumb)}
                                    tabIndex="0"
                                    role="button"
                                    aria-label={`Tampilkan pratinjau: ${thumb.title}`}
                                >
                                    <img
                                        src={thumb.image}
                                        alt={`Thumbnail: ${thumb.title}`}
                                        className="thumb-img"
                                        loading="lazy"
                                        decoding="async"
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="news-divider"></div>

                <div className="news-right">
                    <h3 className="right-title">INFORMASI TERKINI</h3>

                    <div className="news-list">
                        {paginatedNews.map(news => (
                            <NewsCard
                                key={news.id}
                                title={news.title}
                                date={news.date}
                                link={news.menuId ? `/halaman/${news.menuId}#content-${news.id}` : '#'}
                                onMouseEnter={() => handleSetFeatured(news)}
                                onFocus={() => handleSetFeatured(news)} // Prop onFocus untuk aksesibilitas
                            />
                        ))}
                    </div>

                    <div className="pagination">
                        <button className="page-arrow" aria-label="Previous" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
                            <i className="fa-solid fa-chevron-left"></i>
                        </button>
                        {buildPageList().map((num, idx) => (
                            num === '...' ? (
                                <span key={`dots-${idx}`} className="page-dots">…</span>
                            ) : (
                                <button key={num} className={`page-num ${currentPage === num ? 'active' : ''}`} onClick={() => handlePageChange(num)}>
                                    {num}
                                </button>
                            )
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
