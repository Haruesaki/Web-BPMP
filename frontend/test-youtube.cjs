const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Set viewport to standard desktop
  await page.setViewport({ width: 1280, height: 800 });
  
  await page.goto('http://localhost:5174', { waitUntil: 'networkidle2' });
  
  // Tunggu elemen dirender dan data di-fetch
  await page.waitForSelector('.side-wrapper', { timeout: 10000 });
  
  const mainWrapper = await page.$('.main-wrapper');
  const mainBox = await mainWrapper.boundingBox();
  
  const sideWrappers = await page.$$('.side-wrapper');
  const sideBoxes = await Promise.all(sideWrappers.map(el => el.boundingBox()));
  
  console.log("Main Video Wrapper Box:", mainBox);
  console.log("Side Video Wrappers Box:", sideBoxes);
  
  await browser.close();
})();
