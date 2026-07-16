// node fetch is native

async function test() {
  try {
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'ahmaddonijalaludin@gmail.com', password: 'oysterizer' })
    });
    const loginData = await loginRes.json();
    console.log('Login:', loginData);

    const token = loginData.data.token;

    const res = await fetch('http://localhost:5000/api/halaman-konten/23', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        kunci_halaman: 'kuki',
        contents: [
          { judul: 'Test Judul', konten: 'Test Konten' }
        ]
      })
    });
    
    console.log('Status:', res.status);
    const data = await res.json();
    console.log('Response:', data);
  } catch(e) {
    console.error(e);
  }
}
test();
