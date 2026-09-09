import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);
async function run() {
  const { data, error } = await supabase.from('projects').select('title, sf_account, ultimate_parent, office, extra_data').ilike('sf_account', '%Heineken%');
  if (error) console.error(error);
  else {
    let sumUK = 0;
    for (const d of data) {
      if (d.extra_data && d.office && (d.office.toUpperCase().includes('UK') || d.office.toUpperCase().includes('KINGDOM'))) {
        let v = d.extra_data.gp_fy24_25 || 0;
        sumUK += v;
        if (v > 0) console.log(d.title, v);
      }
    }
    console.log('Total UK Heineken 24/25 in DB:', sumUK);
  }
}
run();
