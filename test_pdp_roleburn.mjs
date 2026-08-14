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

const { data: project } = await supabase.from('projects')
  .select('*, project_scopes(*, roles(name, billable_capacity_hours), allocations(*, people(name, annual_salary)))')
  .ilike('title', '%Wedding%').single();

const { data: timeEntries } = await supabase.from('time_entries')
  .select('*, people(name, annual_salary, role_id, team, roles(billable_capacity_hours))')
  .eq('project_id', project.id);

const { data: people } = await supabase.from('people').select('*');

// Mimic convertCostToActiveCurrency => assume activeCurrency is GBP, so factor is 1
const convertCostToActiveCurrency = (cost) => cost; 

const roleBurn = (project.project_scopes || []).map(scope => {
    const roleName = scope.roles?.name || "Unknown Role";
    const scopedHours = scope.scoped_hours || 0;

    const actualHoursForRole = timeEntries
      .filter(te => te.people?.role_id === scope.role_id)
      .reduce((sum, te) => sum + te.hours, 0);

    const personMap = {};
    timeEntries
      .filter(te => te.people?.role_id === scope.role_id)
      .forEach(te => {
        const pid = te.person_id;
        const personName = te.people?.name || "Unknown";
        const salary = te.people?.annual_salary;
        const team = te.people?.team;
        const isBillableTeam = team && BILLABLE_TEAMS.has(team.toLowerCase());
        const cap = isBillableTeam ? te.people?.roles?.billable_capacity_hours : null;
        const costPerHour = salary ? calculateInternalCostPerHour(salary, cap) : 0;
        const convertedCost = convertCostToActiveCurrency(costPerHour);

        if (!personMap[pid]) {
          personMap[pid] = { name: personName, hours: 0, costPerHour: convertedCost, totalCost: 0 };
        }
        personMap[pid].hours += te.hours;
        personMap[pid].totalCost += te.hours * convertedCost;
      });

    const actualCostForRole = Object.values(personMap).reduce((s, p) => s + p.totalCost, 0);
    return {
        role: roleName,
        actualCost: actualCostForRole,
        people: Object.values(personMap)
    };
});

console.log(JSON.stringify(roleBurn, null, 2));

const totalCost = roleBurn.reduce((s, r) => s + r.actualCost, 0);
console.log("Total roleBurn actualCost:", totalCost);
