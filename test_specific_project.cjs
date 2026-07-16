const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  
  await page.evaluateOnNewDocument(() => {
    window.addEventListener('error', event => {
      console.log('WINDOW ERROR:', event.error ? event.error.message : event.message);
    });
    window.addEventListener('unhandledrejection', event => {
      console.log('UNHANDLED REJECTION:', event.reason);
    });
  });

  console.log("Navigating to specific project...");
  await page.goto('http://localhost:8080/projects/b2207e6a-dcc9-59c5-8c8d-2804978d5dad', { waitUntil: 'networkidle2' });
  
  await new Promise(r => setTimeout(r, 3000));
  await browser.close();
})();
