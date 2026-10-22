import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const { data } = await supabase.from('projects').select('title, ultimate_parent, sf_account, parent_account').ilike('ultimate_parent', "%Sainsbury's%").limit(15);
  console.log(data);
}
run();
