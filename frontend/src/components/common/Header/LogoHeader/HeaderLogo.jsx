import React, { useState } from 'react';
import styles from './HeaderLogo.module.css';

const HeaderLogo = ({ logoUrl }) => {
  const [hasError, setHasError] = useState(false);

  if (!logoUrl || hasError) {
    // Render sebuah placeholder dengan dimensi yang sama untuk mencegah layout shift
    // saat logo sedang dimuat atau jika terjadi kesalahan saat memuat gambar dari CMS.
    return <div className={styles.headerLogoPlaceholder} />;
  }

  return (
    <div className={styles.headerLogo}>
      <div className={styles.logoContainer}>
        <img
          src={logoUrl}
          alt="Logo Kemendikdasmen BPMP Lampung"
          className={styles.mainLogo}
          width="380"
          height="65"
          fetchPriority="high"
          decoding="async"
          onError={() => setHasError(true)}
        />
      </div>
    </div>
  );
};

export default HeaderLogo;