import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

const { data: projects } = await supabase.from('projects').select('id, title, budget_cost, extra_data').ilike('title', '%Dove%');
console.log(JSON.stringify(projects, null, 2));
