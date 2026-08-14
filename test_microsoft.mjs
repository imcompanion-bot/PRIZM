import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

const { data: project } = await supabase.from('projects').select('*').ilike('title', '%Microsoft%Surface%One Surface Creator Strategy%').single();
const { data: people } = await supabase.from('people').select('id, name, office, annual_salary, roles(billable_capacity_hours)').ilike('name', '%Simon Harwood%');
const peopleIds = people.map(p => p.id);
const { data: timeEntries } = await supabase.from('time_entries').select('person_id, hours').eq('project_id', project.id);

console.log("Project:", project.title);
let totalHours = 0;
for (const t of timeEntries) {
  if (peopleIds.includes(t.person_id)) {
    totalHours += t.hours;
    console.log("Simon logged:", t.hours);
  }
}
console.log("Total Simon Hours:", totalHours);
