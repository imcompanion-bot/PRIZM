import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

const { data: project } = await supabase.from('projects').select('*').ilike('title', '%Wedding%').single();

const ed = project?.extra_data || {};
console.log("project_currency_revenue:", ed.project_currency_revenue);
console.log("project_currency_media_cost:", ed.project_currency_media_cost);
console.log("project_currency_gross_budget:", ed.project_currency_gross_budget);
