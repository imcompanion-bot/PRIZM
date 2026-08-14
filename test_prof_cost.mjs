import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

const { data: project } = await supabase.from('projects').select('id, title').ilike('title', '%Wedding%').single();

const { data: costs } = await supabase.rpc('get_project_costs');
const pCost = costs.find(c => c.project_id === project.id);
console.log(pCost);

