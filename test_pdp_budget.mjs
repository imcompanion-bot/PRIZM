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

const { data: people } = await supabase.from('people').select('*, roles(billable_capacity_hours)');

const convertCostToActiveCurrency = (cost) => cost; 

const rawBudgetedInternalCost = (project?.project_scopes || []).reduce((sum, scope) => {
    const roleId = scope.role_id;
    const now = new Date();
    const rolePeople = people.filter((p) => {
      if (p.role_id !== roleId || !p.annual_salary) return false;
      const end = p.overall_end_date ? new Date(p.overall_end_date) : null;
      return !end || end >= now;
    });
    
    if (rolePeople.length === 0) return sum;
    
    const avgCostPerHour = rolePeople.reduce((s, p) => {
      const isBillableTeam = p.team && BILLABLE_TEAMS.has(p.team.toLowerCase());
      const cap = isBillableTeam ? p.roles?.billable_capacity_hours : null;
      const cost = calculateInternalCostPerHour(p.annual_salary, cap);
      if (p.name.includes("Khalid")) console.log(`Budget - Khalid cap: ${cap}, cost/hr: ${cost}`);
      return s + convertCostToActiveCurrency(cost);
    }, 0) / rolePeople.length;
    
    return sum + scope.scoped_hours * avgCostPerHour;
}, 0);

console.log("Raw Budgeted Internal Cost:", rawBudgetedInternalCost);
