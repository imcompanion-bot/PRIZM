import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const { data: projs } = await supabase.from('projects').select('title, ultimate_parent, parent_account, sf_account').or('parent_account.ilike.%Heineken UK%,sf_account.ilike.%Heineken UK%');
  console.log(projs);
}
run();
