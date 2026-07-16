const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  page.on('console', async (msg) => {
    const args = await Promise.all(msg.args().map(a => a.jsonValue().catch(() => a.toString())));
    console.log(`PAGE LOG [${msg.type()}]:`, ...args);
  });

  await page.goto('http://localhost:8080/projects/65394393-a3d4-59f8-a683-50e0a10b2908', { waitUntil: 'networkidle0' }).catch(e => console.log('Goto Error:', e.message));

  await new Promise(r => setTimeout(r, 4000));

  await browser.close();
})();
