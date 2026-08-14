import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

const { data: project } = await supabase.from('projects')
  .select('*, project_scopes(*, roles(name, billable_capacity_hours), allocations(*, people(name, annual_salary)))')
  .ilike('title', '%Wedding%').single();

console.log("Budget cost:", project.budget_cost);

const { data: timeEntries } = await supabase.from('time_entries')
  .select('*, people(name, annual_salary, role_id, team, roles(billable_capacity_hours))')
  .eq('project_id', project.id);

let totalHours = timeEntries.reduce((s, te) => s + te.hours, 0);
console.log("Total hours:", totalHours);

