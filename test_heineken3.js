import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const { data: projs } = await supabase.from('projects').select('ultimate_parent, parent_account, sf_account').ilike('ultimate_parent', "%Heineken%");
  
  const groups = {};
  projs.forEach(p => {
      let acct = p.sf_account || p.parent_account || "(No Account)";
      groups[acct] = (groups[acct] || 0) + 1;
  });
  console.log("Heineken Breakdown with previous fix (sf_account || parent_account):");
  for (const [k, v] of Object.entries(groups)) {
      console.log(`  ${k}: ${v}`);
  }
}
run();
