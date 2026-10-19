import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const { data: p } = await supabase.from('people').select('id, office');
  console.log("Total people:", p.length);
  
  const offices = [...new Set(p.map(x => x.office).filter(Boolean))];
  console.log("Offices:", offices);
  
  const { data: p2 } = await supabase.from('people').select('id').in('office', offices);
  console.log("Total people returned for all offices:", p2.length);
}
run();
