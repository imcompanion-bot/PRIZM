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

const { data: timeEntries } = await supabase.from('time_entries')
  .select('hours, people(name, annual_salary, role_id, team, roles(billable_capacity_hours))')
  .eq('project_id', project.id);

let totalCostBefore = 0;
let totalCostAfter = 0;

const personStats = {};

timeEntries.forEach(te => {
    if (!te.people || !te.people.annual_salary) return;
    const name = te.people.name;
    const salary = te.people.annual_salary;
    const team = te.people.team;
    const dbCap = te.people.roles?.billable_capacity_hours;

    // BEFORE: team was not fetched, so team was undefined
    const teamBefore = undefined;
    const isBillableBefore = false;
    const capBefore = null;
    const rateBefore = calculateInternalCostPerHour(salary, capBefore);
    totalCostBefore += te.hours * rateBefore;

    // AFTER: team is fetched
    const teamAfter = team;
    const isBillableAfter = teamAfter && BILLABLE_TEAMS.has(teamAfter.toLowerCase());
    const capAfter = isBillableAfter ? dbCap : null;
    const rateAfter = calculateInternalCostPerHour(salary, capAfter);
    totalCostAfter += te.hours * rateAfter;

    if (!personStats[name]) {
        personStats[name] = { 
            team, 
            dbCap,
            isBillableAfter,
            rateBefore, 
            rateAfter, 
            hours: 0, 
            costBefore: 0, 
            costAfter: 0 
        };
    }
    personStats[name].hours += te.hours;
    personStats[name].costBefore += te.hours * rateBefore;
    personStats[name].costAfter += te.hours * rateAfter;
});

console.log("Total Cost Before:", totalCostBefore);
console.log("Total Cost After:", totalCostAfter);

for (const [name, stats] of Object.entries(personStats)) {
    if (Math.abs(stats.rateBefore - stats.rateAfter) > 1) {
        console.log(`DIFFERENCE FOR ${name}:`);
        console.log(`  Team: ${stats.team}, isBillable: ${stats.isBillableAfter}, dbCap: ${stats.dbCap}`);
        console.log(`  Rate Before: ${stats.rateBefore.toFixed(2)} | Cost Before: ${stats.costBefore.toFixed(2)}`);
        console.log(`  Rate After:  ${stats.rateAfter.toFixed(2)} | Cost After:  ${stats.costAfter.toFixed(2)}`);
    } else if (name.includes("Khalid")) {
        console.log(`NO DIFFERENCE FOR ${name}:`);
        console.log(`  Team: ${stats.team}, isBillable: ${stats.isBillableAfter}, dbCap: ${stats.dbCap}`);
        console.log(`  Rate: ${stats.rateBefore.toFixed(2)} | Cost: ${stats.costBefore.toFixed(2)}`);
    }
}

