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

  let allPeople = [];
  let from = 0;
  let hasMore = true;
  while (hasMore) {
    const { data } = await supabase.from('people').select('*').range(from, from + 999);
    if (!data || data.length === 0) hasMore = false;
    else {
      allPeople = allPeople.concat(data);
      from += 1000;
    }
  }
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
  const rawPersonIds = Array.from(new Set([...allTimeProjectUtil.map(u => u.person_id), ...projPersonIds]));
  
  const BILLABLE_TEAMS = new Set(["account management", "strategy", "creative team", "paid media", "project management", "business affairs", "data", "production"]);
  
  // Find unique people who worked on the project
  const uniqueNames = new Set();
  for (const pid of rawPersonIds) {
    const p = allPeople.find(x => x.id === pid);
    if (p) uniqueNames.add(p.name.trim().toLowerCase());
  }

  let sumComps = 0;
  let countComps = 0;
  const output = [];

  for (const normName of uniqueNames) {
    // get all contracts for this person
    const siblings = allPeople.filter(p => (p.name || "").trim().toLowerCase() === normName);
    const primary = siblings[0];
    
    const isBillable = primary.team && BILLABLE_TEAMS.has(primary.team.toLowerCase());
    if (!isBillable) continue;

    // sum up logged project hours across all contracts
    let totalProjLogged = 0;
    let totalActual = 0;
    let totalExpected = 0;

    for (const contract of siblings) {
      totalProjLogged += projUtil.find(u => u.person_id === contract.id)?.total_hours || 0;
      totalActual += cappedMap.get(contract.id) || 0;
      
      const rowStart = contract.employment_start_date ? new Date(contract.employment_start_date) : null;
      const rowEnd = contract.employment_end_date ? new Date(contract.employment_end_date) : null;
      if (rowStart && rowStart > windowEnd) continue;
      if (rowEnd && rowEnd < windowStart) continue;

      const empStart = contract.employment_start_date ? new Date(contract.employment_start_date) : (contract.overall_start_date ? new Date(contract.overall_start_date) : null);
      const empEnd = contract.employment_end_date ? new Date(contract.employment_end_date) : (contract.overall_end_date ? new Date(contract.overall_end_date) : null);

      let effectiveStart = empStart && empStart > windowStart ? empStart : windowStart;
      let effectiveEnd = empEnd && empEnd < windowEnd ? empEnd : windowEnd;

      if (effectiveStart > effectiveEnd) continue;

      const leaveIntervals = parentalLeaveMap.get(normName);
      const workingDays = getWorkingDaysExcludingLeave(effectiveStart, effectiveEnd, leaveIntervals);
      totalExpected += workingDays * 7.5;
      
      if (normName === 'meghan mckenna') {
          console.log('Meghan contract:', rowStart, rowEnd, 'workingDays:', workingDays, 'expected added:', workingDays * 7.5);
      }
    }

    if (normName === 'meghan mckenna') {
      console.log('Meghan Total Siblings in allPeople:', siblings.length);
    }

    if (totalProjLogged <= 0) continue;

    const comp = totalExpected > 0 ? Math.min(totalActual / totalExpected, 1) : 1;

    output.push({
      name: primary.name,
      team: primary.team,
      loggedProj: totalProjLogged.toFixed(2),
      actual: totalActual.toFixed(2),
      expected: totalExpected.toFixed(2),
      completeness: (comp * 100).toFixed(2) + '%'
    });

    sumComps += comp;
    countComps++;
  }

  console.table(output);
  if (countComps > 0) console.log('True Average Completeness:', ((sumComps / countComps) * 100).toFixed(2) + '%');
}
main();
