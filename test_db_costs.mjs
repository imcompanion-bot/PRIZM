import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

const { data: project } = await supabase.from('projects').select('id').ilike('title', '%Wedding%').single();
const { data, error } = await supabase.rpc('get_project_costs_monthly', { _start_date: '2020-01-01', _end_date: '2030-01-01' });
if (data) {
  const projCost = data.filter(d => d.project_id === project.id);
  console.log(projCost);
} else {
  console.log(error);
}

