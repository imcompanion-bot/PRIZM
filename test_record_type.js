import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const { data: projs } = await supabase.from('projects').select('title, opportunity_record_type, start_date, end_date').ilike('title', "%Sainsbury's%Underspend%");
  console.log("Underspend projs:", projs);
  
  const { data: projs2 } = await supabase.from('projects').select('title, opportunity_record_type, start_date, end_date').ilike('title', "%Sainsbury's - Argos A-List%Savings%");
  console.log("A-List Savings projs:", projs2);
}
run();
