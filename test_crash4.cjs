const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  page.on('console', msg => console.log('CONSOLE:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.stack || error));
  
  await page.evaluateOnNewDocument(() => {
    window.addEventListener('error', event => {
      console.log('WINDOW ERROR:', event.error ? event.error.stack : event.message);
    });
    window.addEventListener('unhandledrejection', event => {
      console.log('UNHANDLED REJECTION:', event.reason ? event.reason.stack : event.reason);
    });
  });

  await page.goto('http://localhost:8080/projects/65394393-a3d4-59f8-a683-50e0a10b2908', { waitUntil: 'networkidle0' }).catch(e => console.log('Goto Error:', e.message));

  await new Promise(r => setTimeout(r, 4000));

  await browser.close();
})();
