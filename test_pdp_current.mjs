import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

const BILLABLE_TEAMS = new Set(["account management", "strategy", "strategy and innovation", "creative team", "paid media", "project management", "business affairs", "data", "production"]);

function calculateInternalCostPerHour(annualSalary, billableCapacityHours) {
  const weeklyCapacity = (billableCapacityHours == null || billableCapacityHours <= 0) ? 37.5 : billableCapacityHours;
  const dailyBillableHours = weeklyCapacity / 5;
  const billableCapacityPct = dailyBillableHours / 7.5;
  const billableHoursPerYear = 1665 * billableCapacityPct;
  return (annualSalary * 1.15) / billableHoursPerYear;
}

const { data: project } = await supabase.from('projects').select('id, title').ilike('title', '%Wedding%').single();

const { data: timeEntries } = await supabase
    .from("time_entries")
    .select("*, people(name, annual_salary, role_id, team, roles(name, billable_capacity_hours))")
    .eq("project_id", project.id);

let totalCost = 0;
let totalHours = 0;

timeEntries.forEach(te => {
    totalHours += te.hours;
    const salary = te.people?.annual_salary;
    const team = te.people?.team;
    const isBillableTeam = team && BILLABLE_TEAMS.has(team.toLowerCase());
    const cap = isBillableTeam ? te.people?.roles?.billable_capacity_hours : null;
    if (!salary) return;
    const costPerHour = calculateInternalCostPerHour(salary, cap);
    // Ignore FX conversion for this test as it's 1 for USD and we just want to see if it's 8.4k or 6.3k
    totalCost += te.hours * costPerHour;
});

console.log("Total Actual Hours:", totalHours);
console.log("Total Actual Cost:", totalCost);

