import React from 'react';

/**
 * Komponen Pagination mandiri yang dirancang khusus untuk ProfileLayout.
 * Menggunakan styling dari CardContent.css.
 *
 * @param {object} props
 * @param {number} props.currentPage - Halaman yang sedang aktif.
 * @param {number} props.totalPages - Jumlah total halaman.
 * @param {function(number): void} props.onPageChange - Callback saat halaman diubah.
 */
const Pagination = ({ currentPage, totalPages, onPageChange }) => {

  /**
   * Menghasilkan item-item pagination (angka, elipsis) untuk ditampilkan.
   * Tujuannya agar UI tetap ringkas meskipun jumlah halaman sangat banyak.
   */
  const getPaginationItems = () => {
    const items = [];
    // Konfigurasi: Tampilkan 2 angka di sekitar halaman aktif, plus halaman pertama dan terakhir.
    const pageNeighbours = 1; 

    // Selalu tampilkan halaman pertama
    items.push(1);

    // Tampilkan elipsis kiri jika perlu
    if (currentPage > pageNeighbours + 2) {
      items.push('...');
    }

    // Tampilkan angka di sekitar halaman aktif
    const startPage = Math.max(2, currentPage - pageNeighbours);
    const endPage = Math.min(totalPages - 1, currentPage + pageNeighbours);

    for (let i = startPage; i <= endPage; i++) {
      items.push(i);
    }

    // Tampilkan elipsis kanan jika perlu
    if (currentPage < totalPages - pageNeighbours - 1) {
      items.push('...');
    }

    // Selalu tampilkan halaman terakhir (jika lebih dari 1 halaman)
    if (totalPages > 1) {
      items.push(totalPages);
    }

    // Hapus duplikat jika ada (terjadi jika total halaman sedikit)
    return [...new Set(items)];
  };

  const paginationItems = getPaginationItems();

  return (
    <div className="pagination">
      <button
        className="page-arrow"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Halaman sebelumnya"
      >
        &lt;
      </button>

      {paginationItems.map((item, index) =>
        item === '...' ? (
          <span key={`dots-${index}`} className="page-dots">...</span>
        ) : (
          <button
            key={item}
            className={`page-num ${currentPage === item ? 'active' : ''}`}
            onClick={() => onPageChange(item)}
            aria-label={`Halaman ${item}`}
          >
            {item}
          </button>
        )
      )}

      <button
        className="page-arrow"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Halaman berikutnya"
      >
        &gt;
      </button>
    </div>
  );
};

export default Pagination;