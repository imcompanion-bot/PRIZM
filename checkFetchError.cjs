const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('response', async response => {
    if (response.status() >= 400 && response.url().includes('supabase')) {
      console.log('HTTP ERROR:', response.status(), response.url());
      try {
        console.log('BODY:', await response.text());
      } catch (e) {}
    }
  });
  await page.goto('https://bdb-prizm.web.app/profitability', {waitUntil: 'networkidle2'});
  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
})();
