const puppeteer = require('puppeteer');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env', 'utf-8');
const supabaseUrl = env.match(/VITE_SUPABASE_URL="(.*)"/)[1];
const supabaseKey = env.match(/VITE_SUPABASE_PUBLISHABLE_KEY="(.*)"/)[1];
const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
  const { data: projects, error } = await supabase.from('projects').select('id').limit(10);
  if (error) {
    console.error(error);
    return;
  }

  const browser = await puppeteer.launch();
  for (const proj of projects) {
    const page = await browser.newPage();
    let crashed = false;
    
    page.on('pageerror', err => {
      console.log(`[${proj.id}] PAGE ERROR:`, err.message);
      crashed = true;
    });

    await page.evaluateOnNewDocument(() => {
      window.addEventListener('error', event => {
        console.log(`WINDOW ERROR:`, event.error ? event.error.message : event.message);
      });
      window.addEventListener('unhandledrejection', event => {
        console.log(`UNHANDLED REJECTION:`, event.reason);
      });
    });

    await page.goto(`http://localhost:8080/projects/${proj.id}`, { waitUntil: 'networkidle2' }).catch(e => {
        console.log(`[${proj.id}] Goto Error:`, e.message);
    });

    await new Promise(r => setTimeout(r, 2000));
    await page.close();
  }
  await browser.close();
  console.log("Done checking 10 projects");
})();
