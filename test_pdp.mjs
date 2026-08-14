import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

const BILLABLE_TEAMS = new Set(["account management", "strategy", "strategy and innovation", "creative team", "paid media", "project management", "business affairs", "data", "production"]);

function getDailyCapacity(billableCapacityHours) {
  return billableCapacityHours / 5;
}

function calculateInternalCostPerHour(annualSalary, billableCapacityHours) {
  const weeklyCapacity = (billableCapacityHours == null || billableCapacityHours <= 0) ? (7.5 * 5) : billableCapacityHours;
  const dailyBillableHours = getDailyCapacity(weeklyCapacity);
  const billableCapacityPct = dailyBillableHours / 7.5;
  const billableHoursPerYear = 1665 * billableCapacityPct;
  return (annualSalary * 1.15) / billableHoursPerYear;
}

const { data: project } = await supabase.from('projects').select('id, title').ilike('title', '%Wedding%').single();
console.log(project);

const { data: timeEntries } = await supabase.from('time_entries').select('*, people(name, annual_salary, role_id, team, roles(billable_capacity_hours))').eq('project_id', project.id);

let totalActualCost = 0;
timeEntries.forEach(te => {
    const salary = te.people?.annual_salary;
    const team = te.people?.team;
    const isBillableTeam = team && BILLABLE_TEAMS.has(team.toLowerCase());
    const cap = isBillableTeam ? te.people?.roles?.billable_capacity_hours : null;
    if (!salary) return;
    const costPerHour = calculateInternalCostPerHour(salary, cap);
    const cost = te.hours * costPerHour;
    if (te.people?.name?.includes('Khalid')) {
        console.log(`${te.people.name} (${team}) - hours: ${te.hours}, cap: ${cap}, cost/hr: ${costPerHour}, cost: ${cost}`);
    }
    totalActualCost += cost;
});

console.log("Total Actual Cost:", totalActualCost);
