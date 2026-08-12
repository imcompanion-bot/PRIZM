const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
const URL = env.match(/VITE_SUPABASE_URL=(.*)/)[1].trim().replace(/^"|"$/g, '');
const KEY = env.match(/VITE_SUPABASE_PUBLISHABLE_KEY=(.*)/)[1].trim().replace(/^"|"$/g, '');
const { createClient } = require('@supabase/supabase-js');
const { eachDayOfInterval, isWeekend } = require('date-fns');
const supabase = createClient(URL, KEY);

function getWorkingDaysExcludingLeave(start, end) {
  if (start > end) return 0;
  const days = eachDayOfInterval({ start, end });
  return days.filter(d => !isWeekend(d)).length;
}

async function run() {
  const projId = '97ccc513-3a38-5c75-8083-0be6dd6804e6';
  const { data: projData } = await supabase.from('projects').select('*').eq('id', projId).single();
  const { data: projectPersonHours } = await supabase.rpc("get_project_person_hours").eq('project_id', projId);
  const personIds = projectPersonHours.map(r => r.person_id);
  const { data: people } = await supabase.from('people').select('*').in('id', personIds);

  const peopleById = new Map();
  for (const p of people) peopleById.set(p.id, p);

  const projStart = new Date(projData.start_date);
  const today = new Date();
  const projEnd = new Date(projData.end_date) < today ? new Date(projData.end_date) : today;
  
  const windowStart = new Date("2026-01-30");
  const windowEndRaw = new Date("2026-07-30");
  const windowEnd = windowEndRaw > today ? today : windowEndRaw;

  let projectExpected = 0;

  for (const pid of personIds) {
    const person = peopleById.get(pid);
    if (!person) continue;

    const empStart = person.overall_start_date || person.employment_start_date;
    const empEnd = person.overall_end_date || person.employment_end_date;

    let effectiveStart = empStart && new Date(empStart) > projStart ? new Date(empStart) : projStart;
    let effectiveEnd = empEnd && new Date(empEnd) < projEnd ? new Date(empEnd) : projEnd;

    effectiveStart = effectiveStart > windowStart ? effectiveStart : windowStart;
    effectiveEnd = effectiveEnd < windowEnd ? effectiveEnd : windowEnd;

    console.log(`\nPerson: ${person.name}`);
    console.log(`empStart: ${empStart}, empEnd: ${empEnd}`);
    console.log(`effectiveStart: ${effectiveStart.toISOString()}`);
    console.log(`effectiveEnd: ${effectiveEnd.toISOString()}`);
    
    if (effectiveStart > effectiveEnd) {
      console.log(`SKIPPED: effectiveStart > effectiveEnd`);
      continue;
    }

    const workingDays = getWorkingDaysExcludingLeave(effectiveStart, effectiveEnd);
    const expected = workingDays * 7.5;
    console.log(`workingDays: ${workingDays}, expected: ${expected}`);
    
    projectExpected += expected;
  }
  
  console.log(`\nFinal projectExpected: ${projectExpected}`);
}
run();
