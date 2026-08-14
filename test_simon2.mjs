import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

const { data: people } = await supabase.from('people').select('name, office, annual_salary, roles(billable_capacity_hours)').ilike('name', '%Simon%');
console.log(people);
