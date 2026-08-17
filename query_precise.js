import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient('https://hyfgyfuvligacjwxjnce.supabase.co', 'sb_publishable_UhHtt6QptJ1ujNZpohjJfA_S8lHrwvh');

async function main() {
  const projectId = '4374255d-4343-57d0-b641-f85a66839e37';
  const cutoffDateStr = "2026-02-01";
  const endDateStr = "2026-08-17";

  const windowStart = new Date(cutoffDateStr);
  const windowEnd = new Date(endDateStr);

  const { data: allPeople } = await supabase.from('people').select('*');
  
  // build parental leave map
  const parentalLeaveMap = new Map();
  for (const p of allPeople) {
    const team = (p.team || "").toLowerCase().trim();
    if (team !== "parental leave") continue;
    const start = p.employment_start_date ? new Date(p.employment_start_date) : null;
    const end = p.employment_end_date ? new Date(p.employment_end_date) : null;
    if (!start || !end) continue;
    const normName = p.name.trim().toLowerCase();
    if (!parentalLeaveMap.has(normName)) parentalLeaveMap.set(normName, []);
    parentalLeaveMap.get(normName).push({ start, end });
  }

  function getWorkingDaysExcludingLeave(start, end, leaveIntervals) {
    if (start > end) return 0;
    let days = 0;
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      if (d.getDay() !== 0 && d.getDay() !== 6) { // not weekend
        let isOnLeave = false;
        if (leaveIntervals) {
           const time = d.getTime();
           isOnLeave = leaveIntervals.some(iv => time >= iv.start.getTime() && time <= iv.end.getTime());
        }
        if (!isOnLeave) {
          days++;
        }
      }
    }
    return days;
  }

  // get capped hours
  const { data: capped } = await supabase.rpc('get_person_capped_hours', {
    _start_date: cutoffDateStr,
    _end_date: endDateStr
  });
  const cappedMap = new Map((capped || []).map(c => [c.person_id, c.capped_hours]));
  
  const { data: projectUtil } = await supabase.rpc('get_utilisation_summary', {
    _start_date: cutoffDateStr,
    _end_date: endDateStr
  });
  const projUtil = projectUtil.filter(u => u.project_id === projectId);
  const projPersonIds = projUtil.map(u => u.person_id);

  const { data: allTimeUtil } = await supabase.rpc('get_project_person_hours');
  const allTimeProjectUtil = (allTimeUtil || []).filter(u => u.project_id === projectId);
  
  const personIds = Array.from(new Set([...allTimeProjectUtil.map(u => u.person_id), ...projPersonIds]));
  
  const BILLABLE_TEAMS = new Set(["account management", "strategy", "creative team", "paid media", "project management", "business affairs", "data", "production"]);
  
  let sumComps = 0;
  let countComps = 0;
  
  const output = [];

  for (const personId of personIds) {
    const person = allPeople.find(p => p.id === personId);
    if (!person) continue;

    const isBillable = person.team && BILLABLE_TEAMS.has(person.team.toLowerCase());
    if (!isBillable) continue;

    const loggedOnProj = projUtil.find(u => u.person_id === person.id)?.total_hours || 0;
    if (loggedOnProj <= 0) continue;

    const actual = cappedMap.get(person.id) || 0;

    const empStart = person.employment_start_date || person.overall_start_date;
    const empEnd = person.employment_end_date || person.overall_end_date;
    
    let effectiveStart = empStart && new Date(empStart) > windowStart ? new Date(empStart) : windowStart;
    let effectiveEnd = empEnd && new Date(empEnd) < windowEnd ? new Date(empEnd) : windowEnd;

    if (effectiveStart > effectiveEnd) continue;

    const normName = (person.name || "").trim().toLowerCase();
    const leaveIntervals = parentalLeaveMap.get(normName);
    const workingDays = getWorkingDaysExcludingLeave(effectiveStart, effectiveEnd, leaveIntervals);
    
    const expected = workingDays * 7.5;
    const comp = expected > 0 ? Math.min(actual / expected, 1) : 1;

    output.push({
      name: person.name,
      team: person.team,
      loggedProj: loggedOnProj.toFixed(2),
      actual: actual.toFixed(2),
      expected: expected.toFixed(2),
      completeness: (comp * 100).toFixed(2) + '%'
    });

    sumComps += comp;
    countComps++;
  }

  console.table(output);
  if (countComps > 0) console.log('Average completeness:', ((sumComps / countComps) * 100).toFixed(2) + '%');

}
main();
