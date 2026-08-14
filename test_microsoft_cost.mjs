import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

const WORKING_HOURS_PER_YEAR = 1665;
const HOURS_PER_DAY = 7.5;

function calculateInternalCostPerHour(annualSalary, billableCapacityHours) {
  const weeklyCapacity = (billableCapacityHours == null || billableCapacityHours <= 0) ? (HOURS_PER_DAY * 5) : billableCapacityHours;
  const dailyBillableHours = weeklyCapacity / 5;
  const billableCapacityPct = dailyBillableHours / HOURS_PER_DAY;
  const billableHoursPerYear = WORKING_HOURS_PER_YEAR * billableCapacityPct;
  return annualSalary / billableHoursPerYear;
}

async function run() {
  const { data: project } = await supabase.from('projects').select('*').ilike('title', '%Microsoft%Surface%One Surface Creator Strategy%').single();
  const { data: people } = await supabase.from('people').select('id, name, office, annual_salary, roles(billable_capacity_hours)');
  const { data: timeEntries } = await supabase.from('time_entries').select('project_id, person_id, hours').eq('project_id', project.id);

  let gbpCost = 0;
  for (const t of timeEntries) {
    const p = people.find(x => x.id === t.person_id);
    if (!p || !p.annual_salary) continue;
    const isUk = !p.office || p.office.includes('UK') || p.office.includes('United Kingdom');
    if (isUk) {
      gbpCost += t.hours * calculateInternalCostPerHour(p.annual_salary, p.roles?.billable_capacity_hours);
    }
  }

  console.log("Microsoft GBP Cost:", gbpCost);
}
run();
