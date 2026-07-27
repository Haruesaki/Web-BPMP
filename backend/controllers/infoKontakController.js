const InfoKontak = require('../models/infoKontakModel');
const { logActivityInternal } = require('./aktivitasAdminController');

exports.getFooterInfo = async (req, res) => {
  try {
    const data = await InfoKontak.getInfo();
    res.json({
      success: true,
      data: data || { alamat: '', no_telepon: '', posel: '' }
    });
  } catch (error) {
    console.error('Error in getFooterInfo:', error);
    res.status(500).json({ success: false, pesan: 'Terjadi kesalahan server saat mengambil data kontak.' });
  }
};

exports.updateFooterInfo = async (req, res) => {
  try {
    const { alamat, telepon, email, googleMaps } = req.body;

    // Process Google Maps URL to ensure it is an embed link
    let urlGoogleMap = googleMaps || '';
    if (urlGoogleMap) {
      try {
        // 1. If it's an iframe, extract the src
        const iframeMatch = urlGoogleMap.match(/<iframe.*?src=["'](.*?)["']/);
        if (iframeMatch && iframeMatch[1]) {
          urlGoogleMap = iframeMatch[1];
        } else if (!urlGoogleMap.includes('/maps/embed?') && !urlGoogleMap.includes('output=embed')) {
          // 2. Resolve shortlinks
          let finalUrl = urlGoogleMap;
          if (urlGoogleMap.includes('maps.app.goo.gl') || urlGoogleMap.includes('goo.gl/maps')) {
            const response = await fetch(urlGoogleMap, { redirect: 'follow' });
            finalUrl = response.url;
          }

          // 3. Extract coordinates or query
          const searchMatch = finalUrl.match(/\/maps\/search\/([-\d.]+)[,+]+([-\d.]+)/);
          const placeMatch = finalUrl.match(/\/maps\/place\/.*?\/(?:@)?([-\d.]+),([-\d.]+)/);
          
          let lat, lng;
          if (searchMatch) {
            lat = searchMatch[1];
            lng = searchMatch[2];
          } else if (placeMatch) {
            lat = placeMatch[1];
            lng = placeMatch[2];
          }

          if (lat && lng) {
            urlGoogleMap = `https://maps.google.com/maps?q=${lat},${lng}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
          } else {
            // Try extracting 'q' param if available
            try {
              const urlObj = new URL(finalUrl);
              const qParam = urlObj.searchParams.get('q');
              if (qParam) {
                urlGoogleMap = `https://maps.google.com/maps?q=${encodeURIComponent(qParam)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
              }
            } catch (e) {
              // Ignore invalid URL
            }
          }
        }
      } catch (err) {
        console.error('Error parsing Google Maps URL:', err);
      }
    }

    // Map to DB column names (posel for email, no_telepon for telepon)
    const updateData = {
      alamat: alamat || '',
      no_telepon: telepon || '',
      posel: email || '',
      url_google_map: urlGoogleMap
    };
    const updated = await InfoKontak.updateInfo(updateData);

    // Log activity
    if (req.user) {
      const pName = req.user?.nama || 'System';
      const pRole = req.user?.role || 'Unknown';
      await logActivityInternal(pName, pRole, 'Memperbarui informasi "Hubungi Kami" pada Footer');
    }

    res.json({
      success: true,
      pesan: 'Informasi Footer Hubungi Kami berhasil diperbarui.',
      data: updated[0] || updated
    });
  } catch (error) {
    console.error('Error in updateFooterInfo:', error);
    res.status(500).json({ success: false, pesan: 'Terjadi kesalahan server saat memperbarui data kontak.' });
  }
};
