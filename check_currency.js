import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const { data: projects } = await supabase.from('projects').select('title, extra_data').ilike('title', '%Dove%');
  
  projects.forEach(p => {
    if (p.title.includes('Skincare') || p.title.includes('Hair Execution') || p.title.includes('Dauphine')) {
        console.log(p.title, p.extra_data?.project_currency);
    }
  });
  
  const { data: proj2 } = await supabase.from('projects').select('title, extra_data').ilike('title', '%Hellmann%');
  proj2.forEach(p => {
    if (p.title.includes('Sandwich & BBQ') || p.title.includes('Ranch Launch') || p.title.includes('Sweet Sandwich')) {
        console.log(p.title, p.extra_data?.project_currency);
    }
  });
}
run();
