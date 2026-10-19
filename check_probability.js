import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const { data: projects } = await supabase.from('projects').select('title, probability, stage').ilike('title', '%Dove UK - Skincare%');
  console.log("Skincare Probability:");
  console.log(projects);
  
  const { data: proj2 } = await supabase.from('projects').select('title, probability, stage').ilike('title', '%Hellmann%Sweet Sandwich%');
  console.log("Hellmanns Sweet Sandwich Probability:");
  console.log(proj2);
  
  const { data: proj3 } = await supabase.from('projects').select('title, probability, stage').ilike('title', '%Dauphine%');
  console.log("Dauphine Probability:");
  console.log(proj3);
}
run();
