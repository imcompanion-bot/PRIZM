import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.from('people').select('office').order('office');
  if (error) console.error(error);
  else {
    const offices = [...new Set(data.map(d => d.office))];
    console.log("OFFICES:", offices);
  }
}
run();
