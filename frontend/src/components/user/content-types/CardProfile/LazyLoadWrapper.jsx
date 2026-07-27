import React, { useState, useEffect, useRef } from 'react';

const LazyLoadWrapper = ({ children, placeholderHeight, placeholderWidth }) => {
  const [isVisible, setIsVisible] = useState(false);
  const placeholderRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Cek apakah elemen masuk ke viewport
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          // Berhenti mengamati setelah komponen terlihat untuk efisiensi
          observer.disconnect();
        }
      },
      {
        // Muat komponen 200px sebelum benar-benar masuk ke layar untuk pengalaman yang lebih mulus
        rootMargin: "200px",
      }
    );

    if (placeholderRef.current) {
      observer.observe(placeholderRef.current);
    }

    // Cleanup observer saat komponen di-unmount
    return () => {
      if (observer && placeholderRef.current) {
        observer.unobserve(placeholderRef.current);
      }
    };
  }, []);

  return isVisible ? (
    children
  ) : (
    <div
      ref={placeholderRef}
      style={{ height: placeholderHeight, width: placeholderWidth }}
      aria-hidden="true"
    />
  );
};

export default LazyLoadWrapper;