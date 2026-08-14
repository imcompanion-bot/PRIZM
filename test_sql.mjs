import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

const { data, error } = await supabase.rpc('execute_sql', { sql_query: "SELECT pg_get_functiondef('get_project_costs'::regproc);" });
console.log(data);
console.log(error);

