import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const { data: sainsburys } = await supabase.from('projects').select('parent_account, sf_account').ilike('ultimate_parent', "%Sainsbury's%");
  
  const parents = new Set();
  sainsburys.forEach(h => {
      parents.add(h.parent_account);
  });
  console.log("Sainsburys Parents:", Array.from(parents));
}
run();
