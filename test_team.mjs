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

const { data: project } = await supabase.from('projects').select('id').ilike('title', '%Wedding%').single();

const { data: te_no_team } = await supabase.from('time_entries')
  .select('hours, people(name, annual_salary, role_id, roles(billable_capacity_hours))')
  .eq('project_id', project.id);

let costNoTeam = te_no_team.reduce((sum, te) => {
    const salary = te.people?.annual_salary;
    const team = undefined; // team is missing
    const isBillableTeam = team && BILLABLE_TEAMS.has(team.toLowerCase());
    const cap = isBillableTeam ? te.people?.roles?.billable_capacity_hours : null;
    if (!salary) return sum;
    const costPerHour = calculateInternalCostPerHour(salary, cap);
    return sum + te.hours * costPerHour;
}, 0);

const { data: te_with_team } = await supabase.from('time_entries')
  .select('hours, people(name, annual_salary, role_id, team, roles(billable_capacity_hours))')
  .eq('project_id', project.id);

let costWithTeam = te_with_team.reduce((sum, te) => {
    const salary = te.people?.annual_salary;
    const team = te.people?.team;
    const isBillableTeam = team && BILLABLE_TEAMS.has(team.toLowerCase());
    const cap = isBillableTeam ? te.people?.roles?.billable_capacity_hours : null;
    if (!salary) return sum;
    const costPerHour = calculateInternalCostPerHour(salary, cap);
    return sum + te.hours * costPerHour;
}, 0);

console.log("Cost WITHOUT team (PDP current bug):", costNoTeam);
console.log("Cost WITH team (Correct calculation):", costWithTeam);
