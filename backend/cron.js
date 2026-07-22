const cron = require('node-cron');
const instagramController = require('./controllers/instagramController');

// Jadwal: Setiap 12 jam (cron format: '0 */12 * * *')
cron.schedule('0 */12 * * *', async () => {
  console.log('[Cron Job] Menjalankan pembaruan cache Instagram...');
  await instagramController.fetchAndCacheInstagramProfile();
});

console.log('[Cron Job] Cron Scheduler diinisialisasi.');
