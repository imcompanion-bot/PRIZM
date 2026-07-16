const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  await page.goto('http://localhost:8080/projects/65394393-a3d4-59f8-a683-50e0a10b2908', { waitUntil: 'networkidle0' });

  await new Promise(r => setTimeout(r, 4000));
  await page.screenshot({ path: 'screenshot.png', fullPage: true });

  await browser.close();
})();
