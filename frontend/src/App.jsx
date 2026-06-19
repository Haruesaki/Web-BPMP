import { useState, useEffect } from 'react'

function App() {
  const [dataDariBackend, setDataDariBackend] = useState("");

  useEffect(() => {
    // Meminta data dari backend saat halaman pertama kali dimuat
    fetch('http://localhost:5000/api/salam')
      .then(response => response.json())
      .then(data => setDataDariBackend(data.pesan))
      .catch(error => console.error("Ada error:", error));
  }, []);

  return (
    <div style={{ padding: '50px', fontFamily: 'sans-serif' }}>
      <h1>Tes Koneksi React dan Node.js</h1>
      <p>Status Koneksi: <strong>{dataDariBackend || "Sedang memuat data..."}</strong></p>
    </div>
  )
}

export default App