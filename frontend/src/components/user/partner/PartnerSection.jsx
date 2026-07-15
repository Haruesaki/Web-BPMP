import { useEffect, useRef } from 'react';
import './PartnerSection.css';

// --- IMPORT ASSETS ---
import Mitra1Jpg from "../../../assets/source/Mitra (1).jpg";
import Mitra1Png from "../../../assets/source/Mitra (1).png";
import Mitra2 from "../../../assets/source/Mitra (2).png";
import Mitra3 from "../../../assets/source/Mitra (3).png";
import Mitra4 from "../../../assets/source/Mitra (4).png";
import Mitra5 from "../../../assets/source/Mitra (5).png";

const LOOP_COPIES = 8;

const PartnerSection = () => {
    const trackRef = useRef(null);
    const partnersSectionRef = useRef(null);

    const mitraList = [Mitra1Jpg, Mitra5, Mitra2, Mitra3, Mitra1Png, Mitra4];

    // GABUNGAN EFEK: 3D LENS, 3D CURVE, & MARQUEE VELOCITY
    useEffect(() => {
        const track = trackRef.current;
        const partnersSection = partnersSectionRef.current;
        if (!track || !partnersSection) return;

        let animationId; // KUNCI: Satu ID untuk loop animasi gabungan
        let observer;
        let resizeObserver;

        const logoFrames = track.querySelectorAll('.partner-logo-frame');
        logoFrames.forEach((frame) => frame.style.removeProperty('opacity'));
        let isSectionVisible = false;

        // --- Jarak antar grup dipakai sebagai periode loop agar reset selalu mulus ---
        let loopWidth = 0;
        let layoutInitialized = false;

        // --- State untuk Marquee & Animasi Berbasis Waktu ---
        let translateX = 0;
        let lastScrollY = window.scrollY;
        let currentVelocity = 0;
        let lastTime = 0; // Untuk kalkulasi deltaTime

        const getAnimationSettings = () => {
            const screenWidth = window.innerWidth;

            if (screenWidth <= 370) {
                return {
                    screenWidth,
                    baseSpeedPerSecond: 48,
                    scrollSensitivityPerSecond: 10,
                    maxRotation: 28,
                    minScale: 0.86,
                    maxScale: 1.05,
                    maxDepth: 260,
                    perspective: 620,
                };
            }

            if (screenWidth <= 953) {
                return {
                    screenWidth,
                    baseSpeedPerSecond: 54,
                    scrollSensitivityPerSecond: 16,
                    maxRotation: 38,
                    minScale: 2,
                    maxScale: 1.8,
                    maxDepth: 380,
                    perspective: 200,
                };
            }

            // BREAKPOINT 1280px:
            // - Speed sedikit diperlambat agar tidak terasa terlalu cepat pada ruang yang lebih sempit.
            // - Rotation/depth dikurangi agar logo tidak terlihat gepeng saat browser mengecil.
            // - Scale dibuat lebih rapat dengan ukuran wadah supaya komposisi tetap lega.
            if (screenWidth <= 1280) {
                return {
                    screenWidth,
                    baseSpeedPerSecond: 82,
                    scrollSensitivityPerSecond: 24,
                    maxRotation: 38,
                    minScale: 1.5,
                    maxScale: 1.68,
                    maxDepth: 540,
                    perspective: 760,
                };
            }

            return {
                screenWidth,
                baseSpeedPerSecond: 106,
                scrollSensitivityPerSecond: 38,
                maxRotation: 25,
                minScale: 1.45,
                maxScale: 1.72,
                maxDepth: 600,
                perspective: 430,
            };
        };

        const normalizeTranslate = () => {
            if (!loopWidth) return;
            translateX = ((translateX % loopWidth) + loopWidth) % loopWidth;
            if (translateX > 0) translateX -= loopWidth;
        };

        const measureLoopWidth = () => {
            const groups = track.querySelectorAll('.partner-logo-group');
            if (groups.length < 2) return;

            const previousLoopWidth = loopWidth;
            const firstGroupRect = groups[0].getBoundingClientRect();
            const secondGroupRect = groups[1].getBoundingClientRect();

            // Ukur jarak aktual antar grup, bukan sekadar width.
            // Ini menangkap gap/padding decimal pada viewport kecil maupun besar.
            const measuredWidth = secondGroupRect.left - firstGroupRect.left;
            if (measuredWidth > 0) {
                loopWidth = measuredWidth;
                layoutInitialized = true;

                // Saat viewport berubah, pertahankan fase animasi agar tidak terlihat loncat.
                if (previousLoopWidth > 0 && previousLoopWidth !== loopWidth) {
                    translateX = (translateX / previousLoopWidth) * loopWidth;
                }
                normalizeTranslate();
            }
        };

        // --- FUNGSI ANIMASI GABUNGAN ---
        function animate(currentTime) {
            if (!isSectionVisible) return;

            // --- PERBAIKAN: Implementasi deltaTime untuk kecepatan yang konsisten ---
            if (!lastTime) {
                lastTime = currentTime;
                animationId = requestAnimationFrame(animate);
                return;
            }
            const deltaTime = Math.min(currentTime - lastTime, 50);
            lastTime = currentTime;

            // --- Inisialisasi layout saat pertama kali dijalankan & terlihat ---
            if (!layoutInitialized) {
                measureLoopWidth();
            }
            const animationSettings = getAnimationSettings();

            // --- Bagian 1: Logika Marquee (Pergerakan Pita) ---
            const currentScrollY = window.scrollY;
            const scrollDelta = currentScrollY - lastScrollY;
            lastScrollY = currentScrollY;
            currentVelocity += (scrollDelta - currentVelocity) * 0.06;

            // ===== PENGATURAN KECEPATAN AUTOSLIDE =====
            // baseSpeedPerSecond:
            // - Semakin besar nilainya, logo bergerak semakin cepat.
            // - Semakin kecil nilainya, logo bergerak semakin pelan.
            //
            // scrollSensitivityPerSecond:
            // - Mengatur seberapa besar scroll halaman mempengaruhi laju logo.
            // - Jika ingin autoslide stabil tanpa dorongan scroll, ubah nilainya menjadi 0.
            const { baseSpeedPerSecond, scrollSensitivityPerSecond } = animationSettings;
            const rawSpeedPerSecond = baseSpeedPerSecond + (currentVelocity * scrollSensitivityPerSecond);
            // Kecepatan dijaga tetap maju agar scroll ke atas tidak membalik arah marquee.
            // Pembalikan arah dapat memicu reset mendadak dan terlihat seperti animasi start ulang.
            const minSpeedPerSecond = baseSpeedPerSecond * 0.35;
            const maxSpeedPerSecond = baseSpeedPerSecond * 2.2;
            const totalSpeedPerSecond = Math.min(maxSpeedPerSecond, Math.max(minSpeedPerSecond, rawSpeedPerSecond));
            translateX -= totalSpeedPerSecond * (deltaTime / 1000); // Terapkan kecepatan berbasis deltaTime

            if (layoutInitialized && loopWidth > 0) {
                normalizeTranslate();
            }
            track.style.transform = `translate3d(${translateX}px, 0, 0)`;

            // --- Bagian 2: Lewati logika 3D jika layout belum siap ---
            if (!layoutInitialized) {
                animationId = requestAnimationFrame(animate);
                return;
            }

            // --- Bagian 2: Logika Efek Visual 3D (Circular Depth) ---
            const {
                screenWidth,
                maxRotation,
                minScale,
                maxScale,
                maxDepth,
                perspective,
            } = animationSettings;
            const screenCenter = screenWidth / 2;
            const maxDistance = screenWidth / 2;

            // ===== PENGATURAN PERSPEKTIF 3D LOGO =====
            // Konsep visual:
            // - Sisi kanan dan kiri layar adalah posisi terdekat dari mata pengguna.
            // - Titik tengah layar adalah posisi terjauh, sehingga logo terlihat mengecil.
            //
            // maxRotation:
            // - Semakin besar, logo di sisi kanan/kiri semakin miring.
            //
            // minScale:
            // - Ukuran logo saat berada di titik tengah.
            // - Semakin kecil, efek "jauh di tengah" semakin kuat.
            //
            // maxScale:
            // - Ukuran logo saat berada di sisi kanan/kiri.
            // - Semakin besar, efek "dekat di sisi layar" semakin kuat.
            //
            // maxDepth:
            // - Jarak mundur logo saat berada di titik tengah.
            // - Semakin besar, titik tengah terasa semakin jauh.
            // --- Posisi frame dipakai agar transform logo tidak mengganggu kalkulasi layout ---
            for (let i = 0; i < logoFrames.length; i++) {
                const frame = logoFrames[i];
                const logo = frame.querySelector('.partner-logo');
                if (!logo) continue;
                const frameRect = frame.getBoundingClientRect();
                const logoCenter = frameRect.left + frameRect.width / 2;

                const distanceFromCenter = logoCenter - screenCenter;
                const normalizedDistance = Math.max(-1, Math.min(1, distanceFromCenter / maxDistance));
                const absNormalizedDistance = Math.abs(normalizedDistance);
                const depthProgress = 1 - absNormalizedDistance;
                const scale = minScale + (maxScale - minScale) * absNormalizedDistance;
                const rotationAngle = -maxRotation * normalizedDistance;
                const translateZ = -maxDepth * depthProgress;

                logo.style.transform = `perspective(${perspective}px) translateZ(${translateZ}px) rotateY(${rotationAngle}deg) scale(${scale})`;
            }

            // Minta frame animasi berikutnya untuk loop gabungan ini
            animationId = requestAnimationFrame(animate);
        }

        // --- Observer untuk mengontrol kapan animasi berjalan ---
        observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    isSectionVisible = entry.isIntersecting;
                    if (isSectionVisible) {
                        lastTime = 0; // Reset lastTime saat kembali terlihat
                        // Mulai loop animasi gabungan
                        animationId = requestAnimationFrame(animate);
                    } else {
                        // Hentikan loop animasi gabungan
                        if (animationId) cancelAnimationFrame(animationId);
                    }
                });
            },
            { threshold: 0.01 }
        );

        const startObserver = () => {
            if (partnersSectionRef.current) {
                observer.observe(partnersSectionRef.current);
            }
        };

        const firstGroup = track.querySelector('.partner-logo-group');
        if (firstGroup && 'ResizeObserver' in window) {
            resizeObserver = new ResizeObserver(measureLoopWidth);
            resizeObserver.observe(firstGroup);
        }
        window.addEventListener('resize', measureLoopWidth);

        // --- Perbaikan Memory Leak: Gunakan fungsi bernama agar bisa dihapus ---
        if (document.readyState === 'complete') {
            startObserver();
        } else {
            window.addEventListener('load', startObserver);
        }

        // --- Fungsi Cleanup ---
        return () => {
            if (observer) observer.disconnect();
            if (resizeObserver) resizeObserver.disconnect();
            if (animationId) cancelAnimationFrame(animationId);
            // Perbaikan: Hapus listener yang sama persis
            window.removeEventListener('load', startObserver);
            window.removeEventListener('resize', measureLoopWidth);
        };
    }, []); // Dependency array kosong, hanya berjalan sekali saat mount

    return (
        <section className="partners-section" ref={partnersSectionRef}>
            <div className="partners-container">
                {/* PERBAIKAN: Hapus inline style untuk gap dan padding pada anak */}
                <div className="partners-track" ref={trackRef}>
                    {/* Duplikasi grup untuk buffer loop. Reset animasi memakai jarak antar grup. */}
                    {Array.from({ length: LOOP_COPIES }).map((_, groupIndex) => (
                        <div className="partner-logo-group" key={groupIndex}>
                            {mitraList.map((mitra, index) => (
                                <span className="partner-logo-frame" key={`${groupIndex}-${index}`}>
                                    <img
                                        src={mitra}
                                        alt={`Mitra Kerja BPMP ${index + 1}`}
                                        className="partner-logo"
                                    />
                                </span>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default PartnerSection;
