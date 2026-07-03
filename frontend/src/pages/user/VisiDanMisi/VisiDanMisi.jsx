import React from 'react';
import './VisiDanMisi.css';

// Import komponen-komponen utama sesuai struktur folder

const VisiDanMisi = ({ lenisRef }) => {
return (
    <div className="visimisi-page-wrapper">

        <main className="visimisi-container">
            <div className="visimisi-content">
                <div className="vm-card">
                    <div className="vm-card-header">
                        <h2>Visi</h2>
                    </div>
                    <div className="vm-card-body">
                        <p className="vm-quote">
                            “Terwujudnya Insan Pendidikan yang Berkarakter, Cerdas, dan Berdaya Saing Global Berlandaskan Gotong Royong.”
                        </p>
                    </div>
                </div>

                <div className="vm-card">
                    <div className="vm-card-header">
                        <h2>Misi</h2>
                    </div>
                    <div className="vm-card-body">
                        <ol className="vm-list">
                            <li>Meningkatkan kualitas penjaminan mutu pendidikan dasar dan menengah yang merata di Provinsi Lampung.</li>
                            <li>Mengembangkan model-model pembelajaran inovatif yang berpusat pada siswa dan berbasis teknologi.</li>
                            <li>Memperkuat tata kelola satuan pendidikan yang transparan, akuntabel, dan partisipatif.</li>
                            <li>Membangun ekosistem pendidikan yang kolaboratif dengan melibatkan seluruh pemangku kepentingan.</li>
                            <li>Mendorong penguatan karakter profil Pelajar Pancasila melalui program-program yang relevan dan berdampak.</li>
                        </ol>
                    </div>
                </div>
            </div>
        </main>

    </div>
    );
};

export default VisiDanMisi;