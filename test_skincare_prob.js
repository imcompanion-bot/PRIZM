import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const { data: projects } = await supabase.from('projects').select('title, probability, stage, extra_data').ilike('title', '%Skincare%');
  projects.forEach(p => {
      console.log(p.title, p.probability, p.stage);
  });
}
run();
