import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);
async function run() {
  const { data, error } = await supabase.from('projects').select('title, sf_account, extra_data').eq('title', 'King | CCS - Music Season 2025');
  if (error) console.error(error);
  else {
    for (const d of data) {
      if (d.extra_data) {
        console.log(d.title, '| FY:', d.extra_data.gp_fy25_26, '| Q1:', d.extra_data.gp_q1_25_26, '| Q2:', d.extra_data.gp_q2_25_26);
      }
    }
  }
}
run();
