import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const uniqueOffices = ['United Kingdom', 'United States', 'Companion'];
  let allPeopleInOffices = [];
  let fromIdx = 0;
  const step = 1000;
  while(true) {
    const { data } = await supabase.from('people').select('id').in('office', uniqueOffices).range(fromIdx, fromIdx + step - 1);
    if (data) allPeopleInOffices.push(...data);
    if (!data || data.length < step) break;
    fromIdx += step;
  }
  console.log("Total people fetched:", allPeopleInOffices.length);
}
run();
