import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

const { data: roles } = await supabase.from('roles').select('*').ilike('title', '%Chief%Strategy%');
console.log("Roles:", roles);

const { data: person } = await supabase.from('people').select('id, name, role_id, job_title').eq('id', 'ad1cfa23-6f16-5ce7-bbe1-aa944f905427').single();
console.log("Person:", person);
