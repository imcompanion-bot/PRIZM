import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const { data: projs } = await supabase.from('projects').select('title, sf_account, ultimate_parent, office');
  const unileverProjs = projs.filter(p => p.ultimate_parent === 'Unilever' || (p.sf_account && p.sf_account.includes('Unilever')));
  console.log("Found unilever projs:", unileverProjs.length);
  
  const p = unileverProjs.find(p => p.title.includes('Dove UK - Skincare'));
  console.log(p);
}
run();
