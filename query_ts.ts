import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient('https://hyfgyfuvligacjwxjnce.supabase.co', 'sb_publishable_UhHtt6QptJ1ujNZpohjJfA_S8lHrwvh');

async function main() {
  const { data: projects, error: pErr } = await supabase
    .from('projects')
    .select('id, title')
    .ilike('title', '%Football Centric%');
  if (pErr) console.error(pErr);

  if (!projects || projects.length === 0) return;
  const projectId = projects[0].id;
  console.log('Project ID:', projectId, 'Title:', projects[0].title);

  // 6 months window logic that matches ProfitabilityPage
  // `subMonths(new Date(), 6)`
  // let's use exact start of month 6 months ago? No, period = 6 months uses subMonths(new Date(), 6)
  // Wait, in ProfitabilityPage: 
  // const cutoffDate = format(startOfMonth(subMonths(new Date(), parseInt(timePeriod))), "yyyy-MM-dd");
  // const endDateStr = format(endOfMonth(subMonths(new Date(), 1)), "yyyy-MM-dd");
  // Wait, no, custom dates or '6'? Time period is "6" by default.
  // cutoffDate = startOfMonth(subMonths(new Date(), 6))
  // endDateStr = endOfMonth(subMonths(new Date(), 1))

  const subMonths = (date, months) => {
    date.setMonth(date.getMonth() - months);
    return date;
  };
  const d1 = subMonths(new Date(), 6);
  d1.setDate(1); // startOfMonth
  const cutoffDate = d1.toISOString().split('T')[0];

  const d2 = subMonths(new Date(), 1);
  // endOfMonth
  const endOfMonth = new Date(d2.getFullYear(), d2.getMonth() + 1, 0);
  const endDateStr = endOfMonth.toISOString().split('T')[0];

  console.log('cutoffDate:', cutoffDate, 'endDateStr:', endDateStr);

  const { data: util, error: uErr } = await supabase.rpc('get_utilisation_summary', {
    _start_date: cutoffDate,
    _end_date: endDateStr
  });
  if (uErr) console.error('Util Err:', uErr);

  const projectUtil = (util || []).filter(u => u.project_id === projectId);
  console.log('Project Utilisation (hours logged on this project in the window):', projectUtil);

  // Get ALL people who logged time on this project EVER, because completeness checks all-time assignment?
  // Wait, in ProfitabilityPage:
  // "Group by project using all-time data so we don't miss people who didn't log time in the window"
  // It gets allTimeProjectPersonHours.
  const { data: allTimeUtil, error: atErr } = await supabase.rpc('get_project_person_hours');
  if (atErr) console.error('All Time Util Err:', atErr);
  
  const allTimeProjectUtil = (allTimeUtil || []).filter(u => u.project_id === projectId);
  
  // people IDs to consider: all people in allTimeProjectUtil
  const personIds = Array.from(new Set(allTimeProjectUtil.map(u => u.person_id)));
  console.log('People who ever logged time on this project:', personIds);

  if (personIds.length === 0) return;

  const { data: people, error: peErr } = await supabase
    .from('people')
    .select('id, name, team, employment_start_date, overall_start_date, overall_end_date, employment_end_date')
    .in('id', personIds);
  if (peErr) console.error('People Err:', peErr);

  const { data: capped, error: cErr } = await supabase.rpc('get_person_capped_hours', {
    _start_date: cutoffDate,
    _end_date: endDateStr
  });
  if (cErr) console.error('Capped Err:', cErr);
  const cappedMap = new Map((capped || []).map(c => [c.person_id, c.capped_hours]));

  const BILLABLE_TEAMS = new Set(["companion", "studio", "strategy & consultancy", "design & technology", "client services & delivery", "data & analytics"]);

  let sumComps = 0;
  let countComps = 0;

  for (const person of people) {
    const isBillable = person.team && BILLABLE_TEAMS.has(person.team.toLowerCase());
    if (!isBillable) continue;

    const loggedHoursOnProject = projectUtil.find(u => u.person_id === person.id)?.total_hours || 0;
    if (loggedHoursOnProject <= 0) continue; // Only include people who actually logged time to this project in the mean calculation

    // calculate their overall expected hours
    // (mocking working days - we'll just report their actual capped hours for now)
    const actual = cappedMap.get(person.id) || 0;
    
    console.log(`Person: ${person.name} | Team: ${person.team} | Logged on project: ${loggedHoursOnProject} | Overall Logged (Actual): ${actual}`);
    
    // We can't perfectly calc expected without parental leave map, but let's approximate or just fetch from API
  }
}

main();
