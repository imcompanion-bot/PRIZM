import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

const { data: project } = await supabase.from('projects').select('*').ilike('title', '%Microsoft%Surface%One Surface Creator Strategy%').single();
const { data: people } = await supabase.from('people').select('id, annual_salary, roles(billable_capacity_hours)').ilike('name', '%Simon Harwood%');
const peopleIds = people.map(p => p.id);

const { data: timeEntries } = await supabase.from('time_entries').select('person_id').eq('project_id', project.id).in('person_id', peopleIds);
const usedPersonIds = [...new Set(timeEntries.map(te => te.person_id))];

for (const id of usedPersonIds) {
  const p = people.find(x => x.id === id);
  console.log("Used Person ID:", id);
  console.log("Salary:", p.annual_salary);
  console.log("Capacity:", p.roles?.billable_capacity_hours);
}
