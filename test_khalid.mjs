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

const { data: timeEntries } = await supabase.from('time_entries')
  .select('hours, people(name, annual_salary, role_id, team, roles(billable_capacity_hours))')
  .eq('project_id', project.id)
  .ilike('people.name', '%Khalid%');

// filter out non-matching due to left join
const validEntries = timeEntries.filter(te => te.people);

let khalidHours = 0;
let khalidCostNoTeam = 0;
let khalidCostWithTeam = 0;
let khalidRateNoTeam = 0;
let khalidRateWithTeam = 0;

validEntries.forEach(te => {
    khalidHours += te.hours;
    const salary = te.people?.annual_salary;
    
    // Without team
    const team1 = undefined;
    const isBillableTeam1 = team1 && BILLABLE_TEAMS.has(team1.toLowerCase());
    const cap1 = isBillableTeam1 ? te.people?.roles?.billable_capacity_hours : null;
    khalidRateNoTeam = calculateInternalCostPerHour(salary, cap1);
    khalidCostNoTeam += te.hours * khalidRateNoTeam;

    // With team
    const team2 = te.people?.team;
    console.log("Khalid's actual team from DB:", team2, "| Billable Capacity from DB:", te.people?.roles?.billable_capacity_hours);
    const isBillableTeam2 = team2 && BILLABLE_TEAMS.has(team2.toLowerCase());
    const cap2 = isBillableTeam2 ? te.people?.roles?.billable_capacity_hours : null;
    khalidRateWithTeam = calculateInternalCostPerHour(salary, cap2);
    khalidCostWithTeam += te.hours * khalidRateWithTeam;
});

console.log("Khalid Hours:", khalidHours);
console.log("Khalid Rate (No Team):", khalidRateNoTeam);
console.log("Khalid Cost (No Team):", khalidCostNoTeam);
console.log("Khalid Rate (With Team):", khalidRateWithTeam);
console.log("Khalid Cost (With Team):", khalidCostWithTeam);

// Now let's calculate total actual cost for the project with and without team
const { data: allTe } = await supabase.from('time_entries')
  .select('hours, people(name, annual_salary, role_id, team, roles(billable_capacity_hours))')
  .eq('project_id', project.id);

let costWithTeam = allTe.reduce((sum, te) => {
    const salary = te.people?.annual_salary;
    const team = te.people?.team;
    const isBillableTeam = team && BILLABLE_TEAMS.has(team.toLowerCase());
    const cap = isBillableTeam ? te.people?.roles?.billable_capacity_hours : null;
    if (!salary) return sum;
    return sum + te.hours * calculateInternalCostPerHour(salary, cap);
}, 0);

console.log("Total Actual Cost With Team:", costWithTeam);
