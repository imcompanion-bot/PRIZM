const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));

  // The user's screenshot shows the URL: https://bdb-prizm.web.app/projects/aed840ea-352b-55f1-bcb6-ee0820978335
  await page.goto('https://bdb-prizm.web.app/projects/aed840ea-352b-55f1-bcb6-ee0820978335', { waitUntil: 'networkidle0' });
  
  await browser.close();
})();
