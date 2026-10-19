import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const { data: proj } = await supabase
    .from('projects')
    .select('title, office, ultimate_parent, sf_account')
    .ilike('title', "%Hellmann's Sweet Sandwich Time - Summer 2026%");
    
  console.log(proj);
}
run();
