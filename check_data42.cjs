const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const { eachDayOfInterval, isWeekend } = require('date-fns');

const envStr = fs.readFileSync('.env', 'utf8');
const env = {};
envStr.split('\n').forEach(line => {
  const i = line.indexOf('=');
  if (i > 0) {
    const k = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim();
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
    env[k] = v;
  }
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const startDate = new Date('2026-04-01T00:00:00Z');
  const endDate = new Date('2026-04-30T00:00:00Z');
  
  let people = [];
  let pFrom = 0;
  while (true) {
     const { data } = await supabase.from('people').select('*').eq('office', 'United Kingdom').range(pFrom, pFrom + 999);
     if (!data || data.length === 0) break;
     people = people.concat(data);
     if (data.length < 1000) break;
     pFrom += 1000;
  }
  
  const { data: allPeople } = await supabase.from('people').select('*');
  const allowedTeams = new Set(
    allPeople
      .map(p => (p.team || "Unassigned").toLowerCase().trim())
      .filter(t => t && t !== "directors" && t !== "contractors" && t !== "unassigned")
  );
  
  let rawEntries = [];
  let tFrom = 0;
  while (true) {
     const { data, error } = await supabase.from('time_entries')
      .select('id, person_id, project_id, date, hours, notes')
      .gte('date', '2026-04-01')
      .lte('date', '2026-04-30')
      .range(tFrom, tFrom + 999);
     if (error) throw error;
     if (!data || data.length === 0) break;
     rawEntries = rawEntries.concat(data);
     if (data.length < 1000) break;
     tFrom += 1000;
  }
  
  const hoursByPerson = {};
  for (const e of rawEntries) {
    if (!hoursByPerson[e.person_id]) hoursByPerson[e.person_id] = 0;
    hoursByPerson[e.person_id] += Number(e.hours);
  }
  
  const nameTeamToIds = new Map();
  for (const p of people) {
    const key = `${p.name.trim().toLowerCase()}::${p.team || "Unassigned"}`;
    if (!nameTeamToIds.has(key)) nameTeamToIds.set(key, []);
    nameTeamToIds.get(key).push(p.id);
  }
  
  const deduped = new Map();
  const HOURS_PER_DAY = 7.5;
  
  for (const person of people) {
    const team = (person.team || "").toLowerCase().trim();
    if (!allowedTeams.has(team)) continue;
    
    const empStart = person.employment_start_date ? new Date(person.employment_start_date) : (person.overall_start_date ? new Date(person.overall_start_date) : null);
    const empEnd = person.employment_end_date ? new Date(person.employment_end_date) : (person.overall_end_date ? new Date(person.overall_end_date) : null);
    
    if (empStart && empStart > endDate) continue;
    if (empEnd && empEnd < startDate) continue;
    
    const effectiveStart = empStart && empStart > startDate ? empStart : startDate;
    const effectiveEnd = empEnd && empEnd < endDate ? empEnd : endDate;
    if (effectiveStart > effectiveEnd) continue;
    
    const dedupKey = `${person.name.trim().toLowerCase()}::${person.team || "Unassigned"}`;
    
    let existing = deduped.get(dedupKey);
    if (!existing) {
       const siblingIds = nameTeamToIds.get(dedupKey);
       let actual = 0;
       for (const sid of siblingIds) {
          actual += (hoursByPerson[sid] || 0);
       }
       existing = {
         id: person.id,
         name: person.name,
         actualHours: actual,
         expectedTotalHours: 0,
         countedDays: new Set(),
         hasEnded: true
       };
       deduped.set(dedupKey, existing);
    }
    
    const days = eachDayOfInterval({ start: effectiveStart, end: effectiveEnd });
    for (const d of days) {
       if (isWeekend(d)) continue;
       const dk = d.toISOString().slice(0, 10);
       if (!existing.countedDays.has(dk)) {
          existing.countedDays.add(dk);
          existing.expectedTotalHours += HOURS_PER_DAY;
       }
    }
    
    const overallEnd = person.overall_end_date ? new Date(person.overall_end_date) : null;
    const thisEnded = overallEnd ? overallEnd < new Date() : false;
    if (!thisEnded) existing.hasEnded = false;
  }
  
  let currentExpected = 0;
  let currentActual = 0;
  let currentCount = 0;
  
  const currentPeople = Array.from(deduped.values()).filter(p => !p.hasEnded);
  for (const p of currentPeople) {
    currentExpected += p.expectedTotalHours;
    currentActual += p.actualHours;
    currentCount++;
  }
  
  console.log(`APRIL 2026 - UK Current Only: Count=${currentCount}, Expected=${currentExpected}, Actual=${currentActual}`);
  
  const dailySums = {};
  for (const e of rawEntries) {
    const key = `${e.person_id}_${e.date}`;
    if (!dailySums[key]) dailySums[key] = 0;
    dailySums[key] += Number(e.hours);
  }
  
  let countOver15 = 0;
  let countOver10 = 0;
  for (const [key, sum] of Object.entries(dailySums)) {
     if (sum > 15) countOver15++;
     if (sum > 10) countOver10++;
  }
  
  console.log(`Person-Days with >15 hours: ${countOver15}`);
  console.log(`Person-Days with >10 hours: ${countOver10}`);
}
run();
