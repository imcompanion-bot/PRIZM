import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const { data: heineken } = await supabase.from('projects').select('title, ultimate_parent, parent_account, sf_account').ilike('ultimate_parent', "%Heineken%").limit(10);
  console.log("HEINEKEN:", heineken);
  
  const { data: unilever } = await supabase.from('projects').select('title, ultimate_parent, parent_account, sf_account').ilike('ultimate_parent', "%Unilever%").limit(10);
  console.log("UNILEVER:", unilever);
}
run();
