import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  let attempts = 0;
  while (attempts < 10) {
    const { data } = await supabase.from('talent_efficiencies').select('amount, month_date').ilike('opportunity_name', "%Skincare%").limit(1);
    if (data && data.length > 0 && data[0].amount < 3000) {
        console.log("Updated!");
        break;
    }
    attempts++;
    await new Promise(r => setTimeout(r, 5000));
  }
}
run();
