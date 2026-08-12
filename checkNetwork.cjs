const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('response', response => {
    if (response.status() >= 400) {
      console.log('HTTP ERROR:', response.status(), response.url());
    }
  });
  await page.goto('https://bdb-prizm.web.app/profitability', {waitUntil: 'networkidle2'});
  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
})();
