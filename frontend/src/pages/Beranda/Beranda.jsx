import React, { useEffect, useState, useRef } from 'react';
import './Beranda.css';

// --- IMPORT ASSETS (Logo & Background) ---
import Logo from "../../assets/source/Logo.png";
import BackgroundLanding from "../../assets/source/Section-Landing.png";

// --- IMPORT ASSETS (Icons & Social Media) ---
import Facebook from "../../assets/source/facebook.png";
import Instagram from "../../assets/source/instagram.png";
import Youtube from "../../assets/source/youtube.png"; // PERBAIKAN: Menambahkan import Youtube
import Dropdown from "../../assets/source/Dropdown.png";
import Social from "../../assets/source/social.png"; // Asumsi ini icon Whatsapp
import IconSearch from "../../assets/source/Ikon-Search.png";
import IconTextToSpeech from "../../assets/source/Ikon-TextToSpeech.png";

// --- IMPORT ASSETS (Mitra) ---
import Mitra1Jpg from "../../assets/source/Mitra (1).jpg";
import Mitra1Png from "../../assets/source/Mitra (1).png";
import Mitra2 from "../../assets/source/Mitra (2).png";
import Mitra3 from "../../assets/source/Mitra (3).png";
import Mitra4 from "../../assets/source/Mitra (4).png";
import Mitra5 from "../../assets/source/Mitra (5).png";


// === TAMBAHKAN IMPORT INI UNTUK SECTION INSTAGRAM ===
import FotoInstagram1 from "../../assets/source/Foto-Instagram-1.png";
import FotoInstagram2 from "../../assets/source/Foto-Instagram-2.png";
import FotoInstagram3 from "../../assets/source/Foto-Instagram-3.png";
import FotoInstagram4 from "../../assets/source/Foto-Instagram-4.png";
import ButtonFollowIG from "../../assets/source/Button-Follow-Instagram.png";

// --- IMPORT ASSETS (Berita) ---
import PreviewBerita1Jpg from "../../assets/source/Preveiw-berita (1).jpg";
// Gunakan yang beresolusi JPG sesuai data yang ada
import PreviewBerita2 from "../../assets/source/Preveiw-berita (2).jpg";
import PreviewBerita3 from "../../assets/source/Preveiw-berita (3).jpg";




const Beranda = ({ lenisRef }) => {
  // --- 1. STATE & REF UNTUK FITUR SEARCH ---
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isProfileDropdownLocked, setIsProfileDropdownLocked] = useState(false);
  const searchWrapperRef = useRef(null);
  const searchInputRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const [typedText, setTypedText] = useState('');
  const [showSubtitle, setShowSubtitle] = useState(false);
  const fullText = "Balai Penjaminan Mutu Pendidikan Provinsi Lampung";

  // --- REF UNTUK ANIMASI MITRA (TAMBAHKAN INI) ---
  const trackRef = useRef(null);
  const partnersSectionRef = useRef(null);
  const heroImageRef = useRef(null);

  // --- ARRAY LOGO MITRA (TAMBAHKAN INI) ---
  // Mengelompokkan logo agar mudah di-map dan diduplikasi secara natural oleh React
  const mitraList = [Mitra1Jpg, Mitra5, Mitra2, Mitra3, Mitra1Png, Mitra4];

  // Fungsi untuk handle klik tombol search
  const handleSearchToggle = (e) => {
    e.preventDefault();
    setIsSearchActive(!isSearchActive);
  };

  // Effect khusus untuk "Klik di luar search bar agar menutup" dan Auto-focus
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Jika klik terjadi di luar komponen searchWrapper, matikan state active
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target)) {
        setIsSearchActive(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    // Auto focus ke input saat search terbuka
    if (isSearchActive && searchInputRef.current) {
      searchInputRef.current.focus();
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSearchActive]);

  // --- DROPDOWN LOCK: Tutup dropdown Profil saat klik di luar ---
  useEffect(() => {
    if (!isProfileDropdownLocked) return;

    const handleClickOutsideProfile = (event) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target)
      ) {
        setIsProfileDropdownLocked(false);
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutsideProfile);
    }, 50);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutsideProfile);
    };
  }, [isProfileDropdownLocked]);

  // --- DROPDOWN LOCK: Tutup dropdown Profil saat scroll ---
  useEffect(() => {
    if (!isProfileDropdownLocked) return;

    const lenis = lenisRef?.current;

    const handleScroll = () => {
      setIsProfileDropdownLocked(false);
    };

    if (lenis) {
      lenis.on('scroll', handleScroll, { passive: true });
      return () => lenis.off('scroll', handleScroll);
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isProfileDropdownLocked, lenisRef]);

  const handleProfileClick = (e) => {
    e.preventDefault();
    setIsProfileDropdownLocked((prev) => !prev);
  };

  useEffect(() => {

    /* =========================================================
       2. NAVIGASI NAVBAR (SMOOTH SELECTOR)
       ========================================================= */
    const navbar = document.querySelector('.main-navbar');
    const selector = document.querySelector('.nav-selector');
    const navLinks = document.querySelectorAll(
      '.main-navbar > .nav-link, .main-navbar .nav-item > .nav-link'
    );

    if (navbar && selector) {
      function moveSelector(targetElement) {
        const targetRect = targetElement.getBoundingClientRect();
        const navbarRect = navbar.getBoundingClientRect();
        const leftPos = targetRect.left - navbarRect.left;
        const topPos = targetRect.top - navbarRect.top;

        selector.style.width = `${targetRect.width}px`;
        selector.style.height = `${targetRect.height}px`;
        selector.style.transform = `translate(${leftPos}px, ${topPos}px)`;
      }

      const initialActive = document.querySelector('.nav-link.active');
      if (initialActive) {
        requestAnimationFrame(() => moveSelector(initialActive));
      }

      navLinks.forEach((link) => {
        link.addEventListener('click', function (e) {
          navLinks.forEach((item) => item.classList.remove('active'));
          this.classList.add('active');
          moveSelector(this);
        });
      });

      const dropdownLinks = document.querySelectorAll('.dropdown-menu a');
      dropdownLinks.forEach((subLink) => {
        subLink.addEventListener('click', function (e) {
          const parentNavItem = this.closest('.nav-item');
          if (parentNavItem) {
            const parentNavLink = parentNavItem.querySelector('.nav-link');
            if (parentNavLink) {
              navLinks.forEach((item) => item.classList.remove('active'));
              parentNavLink.classList.add('active');
              moveSelector(parentNavLink);
            }
          }
        });
      });

      let resizeTimer;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          const currentActive = document.querySelector('.nav-link.active');
          if (currentActive) moveSelector(currentActive);
        }, 100);
      });
    }

    /* =========================================================
       3. ANIMASI BERITA (FRAME SLIDE & SCALE UP)
       ========================================================= */
    const newsLeft = document.querySelector('.news-left');
    const featuredCard = document.querySelector('.featured-card');
    const featuredImg = document.querySelector('.featured-img');
    const titleEl = document.querySelector('.featured-overlay h3');
    const thumbnails = document.querySelectorAll('.thumb-img');

    // Mencegah double interval saat strict mode react
    let newsInterval;

    if (newsLeft && featuredCard && featuredImg && titleEl) {
      newsLeft.style.position = 'relative';

      const sliderData = [{ src: featuredImg.src, title: titleEl.innerText }];
      thumbnails.forEach((thumb, index) => {
        sliderData.push({
          src: thumb.src,
          title: 'Informasi Berita Lanjutan BPMP Provinsi Lampung - Bagian ' + (index + 2),
        });
      });

      let slideIndex = 0;
      let isAnimating = false;

      function autoSlideNews() {
        if (isAnimating || document.hidden) return;
        isAnimating = true;

        const nextIndex = (slideIndex + 1) % sliderData.length;
        const nextData = sliderData[nextIndex];

        const oldClone = featuredCard.cloneNode(true);
        const newClone = featuredCard.cloneNode(true);

        newClone.querySelector('.featured-img').src = nextData.src;
        newClone.querySelector('h3').innerText = nextData.title;

        const cardTop = featuredCard.offsetTop;
        const cardLeft = featuredCard.offsetLeft;
        const cardWidth = featuredCard.offsetWidth;
        const cardHeight = featuredCard.offsetHeight;

        oldClone.style.cssText = `position: absolute; top: ${cardTop}px; left: ${cardLeft}px; width: ${cardWidth}px; height: ${cardHeight}px; margin: 0; z-index: 10;`;

        newClone.style.cssText = `position: absolute; top: ${cardTop + cardHeight + 20}px; left: ${cardLeft}px; width: ${cardWidth}px; height: ${cardHeight}px; margin: 0; z-index: 11; transform: scale(0.8) translateZ(0); transform-origin: top center; opacity: 0; will-change: transform, top, opacity;`;

        newsLeft.appendChild(oldClone);
        newsLeft.appendChild(newClone);

        featuredCard.style.opacity = '0';

        const slideDuration = 800;
        const easing = 'cubic-bezier(0.25, 1, 0.5, 1)';

        oldClone.style.transition = `all ${slideDuration}ms ${easing}`;
        newClone.style.transition = `all ${slideDuration}ms ${easing}`;

        void newClone.offsetWidth;

        oldClone.style.transform = 'translateY(-30%) scale(0.9) translateZ(0)';
        oldClone.style.opacity = '0';

        newClone.style.top = cardTop + 'px';
        newClone.style.transform = 'scale(1) translateZ(0)';
        newClone.style.opacity = '1';

        setTimeout(() => {
          const oldFeaturedSrc = sliderData[slideIndex].src;
          thumbnails.forEach((thumb) => {
            thumb.style.transition = 'all 0.3s ease';
          });

          for (let i = 0; i < thumbnails.length - 1; i++) {
            thumbnails[i].style.opacity = '0';
            thumbnails[i].style.transform = 'scale(0.8)';
            setTimeout(() => {
              thumbnails[i].src = thumbnails[i + 1].src;
              thumbnails[i].style.opacity = '1';
              thumbnails[i].style.transform = 'scale(1)';
            }, 300);
          }

          const lastThumb = thumbnails[thumbnails.length - 1];
          lastThumb.style.opacity = '0';
          lastThumb.style.transform = 'scale(0.8)';
          setTimeout(() => {
            lastThumb.src = oldFeaturedSrc;
            lastThumb.style.opacity = '1';
            lastThumb.style.transform = 'scale(1)';
          }, 300);
        }, 100);

        setTimeout(() => {
          featuredImg.src = nextData.src;
          titleEl.innerText = nextData.title;
          featuredCard.style.opacity = '1';

          oldClone.remove();
          newClone.remove();

          slideIndex = nextIndex;
          isAnimating = false;
        }, slideDuration);
      }

      newsInterval = setInterval(autoSlideNews, 4500);
    }

    /* =========================================================
       4. LENS EFEK 3D LOGO MITRA (FIXED MATH & LOAD SEQUENCE)
       ========================================================= */
    const track = trackRef.current;
    const partnersSection = partnersSectionRef.current;
    let observerMitra;
    let animationFrameId;

    if (track && partnersSection) {
      const allLogos = track.querySelectorAll('.partner-logo');
      let isSectionVisible = false;

      function apply3DLensEffect() {
        if (!isSectionVisible) return;

        const screenCenter = window.innerWidth / 2;
        const maxDistance = window.innerWidth / 2;

        for (let i = 0; i < allLogos.length; i++) {
          const rect = allLogos[i].getBoundingClientRect();

          // Mencegah error hitungan jika gambar belum di-render ukurannya
          if (rect.width === 0) continue;

          const logoCenter = rect.left + rect.width / 2;
          const distanceFromCenter = Math.abs(screenCenter - logoCenter);

          let normalized = distanceFromCenter / maxDistance;
          if (normalized > 1) normalized = 1;

          const scale = 0.65 + 0.95 * Math.pow(normalized, 2);

          allLogos[i].style.transform = `scale(${scale}) translateZ(0)`;
          allLogos[i].style.opacity = '1';
          allLogos[i].style.filter = 'none';
        }

        animationFrameId = requestAnimationFrame(apply3DLensEffect);
      }

      observerMitra = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            isSectionVisible = entry.isIntersecting;
            if (isSectionVisible) {
              apply3DLensEffect();
            } else {
              if (animationFrameId) cancelAnimationFrame(animationFrameId);
            }
          });
        },
        { threshold: 0.01 }
      );

      // SOLUSI BERANTAKAN SAAT REFRESH:
      // Kita "mengunci" observer agar baru berjalan saat status DOM browser 100% "complete" (Semua gambar selesai diload)
      const startObserver = () => {
        if (partnersSectionRef.current) {
          observerMitra.observe(partnersSectionRef.current);
        }
      };

      if (document.readyState === 'complete') {
        startObserver();
      } else {
        window.addEventListener('load', startObserver);
      }
    }

    // Cleanup Component
    return () => {
      if (newsInterval) clearInterval(newsInterval);
      if (observerMitra) observerMitra.disconnect();
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      window.removeEventListener('load', () => { });
    };
  }, []);

  // === 2. TAMBAHKAN EFEK TYPEWRITER DI SINI ===
  useEffect(() => {
    let i = 0;
    let typingInterval;

    // Beri jeda 500ms saat web baru dibuka sebelum mulai mengetik
    const startDelay = setTimeout(() => {
      typingInterval = setInterval(() => {
        if (i < fullText.length) {
          // Menambah huruf satu per satu ke dalam state
          setTypedText(fullText.substring(0, i + 1));
          i++;
        } else {
          clearInterval(typingInterval);
          // Setelah ketikan selesai, munculkan teks kementerian dan logo di bawahnya
          setShowSubtitle(true); 
        }
      }, 40); // 40ms adalah kecepatan ngetik (semakin kecil semakin cepat)
    }, 500);

    // Cleanup memori
    return () => {
      clearTimeout(startDelay);
      if (typingInterval) clearInterval(typingInterval);
    };
  }, []);
  // =============================================


  /* =========================================================
     5. EFEK MARQUEE SCROLL VELOCITY (PREMIUM EFFECT)
     Kecepatan geser logo mengikuti kecepatan scroll layar
     ========================================================= */
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let percentX = 0;
    let lastScrollY = window.scrollY;
    let currentVelocity = 0;
    let animationFrameId;

    const animateMarquee = () => {
      const currentScrollY = window.scrollY;
      
      // 1. Hitung jarak scroll sejak frame terakhir (Velocity)
      const scrollDelta = currentScrollY - lastScrollY;
      lastScrollY = currentScrollY;

      // 2. LERP (Linear Interpolation) untuk efek rem yang mulus
      // Angka 0.08 menentukan seberapa licin/halus efek remnya saat scroll berhenti
      currentVelocity += (scrollDelta - currentVelocity) * 0.08;

      // 3. Pengaturan Kecepatan
      const baseSpeed = 0.04; // Kecepatan jalan normal saat didiamkan
      const scrollSensitivity = 0.015; // Sensitivitas dorongan saat di-scroll

      // 4. Kalkulasi total kecepatan geser
      const totalSpeed = baseSpeed + (currentVelocity * scrollSensitivity);

      percentX -= totalSpeed;

      // 5. Logika Infinite Loop (-50% karena array diduplikasi 2x di JSX)
      if (percentX <= -50) {
        percentX += 50;
      } else if (percentX > 0) {
        // Efek Super Keren: Jika user scroll ke atas dengan cepat, 
        // arah animasi akan berbalik arah ke kanan secara natural!
        percentX -= 50;
      }

      // 6. Terapkan posisi baru menggunakan akselerasi GPU (translate3d)
      track.style.transform = `translate3d(${percentX}%, 0, 0)`;

      animationFrameId = requestAnimationFrame(animateMarquee);
    };

    // Jalankan mesin animasi
    animationFrameId = requestAnimationFrame(animateMarquee);

    // Cleanup saat komponen ditutup
    return () => cancelAnimationFrame(animationFrameId);
  }, []); // <-- Pastikan array dependensi kosong agar hanya jalan 1x


  useEffect(() => {
    let animationFrame;

    // KUNCI PERBAIKAN: Pindahkan titik pusat animasi ke tepi kanan
    if (heroImageRef.current) {
      heroImageRef.current.style.transformOrigin = 'right bottom';
    }

    const animateHero = () => {
      if (!heroImageRef.current) return;

      const scrollY = window.scrollY;

      /*
          Nilai maksimal pergeseran.
          Semakin besar angkanya semakin tenggelam.
      */
      const translateY = Math.min(scrollY * 1.1, 1320);

      /*
          Sedikit mengecil agar muncul efek depth.
          Karena transformOrigin sekarang di kanan, 
          gambar tidak akan menjauh dari tepi layar.
      */
      const scale = Math.max(1 - scrollY * 0.00012, 0.93);

      /*
          Sedikit menggelap ketika semakin turun
      */
      const brightness = Math.max(
        1 - scrollY * 0.00045,
        0.78
      );

      heroImageRef.current.style.transform =
        `translateY(${translateY}px) scale(${scale})`;

      heroImageRef.current.style.filter =
        `brightness(${brightness})`;

      animationFrame = requestAnimationFrame(animateHero);
    };

    animationFrame = requestAnimationFrame(animateHero);

    return () => cancelAnimationFrame(animationFrame);

  }, []);

  return (
    <>
      <header className="unified-header">
        <div className="header-top">
          <div className="header-logo">
            <img src={Logo} alt="Logo Kemendikdasmen BPMP Lampung" className="main-logo" />
          </div>

          <div className="header-actions">
            <div
              className={`search-wrapper ${isSearchActive ? 'active' : ''}`}
              ref={searchWrapperRef}
            >
              <input
                type="text"
                className="search-input"
                placeholder="Cari informasi..."
                ref={searchInputRef}
              />
              <button
                className="search-trigger"
                aria-label="Pencarian"
                onClick={handleSearchToggle}
              >
                <i className="fa-solid fa-magnifying-glass"></i>
              </button>
            </div>

            <button className="btn-voice" aria-label="Tulisan Ke Suara">
              <span>Tulisan Ke Suara</span>
              <img src={IconTextToSpeech} alt="" />
            </button>
          </div>
        </div>

        <nav className="main-navbar">
          <div className="nav-selector"></div>
          <a href="#" className="nav-link active">Beranda</a>

          <div className={`nav-item has-dropdown${isProfileDropdownLocked ? ' dropdown-locked' : ''}`} ref={profileDropdownRef}>
            <a href="#" className="nav-link" onClick={handleProfileClick}>
              Profil <img src={Dropdown} alt="Dropdown" className="dropdown-icon" />
            </a>
            <div className="dropdown-menu">
              <a href="#">Sejarah</a>
              <a href="#">Visi & Misi</a>
              <a href="#">Tugas & Fungsi</a>
              <a href="#">Struktur Organisasi</a>
              <a href="#">Pejabat</a>
              <a href="#">Informasi Pegawai</a>
              <a href="#">Sarana dan Prasarana</a>
            </div>
          </div>

          <div className="nav-item has-dropdown">
            <a href="#" className="nav-link">
              Reformasi Birokrasi <img src={Dropdown} alt="Dropdown" className="dropdown-icon" />
            </a>
          </div>

          <div className="nav-item has-dropdown">
            <a href="#" className="nav-link">
              Dok. Kinerja <img src={Dropdown} alt="Dropdown" className="dropdown-icon" />
            </a>
          </div>

          <div className="nav-item has-dropdown">
            <a href="#" className="nav-link">
              Pelayanan <img src={Dropdown} alt="Dropdown" className="dropdown-icon" />
            </a>
          </div>

          <div className="nav-item has-dropdown">
            <a href="#" className="nav-link">
              Program <img src={Dropdown} alt="Dropdown" className="dropdown-icon" />
            </a>
          </div>

          <a href="#" className="nav-link">PPID</a>
          <a href="#" className="nav-link">Sipers</a>
          <a href="#" className="nav-link">SPAB</a>

          <div className="nav-item has-dropdown">
            <a href="#" className="nav-link">
              Pengaduan <img src={Dropdown} alt="Dropdown" className="dropdown-icon" />
            </a>
          </div>
        </nav>
      </header>

      <aside className="floating-social-bar">
        <div className="glass-sidebar-bg">
          <div className="blur-shape shape-pertama"></div>
          <div className="blur-shape shape-kedua"></div>
          <div className="blur-shape shape-ketiga"></div>
        </div>

        {/* PERBAIKAN: Pemanggilan Asset menggunakan variable Import */}
        <a href="#" className="social-icon" aria-label="Instagram">
          <span className="social-text">@bpmplampung</span>
          <img src={Instagram} alt="Instagram" />
        </a>
        <a href="#" className="social-icon" aria-label="YouTube">
          <span className="social-text">bpmplampung</span>
          <img src={Youtube} alt="YouTube" />
        </a>
        <a href="#" className="social-icon" aria-label="WhatsApp">
          <span className="social-text">62+895-462-763</span>
          <img src={Social} alt="WhatsApp" />
        </a>
        <a href="#" className="social-icon" aria-label="Facebook">
          <span className="social-text">bpmplampung</span>
          <img src={Facebook} alt="Facebook" />
        </a>
      </aside>

      <div className="landing-wrapper">
        <div className="background-glow-container"></div>
        <section className="hero-section">
          <div className="hero-flex-container">
<div className="hero-left-content">
              {/* Teks atas muncul perlahan dari atas */}
              <span className="welcome-text entrance-fade-down">Selamat Datang Di</span>
              
              {/* Teks judul dicetak menggunakan efek ngetik */}
              <h1 className="main-title">
                {typedText}
                <span className={`typing-cursor ${showSubtitle ? 'stop-blink' : ''}`}>|</span>
              </h1>
              
              {/* Teks dan logo bawah menunggu ketikan selesai baru muncul */}
              <p className={`sub-title ${showSubtitle ? 'entrance-fade-up' : 'opacity-0'}`}>
                Kementerian Pendidikan Dasar dan Menengah
              </p>

              <div className={`hero-logos-flex ${showSubtitle ? 'entrance-fade-up-delay' : 'opacity-0'}`}>
                <img src={Mitra4} alt="Pendidikan Bermutu" className="bottom-logo" />
                <img src={Mitra5} alt="Kemendikdasmen Ramah" className="bottom-logo" />
              </div>
            </div>

            <div className="hero-right-cms">
              <img
                ref={heroImageRef}
                src={BackgroundLanding}
                alt="Visual Gedung dan Latar Belakang BPMP"
                className="cms-dynamic-image"
              />
            </div>
          </div>
        </section>
      </div>

      {/* SECTION BERITA */}
      <section className="news-section">
        <div className="news-header-bar">
          <h2>BERITA TERKINI</h2>
        </div>

        <div className="news-grid">
          <div className="news-left">
            <div className="featured-card">
              {/* PERBAIKAN: Pemanggilan Asset menggunakan variable Import */}
              <img src={PreviewBerita1Jpg} alt="Berita Utama BPMP" className="featured-img" />
              <div className="featured-overlay">
                <h3>
                  Awali Pekan dengan Semangat Melayani, BPMP Lampung Perkuat Budaya Kerja dan Kualitas
                  Layanan
                </h3>
              </div>
            </div>

            <div className="thumbnail-row">
              {/* PERBAIKAN: Pemanggilan Asset menggunakan variable Import */}
              <img src={PreviewBerita2} alt="Thumbnail 1" className="thumb-img" />
              <img src={PreviewBerita3} alt="Thumbnail 2" className="thumb-img" />
            </div>
          </div>

          <div className="news-divider"></div>

          <div className="news-right">
            <h3 className="right-title">INFORMASI TERKINI</h3>

            <div className="news-list">
              <a href="#" className="news-item">
                <div className="white-curve"></div>
                <div className="news-text">
                  <span className="news-category">| Berita</span>
                  <h4 className="news-title">
                    Awali Pekan dengan Semangat Melayani, BPMP Lampung Perkuat Budaya Kerja dan Kualitas Layanan
                  </h4>
                  <span className="news-date">
                    15 Juni 2026 &nbsp;<i className="fa-regular fa-clock"></i>
                  </span>
                </div>
              </a>

              <a href="#" className="news-item">
                <div className="white-curve"></div>
                <div className="news-text">
                  <span className="news-category">| Berita</span>
                  <h4 className="news-title">
                    Awali Pekan dengan Semangat Melayani, BPMP Lampung Perkuat Budaya Kerja dan Kualitas Layanan
                  </h4>
                  <span className="news-date">
                    15 Juni 2026 &nbsp;<i className="fa-regular fa-clock"></i>
                  </span>
                </div>
              </a>

              <a href="#" className="news-item">
                <div className="white-curve"></div>
                <div className="news-text">
                  <span className="news-category">| Berita</span>
                  <h4 className="news-title">
                    Awali Pekan dengan Semangat Melayani, BPMP Lampung Perkuat Budaya Kerja dan Kualitas Layanan
                  </h4>
                  <span className="news-date">
                    15 Juni 2026 &nbsp;<i className="fa-regular fa-clock"></i>
                  </span>
                </div>
              </a>

              <a href="#" className="news-item">
                <div className="white-curve"></div>
                <div className="news-text">
                  <span className="news-category">| Berita</span>
                  <h4 className="news-title">
                    Awali Pekan dengan Semangat Melayani, BPMP Lampung Perkuat Budaya Kerja dan Kualitas Layanan
                  </h4>
                  <span className="news-date">
                    15 Juni 2026 &nbsp;<i className="fa-regular fa-clock"></i>
                  </span>
                </div>
              </a>
            </div>

            <div className="pagination">
              <button className="page-arrow" aria-label="Previous">
                <i className="fa-solid fa-chevron-left"></i>
              </button>
              <button className="page-num">1</button>
              <button className="page-num">2</button>
              <button className="page-num">3</button>
              <span className="page-dots">....</span>
              <button className="page-num">11</button>
              <button className="page-num">12</button>
              <button className="page-arrow" aria-label="Next">
                <i className="fa-solid fa-chevron-right"></i>
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="partners-section" ref={partnersSectionRef}>
        <div className="partners-container">
          {/* SOLUSI LOMPATAN ANIMASI: 
              Kita matikan gap bawaan flexbox, lalu pindahkan sebagai paddingRight di tiap gambar.
              Ini memastikan hitungan rumus dimensi total item genap untuk pembagian translateX(-50%)
          */}
          <div className="partners-track" ref={trackRef} style={{ gap: '0px' }}>
            {[...mitraList, ...mitraList].map((mitra, index) => (
              <img
                key={index}
                src={mitra}
                alt={`Mitra Kerja BPMP ${index + 1}`}
                className="partner-logo"
                style={{ paddingRight: '7vw' }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* =========================================
          SECTION INSTAGRAM BARU 
      ========================================= */}
      <section className="instagram-section">
        {/* 1. Banner Curved Header */}
        <div className="ig-banner-wrapper">
          <div className="ig-banner-oval"></div>
          <h2 className="ig-banner-text">Ikuti Media Sosial BPMP Lampung</h2>
        </div>

        {/* 2. Profile Info Bar */}
        <div className="ig-profile-header">
          <div className="ig-profile-left">
            <img src={Logo} alt="Logo BPMP" className="ig-avatar" />
            <span className="ig-username">@bpmplampung</span>
          </div>

          <div className="ig-stats">
            <div className="ig-stat-item">
              <span className="ig-stat-label">Postingan</span>
              <span className="ig-stat-value">1865</span>
            </div>
            <div className="ig-stat-item">
              <span className="ig-stat-label">Pengikut</span>
              <span className="ig-stat-value">6,138</span>
            </div>
            <div className="ig-stat-item">
              <span className="ig-stat-label">Diikuti</span>
              <span className="ig-stat-value">1,151</span>
            </div>
          </div>

          <div className="ig-profile-right">
            {/* Menggunakan button CSS dengan Icon standard agar persis desain */}
            <button className="ig-follow-btn">
              <img src={Instagram} alt="IG Icon" className="ig-btn-icon" />
              Follow
            </button>
          </div>
        </div>

        {/* 3. Feed Image Grid */}
        <div className="ig-feed-section">
          <div className="ig-feed-grid">
            <div className="ig-post-card">
              <img src={FotoInstagram1} alt="Postingan Instagram 1" className="ig-post-img" />
            </div>
            <div className="ig-post-card">
              <img src={FotoInstagram2} alt="Postingan Instagram 2" className="ig-post-img" />
            </div>
            <div className="ig-post-card">
              <img src={FotoInstagram3} alt="Postingan Instagram 3" className="ig-post-img" />
            </div>
            <div className="ig-post-card">
              <img src={FotoInstagram4} alt="Postingan Instagram 4" className="ig-post-img" />
            </div>
          </div>
        </div>
      </section>

      {/* =========================================
          SECTION YOUTUBE BARU 
          ========================================= */}
      <section className="youtube-section">

        {/* Header Channel Info */}
        <div className="yt-header-bar">
          <div className="yt-profile-left">
            <img src={Youtube} alt="YouTube Icon" className="yt-icon" />
            <span className="yt-channel-name">bpmplampung</span>
          </div>
          <button className="yt-subscribe-btn">Subscribe</button>
        </div>

        {/* Konten Grid Video */}
        <div className="yt-content-area">
          <div className="yt-feed-grid">
            
            {/* Kiri: Video Utama */}
            <div className="yt-main-card">
              <div className="yt-card-title">Jejak Dedikasi, Melanjutkan Inspirasi</div>
              <div className="yt-video-wrapper main-wrapper">
                
                {/* INI ADALAH STANDAR IFRAME YOUTUBE DI REACT */}
                {/* Tambahkan loading="lazy" agar web tetap ringan saat pertama dibuka */}
                <iframe 
                  width="100%" 
                  height="100%" 
                  src="https://www.youtube.com/embed/QxNwOccBIDQ?si=AlMEZ85_xx__tLII" 
                  title="YouTube video player" 
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                  allowFullScreen
                  loading="lazy"
                ></iframe>

              </div>
            </div>

            {/* Kanan: Daftar Video Terbaru */}
            <div className="yt-side-card">
              <div className="yt-card-title text-center">Video Terbaru</div>
              <div className="yt-side-list">
                
                <div className="yt-video-wrapper side-wrapper">
                  <iframe 
                    width="100%" 
                    height="100%" 
                    src="https://www.youtube.com/embed/QLxaUXpp1_w?si=Iu33f77NAv-x6BPM" 
                    title="YouTube video player" 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                    allowFullScreen
                    loading="lazy"
                  ></iframe>
                </div>

                <div className="yt-video-wrapper side-wrapper">
                  <iframe 
                    width="100%" 
                    height="100%" 
                    src="https://www.youtube.com/embed/eSEyIBKwqoE?si=3KHL2tm-zCmkXVce" 
                    title="YouTube video player" 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                    allowFullScreen
                    loading="lazy"
                  ></iframe>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>
      {/* ========================================= */}

{/* =========================================
          SECTION FOOTER BARU
          ========================================= */}
      <footer className="main-footer">


        {/* Bagian Visitor Counter (Background Putih) */}
        <div className="visitor-counter-wrapper">
          <div className="visitor-counter-box">
            <i className="fa-solid fa-user visitor-icon"></i>
            <span className="visitor-text">Total Jumlah Pengunjung : 107030</span>
          </div>
        </div>

        {/* Konten Utama Footer */}
        <div className="footer-content-area">
          <div className="footer-grid">

            {/* Kolom 1: Hubungi Kami */}
            <div className="footer-col">
              <h4 className="footer-col-title">Hubungi Kami</h4>
              <p className="footer-text">Gatot Subroto 44 A Pahoman, Enggal, Kota</p>
              <p className="footer-text">Bandar Lampung</p>
              <p className="footer-text">WhatsApp: 08982969696</p>
              <p className="footer-text">Posel: bpmplampung@kemendikdasmen.go.id</p>
            </div>

            {/* Kolom 2: Tautan */}
            <div className="footer-col">
              <h4 className="footer-col-title">Tautan</h4>
              <a href="#" className="footer-link">Kemendikdasmen</a>
              <a href="#" className="footer-link">Dapodik</a>
              <a href="#" className="footer-link">Sekolah Kita</a>
              <a href="#" className="footer-link">Rumah Pendidikan</a>
              <a href="#" className="footer-link">Rapor Pendidikan</a>
              <a href="#" className="footer-link">Portal Data Pendidikan</a>
              <a href="#" className="footer-link">SPAB Kemendikdasmen</a>
            </div>

            {/* Kolom 3: Navigasi (Map Iframe) */}
            <div className="footer-col">
              <h4 className="footer-col-title">Navigasi</h4>
              <div className="footer-map-wrapper">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3971.9546059286815!2d105.26875931476536!3d-5.424564996065545!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e40db0008b8b40d%3A0xc665bb2c73041077!2sBPMP%20Provinsi%20Lampung!5e0!3m2!1sen!2sid!4v1700000000000!5m2!1sen!2sid"
                  width="100%"
                  height="140"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Peta Lokasi BPMP Lampung"
                ></iframe>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom Bar Copyright */}
        <div className="footer-bottom-bar">
          <p>© 2026 BPMP Lampung</p>
        </div>
      </footer>

    </>
  );
};

export default Beranda;