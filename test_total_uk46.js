import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const { data: projs } = await supabase.from('projects').select('title, sf_account, ultimate_parent, office');
  const ps = projs.filter(p => p.title.toLowerCase().includes('dove uk - skincare'));
  console.log(ps);
}
run();
