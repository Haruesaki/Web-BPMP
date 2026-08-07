/**
 * Sanitasi HTML string dari tag script dan event handler inline untuk mencegah XSS.
 * Menggunakan DOMParser bawaan peramban (0% dependensi npm tambahan, ultra-ringan).
 * 
 * @param {string} htmlString - String HTML dari database
 * @returns {string} String HTML yang telah disanitasi bersih
 */
export const sanitizeHTML = (htmlString) => {
  if (!htmlString) return "";
  
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, "text/html");
    
    // 1. Hapus semua elemen <script>
    const scripts = doc.querySelectorAll("script");
    scripts.forEach(script => script.remove());
    
    // 2. Hapus tag berpotensi berbahaya lainnya (seperti iframe liar, object, embed, applet)
    // Catatan: iframe Instagram/YouTube/Vimeo yang sah ditangani oleh transformNode React di JSX.
    const dangerousTags = doc.querySelectorAll("iframe, object, embed, applet, link[rel='stylesheet']");
    dangerousTags.forEach(tag => tag.remove());

    // 3. Hapus semua atribut event handler inline (on*) dan skema link javascript:
    const allElements = doc.querySelectorAll("*");
    allElements.forEach(el => {
      const attrsToRemove = [];
      for (let i = 0; i < el.attributes.length; i++) {
        const attrName = el.attributes[i].name;
        // Hapus handler inline (onload, onerror, onclick, dsb)
        if (attrName.startsWith("on")) {
          attrsToRemove.push(attrName);
        }
        
        // Hapus jika href mengandung 'javascript:'
        if (attrName === "href") {
          const attrVal = el.attributes[i].value.trim().toLowerCase();
          if (attrVal.startsWith("javascript:") || attrVal.startsWith("data:text/html")) {
            attrsToRemove.push(attrName);
          }
        }
      }
      attrsToRemove.forEach(attr => el.removeAttribute(attr));
    });
    
    return doc.body.innerHTML;
  } catch (error) {
    console.error("Gagal melakukan sanitasi HTML:", error);
    // Fallback darurat: hapus tag script secara regex jika DOMParser gagal di runtime
    return htmlString.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  }
};
