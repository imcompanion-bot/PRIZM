const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:8080/projects/65394393-a3d4-59f8-a683-50e0a10b2908', { waitUntil: 'networkidle2' });
  
  const content = await page.content();
  console.log(content.substring(0, 1000));
  console.log(content.length);
  
  await browser.close();
})();
