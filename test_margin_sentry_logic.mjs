import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

const BILLABLE_TEAMS = new Set(["account management", "strategy", "strategy and innovation", "creative team", "paid media", "project management", "business affairs", "data", "production"]);

const { data: project } = await supabase.from('projects').select('*').ilike('title', '%Wedding%').single();
const { data: timeEntries } = await supabase.from('time_entries').select('*, people(name, annual_salary, role_id, team, office, roles(billable_capacity_hours))').eq('project_id', project.id);
const { data: people } = await supabase.from('people').select('*');

// Calculate working days so far
const today = new Date();
const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
lastMonthEnd.setHours(23, 59, 59, 999);
const dayOfWeek = today.getDay();
const daysToSubtract = dayOfWeek === 0 ? 7 : dayOfWeek;
const lastSunday = new Date(today);
lastSunday.setDate(today.getDate() - daysToSubtract);
lastSunday.setHours(23, 59, 59, 999);

const projectStart = new Date(project.start_date);
const projectEnd = new Date(project.end_date);

let limitDate = projectStart < lastMonthEnd ? lastMonthEnd : lastSunday;
if (limitDate > projectEnd) {
    limitDate = projectEnd;
}

let workingDaysSoFar = 0;
let curr = new Date(project.start_date);
while (curr <= limitDate) {
    const day = curr.getDay();
    if (day !== 0 && day !== 6) workingDaysSoFar++;
    curr.setDate(curr.getDate() + 1);
}
if (workingDaysSoFar <= 0) workingDaysSoFar = 1;

console.log("Working days so far:", workingDaysSoFar);

const activeTeamIds = [...new Set(timeEntries.map(te => te.person_id))].filter(Boolean);

const activePeopleNames = new Set();
const nameToSiblingIds = {};

activeTeamIds.forEach(pid => {
    const person = people.find(p => p.id === pid);
    if (!person) return;
    const normName = person.name.trim().toLowerCase();
    activePeopleNames.add(normName);

    const siblings = people.filter(p => p.name.trim().toLowerCase() === normName);
    nameToSiblingIds[normName] = siblings.map(s => s.id);
});

const allQueryIds = [...new Set(Object.values(nameToSiblingIds).flat())];
console.log("Querying for IDs:", allQueryIds);

const limitDateStr = limitDate.toISOString().split("T")[0];

const { data: teamAllEntries } = await supabase.from('time_entries')
  .select('person_id, hours')
  .in('person_id', allQueryIds)
  .gte('date', project.start_date)
  .lte('date', limitDateStr);

const actualLoggedMap = {};
teamAllEntries.forEach(entry => {
    actualLoggedMap[entry.person_id] = (actualLoggedMap[entry.person_id] || 0) + Number(entry.hours);
});

let completenessSum = 0;
let teamCount = 0;

activePeopleNames.forEach(normName => {
    const siblingIds = nameToSiblingIds[normName] || [];
    let actualHoursSum = 0;
    siblingIds.forEach(sid => {
        actualHoursSum += actualLoggedMap[sid] || 0;
    });

    const expectedHours = 7.5 * workingDaysSoFar;

    if (expectedHours > 0) {
        teamCount++;
        let pct = (actualHoursSum / expectedHours) * 100;
        pct = Math.min(100, Math.max(0, pct));
        completenessSum += pct;
    }
});

let completenessPct = 100;
if (teamCount > 0) {
    completenessPct = Math.round(completenessSum / teamCount);
}

console.log("Completeness Pct:", completenessPct);

// Assume actual cost is 8445.8
const totalActualCost = 8445.80;
const isProjectCompleted = new Date(project.end_date) < new Date();

let grossedUpActualCost = totalActualCost;
if (completenessPct < 95 && !isProjectCompleted) {
    const factor = 100 / Math.max(50, completenessPct);
    grossedUpActualCost = totalActualCost * factor;
}

console.log("Grossed Up Actual Cost:", grossedUpActualCost);

