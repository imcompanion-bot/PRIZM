import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

const { data: project } = await supabase.from('projects').select('*').ilike('title', '%Dove Men%Neptune%Wedding%').single();
const { data: timeEntries } = await supabase.from('time_entries').select('person_id, hours').eq('project_id', project.id);
const { data: people } = await supabase.from('people').select('*');

console.log("Time entries length:", timeEntries.length);
let uniquePeople = new Set(timeEntries.map(te => te.person_id));
console.log("Unique people count:", uniquePeople.size);
