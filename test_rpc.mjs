import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

const { data: project } = await supabase.from('projects').select('id').ilike('title', '%Wedding%').single();
const { data, error } = await supabase.rpc('get_project_costs', { p_project_id: project.id });
console.log(error);
console.log(data);

