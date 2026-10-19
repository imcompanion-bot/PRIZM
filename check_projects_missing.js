import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const oppNames = [
    "Unilever - Hellmann's Sandwich & BBQ 2025",
    "Unilever - Hellmann's Ranch Launch [Execution]",
    "Dove US Pilot - Dauphine & Diptique Awareness 2025",
    "Unilever - Marmite Pride 2025",
    "Rexona: Football Partnerships",
    "Unilever Food Global Toolkit",
    "Dove Jarvis Pulse [Creative Development only]",
    "Unilever - Hellmann's Big Simon Content",
    "Hellmann's Production Shoot (Nov. 2025)",
    "Hello Fresh - Stacey Production Shoot",
    "Dove UK - Hair Execution",
    "Dove UK - Skincare",
    "Hellmann's Sweet Sandwich Time - Summer 2026"
  ];
  
  let from = 0;
  const pageSize = 1000;
  const allProjs = [];
  while (true) {
    const { data } = await supabase.from('projects').select('title, sf_account, ultimate_parent, office').range(from, from + pageSize - 1);
    if (!data) break;
    allProjs.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  
  for (const name of oppNames) {
    const p = allProjs.find(p => name === p.title || name.startsWith(p.title + " "));
    if (p) {
        console.log(`FOUND: ${name} -> office: ${p.office}, sf: ${p.sf_account}, ultimate: ${p.ultimate_parent}`);
    } else {
        console.log(`MISSING: ${name}`);
    }
  }
}
run();
