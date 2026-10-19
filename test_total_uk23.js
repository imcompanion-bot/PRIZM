import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const { data: projs, error: projsErr } = await supabase.from('projects').select('title, sf_account');
  const ukProjs = projs.filter(p => p.sf_account === '0014J000021N5dQQAS');
  console.log("UK Unilever Projects:", ukProjs.length);
}
run();
