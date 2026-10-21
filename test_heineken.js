import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const { data: heineken } = await supabase.from('projects').select('parent_account, sf_account').ilike('ultimate_parent', "%Heineken%");
  
  const parents = new Set();
  const sfs = new Set();
  heineken.forEach(h => {
      parents.add(h.parent_account);
      sfs.add(h.sf_account);
  });
  console.log("Parents:", Array.from(parents));
  console.log("SFs:", Array.from(sfs));
}
run();
