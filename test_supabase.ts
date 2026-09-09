import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);
async function run() {
  const { data, error } = await supabase.from('projects').select('title, sf_account, extra_data').ilike('sf_account', '%Heineken%');
  if (error) console.error(error);
  else {
    for (const d of data) {
      if (d.extra_data) {
        if (d.extra_data.gp_q1_25_26 > 0) {
          console.log(d.title, d.extra_data.gp_q1_25_26);
        }
      }
    }
  }
}
run();
