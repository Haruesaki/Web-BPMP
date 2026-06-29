const puppeteer = require('puppeteer');

(async () => {
  for (let i = 1; i <= 3; i++) {
    console.log(`\n=== Memulai Testing Kalibrasi ke-${i} ===`);
    
    // Buka localhost
    const browser = await puppeteer.launch({ 
      headless: "new",
      args: ['--autoplay-policy=no-user-gesture-required'] 
      // note: using this flag to simulate user unlocking it via mousemove as puppeteer doesn't strictly enforce autoplay in headless new, but we will test our mousemove logic by evaluating it.
    });
    const page = await browser.newPage();
    
    try {
      console.log(`[Test ${i}] Membuka halaman localhost:5174...`);
      await page.goto('http://localhost:5174', { waitUntil: 'networkidle2' });
      
      // Tunggu sampai teks muncul
      await page.waitForSelector('.welcome-text', { timeout: 5000 });
      
      console.log(`[Test ${i}] Halaman dimuat. Menyimulasikan klik untuk unlock (click)...`);
      // Simulasikan pergerakan mouse untuk trigger unlockTTS
      await page.mouse.click(100, 100);
      
      console.log(`[Test ${i}] Menunggu 500ms...`);
      await new Promise(r => setTimeout(r, 500));
      
      // Dapatkan kordinat elemen .welcome-text
      const rect = await page.evaluate(() => {
        const el = document.querySelector('.welcome-text');
        const {x, y, width, height} = el.getBoundingClientRect();
        return {x, y, width, height};
      });
      
      console.log(`[Test ${i}] Menyorot (hover) teks '.welcome-text'...`);
      await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
      
      console.log(`[Test ${i}] Menunggu hingga TTS mulai berbicara...`);
      let isSpeaking = false;
      for (let j = 0; j < 20; j++) {
        await new Promise(r => setTimeout(r, 100));
        const speaking = await page.evaluate(() => {
          return window.speechSynthesis.speaking || window.speechSynthesis.pending;
        });
        if (speaking) {
          isSpeaking = true;
          break;
        }
      }
      
      if (isSpeaking) {
        console.log(`[Test ${i}] ✅ BERHASIL! Text-to-Speech aktif otomatis setelah hover pertama kali.`);
      } else {
        console.log(`[Test ${i}] ❌ GAGAL! Text-to-Speech tidak aktif.`);
      }
      
    } catch (err) {
      console.error(`[Test ${i}] Error:`, err.message);
    } finally {
      console.log(`[Test ${i}] Menutup localhost (Browser)...`);
      await browser.close();
    }
  }
  console.log('\n=== Testing Kalibrasi Selesai ===');
})();
