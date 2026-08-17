const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient('https://hyfgyfuvligacjwxjnce.supabase.co', 'sb_publishable_UhHtt6QptJ1ujNZpohjJfA_S8lHrwvh');

async function main() {
    const appliedStartDate = '2026-02-01';
    const appliedEndDate = '2026-08-17';
    
    // 1. Fetch people
    let people = [];
    let from = 0;
    while (true) {
        const { data } = await supabase.from('people').select('*').order('id').range(from, from + 999);
        if (!data || data.length === 0) break;
        people = people.concat(data);
        if (data.length < 1000) break;
        from += 1000;
    }

    // 2. Fetch utilisationSummary
    let utilisationSummary = [];
    from = 0;
    while (true) {
        const { data } = await supabase.rpc('get_utilisation_summary', {
            _start_date: appliedStartDate,
            _end_date: appliedEndDate
        }).order('project_id').order('person_id').range(from, from + 999);
        if (!data || data.length === 0) break;
        utilisationSummary = utilisationSummary.concat(data);
        if (data.length < 1000) break;
        from += 1000;
    }

    // 3. Fetch personCappedHours
    let personCappedHours = [];
    from = 0;
    while (true) {
        const { data } = await supabase.rpc('get_person_capped_hours', {
            _start_date: appliedStartDate,
            _end_date: appliedEndDate
        }).order('person_id').range(from, from + 999);
        if (!data || data.length === 0) break;
        personCappedHours = personCappedHours.concat(data);
        if (data.length < 1000) break;
        from += 1000;
    }

    // 4. Fetch allTimeProjectPersonHours
    let allTimeProjectPersonHours = [];
    from = 0;
    while (true) {
        const { data } = await supabase.rpc('get_project_person_hours').order('project_id').order('person_id').range(from, from + 999);
        if (!data || data.length === 0) break;
        allTimeProjectPersonHours = allTimeProjectPersonHours.concat(data);
        if (data.length < 1000) break;
        from += 1000;
    }

    let projects = [];
    from = 0;
    while (true) {
        const { data } = await supabase.from('projects').select('*').order('id').range(from, from + 999);
        if (!data || data.length === 0) break;
        projects = projects.concat(data);
        if (data.length < 1000) break;
        from += 1000;
    }
    const projectsById = new Map();
    for (const p of projects) projectsById.set(p.id, p);

    const targetProject = projectsById.get('4374255d-4343-57d0-b641-f85a66839e37');
    console.log('Target project id:', targetProject ? targetProject.id : 'not found');
    if (!targetProject) return;

    // Reproduce logic

    const parentalLeaveMap = new Map();
    for (const p of people) {
      if ((p.team || "").toLowerCase().trim() !== "parental leave") continue;
      const start = p.employment_start_date ? new Date(p.employment_start_date) : null;
      const end = p.employment_end_date ? new Date(p.employment_end_date) : null;
      if (!start || !end) continue;
      
      const normName = (p.name || "").trim().toLowerCase();
      if (!parentalLeaveMap.has(normName)) parentalLeaveMap.set(normName, []);
      parentalLeaveMap.get(normName).push({ start, end });
    }

    function getWorkingDaysExcludingLeave(start, end, leaveIntervals) {
      let days = 0;
      let curr = new Date(start);
      while (curr <= end) {
          const day = curr.getDay();
          if (day !== 0 && day !== 6) {
              let isLeave = false;
              if (leaveIntervals) {
                  for (const interval of leaveIntervals) {
                      if (curr >= interval.start && curr <= interval.end) {
                          isLeave = true;
                          break;
                      }
                  }
              }
              if (!isLeave) days++;
          }
          curr.setDate(curr.getDate() + 1);
      }
      return days;
    }

    const BILLABLE_TEAMS = new Set(["account management", "business affairs", "creative team", "design", "planning", "production", "strategy"]);
    const HOURS_PER_DAY = 7.5;
    const today = new Date();

    const projectPeopleMap = new Map();
    for (const row of allTimeProjectPersonHours) {
      if (!projectPeopleMap.has(row.project_id)) projectPeopleMap.set(row.project_id, new Set());
      projectPeopleMap.get(row.project_id).add(row.person_id);
    }

    const projectPersonHoursMap = new Map();
    for (const row of utilisationSummary) {
      if (!row.person_id) continue;
      if (row.project_id) {
        if (!projectPersonHoursMap.has(row.project_id)) projectPersonHoursMap.set(row.project_id, new Map());
        projectPersonHoursMap.get(row.project_id).set(row.person_id, Number(row.total_hours));
        if (!projectPeopleMap.has(row.project_id)) projectPeopleMap.set(row.project_id, new Set());
        projectPeopleMap.get(row.project_id).add(row.person_id);
      }
    }

    const personCappedHoursMap = new Map();
    for (const row of personCappedHours) {
      personCappedHoursMap.set(row.person_id, Number(row.capped_hours));
    }

    const windowStart = new Date(appliedStartDate);
    const windowEndRaw = new Date(appliedEndDate);
    const windowEnd = windowEndRaw > today ? today : windowEndRaw;

    const siblingsByName = new Map();
    for (const person of people) {
      if (!person.team || !BILLABLE_TEAMS.has(person.team.toLowerCase())) continue;
      const normName = (person.name || "").trim().toLowerCase();
      if (!siblingsByName.has(normName)) siblingsByName.set(normName, []);
      siblingsByName.get(normName).push(person);
    }

    const nameToComp = new Map();

    for (const [normName, siblings] of siblingsByName.entries()) {
      let totalExpected = 0;
      let totalActual = 0;
      
      let _debug = normName === 'meghan mckenna';

      for (const contract of siblings) {
        const empStart = contract.employment_start_date || contract.overall_start_date;
        const empEnd = contract.employment_end_date || contract.overall_end_date;
        
        let effectiveStart = empStart && new Date(empStart) > windowStart ? new Date(empStart) : windowStart;
        let effectiveEnd = empEnd && new Date(empEnd) < windowEnd ? new Date(empEnd) : windowEnd;

        if (effectiveStart > effectiveEnd) continue;

        const leaveIntervals = parentalLeaveMap.get(normName);
        const workingDays = getWorkingDaysExcludingLeave(effectiveStart, effectiveEnd, leaveIntervals);
        
        totalExpected += workingDays * HOURS_PER_DAY;
        totalActual += personCappedHoursMap.get(contract.id) || 0;
        
        if (_debug) {
            console.log('Meghan Contract:', contract.id, contract.employment_start_date, 'to', contract.employment_end_date, 'workingDays:', workingDays, 'actual:', personCappedHoursMap.get(contract.id) || 0);
        }
      }
      
      const comp = totalExpected > 0 ? Math.min(totalActual / totalExpected, 1) : 1;
      nameToComp.set(normName, comp);
      if (_debug) {
          console.log('Meghan totalExpected:', totalExpected, 'totalActual:', totalActual, 'comp:', comp);
      }
    }

    const projectComp = new Map();
    
    const idToName = new Map();
    for (const person of people) {
      idToName.set(person.id, (person.name || "").trim().toLowerCase());
    }

    for (const [projId, personIds] of projectPeopleMap) {
      const proj = projectsById.get(projId);
      if (!proj) continue;
      if (projId !== targetProject.id) continue;
      
      const hoursMap = projectPersonHoursMap.get(projId);

      let sumComps = 0;
      let countComps = 0;
      let validPeopleCount = 0;

      const uniqueNamesOnProject = new Set();
      for (const pid of personIds) {
        const normName = idToName.get(pid);
        if (normName && nameToComp.has(normName)) {
            uniqueNamesOnProject.add(normName);
            validPeopleCount++;
        }
      }

      console.log('Unique names on project:', Array.from(uniqueNamesOnProject));

      for (const normName of uniqueNamesOnProject) {
        let totalLoggedOnProj = 0;
        const siblings = siblingsByName.get(normName) || [];
        for (const contract of siblings) {
            totalLoggedOnProj += hoursMap?.get(contract.id) || 0;
        }
        
        if (totalLoggedOnProj <= 0) {
            console.log('Skipping', normName, 'because 0 hours on project');
            continue; 
        }

        const personComp = nameToComp.get(normName);
        console.log('Including', normName, 'with comp', personComp);
        sumComps += personComp;
        countComps++;
      }

      if (countComps > 0) {
        const projCompPct = (sumComps / countComps) * 100;
        console.log('Final Proj Comp:', projCompPct);
      }
    }
}
main();
