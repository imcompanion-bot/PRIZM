const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('error', err => console.log('ERROR:', err.message));
  
  await page.evaluateOnNewDocument(() => {
    window.addEventListener('unhandledrejection', event => {
      console.log('UNHANDLED REJECTION:', event.reason);
    });
  });

  await page.goto('http://localhost:8080/projects/65394393-a3d4-59f8-a683-50e0a10b2908', { waitUntil: 'networkidle2' }).catch(e => console.log('Goto Error:', e.message));

  await new Promise(r => setTimeout(r, 4000));

  await browser.close();
})();
