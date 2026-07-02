import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { eachDayOfInterval, isWeekend, format } from 'date-fns';

const envPath = path.join('/Users/jamesbrazier/Documents/GitHub/PRIZM', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    let key = match[1].trim();
    let val = match[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.substring(1, val.length - 1);
    }
    env[key] = val;
  }
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY);

const HOURS_PER_DAY = 7.5;
const startDate = new Date("2026-05-01");
const endDate = new Date("2026-05-31");

const allowedTeams = new Set(["account management", "strategy", "strategy and innovation", "creative team", "paid media", "project management", "business affairs", "data"]);

const matchesOffice = (office, filter) => {
  if (filter === "Global") return true;
  if (!office) return false;
  const o = office.toUpperCase();
  if (filter === "UK") return o === "UK" || o === "UNITED KINGDOM" || o === "COMPANION";
  return false;
};

async function run() {
  try {
    const { data: people, error: pError } = await supabase
      .from('people')
      .select('*, roles(name, billable_capacity_hours)');
    if (pError) throw pError;

    let timeEntries = [];
    let tFrom = 0;
    const T_PAGE_SIZE = 1000;
    while (true) {
      const { data, error } = await supabase
        .from('time_entries')
        .select('person_id, hours, date')
        .gte('date', '2026-05-01')
        .lte('date', '2026-05-31')
        .range(tFrom, tFrom + T_PAGE_SIZE - 1);
      if (error) throw error;
      timeEntries = timeEntries.concat(data || []);
      if (!data || data.length < T_PAGE_SIZE) break;
      tFrom += T_PAGE_SIZE;
    }

    const hoursByPerson = new Map();
    for (const e of timeEntries) {
      hoursByPerson.set(e.person_id, (hoursByPerson.get(e.person_id) || 0) + Number(e.hours));
    }

    const nameTeamToIds = new Map();
    for (const p of people) {
      const normName = p.name.trim().toLowerCase();
      const teamKey = p.team || "Unassigned";
      const key = `${normName}::${teamKey}`;
      if (!nameTeamToIds.has(key)) nameTeamToIds.set(key, []);
      nameTeamToIds.get(key).push(p.id);
    }

    const deduped = new Map();
    for (const person of people) {
      if (!matchesOffice(person.office, "UK")) continue;
      const team = (person.team || "").toLowerCase().trim();
      if (!allowedTeams.has(team)) continue;

      const empStart = person.employment_start_date ? new Date(person.employment_start_date) : (person.overall_start_date ? new Date(person.overall_start_date) : null);
      const empEnd = person.employment_end_date ? new Date(person.employment_end_date) : (person.overall_end_date ? new Date(person.overall_end_date) : null);
      if (empStart && empStart > endDate) continue;
      if (empEnd && empEnd < startDate) continue;

      const normName = person.name.trim().toLowerCase();
      const dedupKey = `${normName}::${person.team || "Unassigned"}`;
      const existing = deduped.get(dedupKey);

      const effectiveStart = empStart && empStart > startDate ? empStart : startDate;
      const effectiveEnd = empEnd && empEnd < endDate ? empEnd : endDate;

      if (existing) {
          // Check for overlapping dates to avoid double counting expected hours
          const days = eachDayOfInterval({ start: effectiveStart, end: effectiveEnd });
          let newWorkingDays = 0;
          for (const d of days) {
            if (isWeekend(d)) continue;
            const dk = d.toISOString().slice(0, 10);
            if (!existing.countedDays.has(dk)) {
              existing.countedDays.add(dk);
              newWorkingDays++;
            } else {
              // This day was already counted! This is an overlap.
              existing.overlaps = (existing.overlaps || 0) + 1;
            }
          }
          existing.expected += newWorkingDays * HOURS_PER_DAY;
          if (!existing.personIds.includes(person.id)) existing.personIds.push(person.id);
      } else {
          const siblingIds = nameTeamToIds.get(dedupKey) || [person.id];
          let actual = 0;
          for (const sid of siblingIds) {
            actual += (hoursByPerson.get(sid) || 0);
          }
          const countedDays = new Set();
          const days = eachDayOfInterval({ start: effectiveStart, end: effectiveEnd });
          let workingDays = 0;
          for (const d of days) {
            if (!isWeekend(d)) {
              workingDays++;
              countedDays.add(d.toISOString().slice(0, 10));
            }
          }

          deduped.set(dedupKey, {
            name: person.name,
            team: person.team,
            expected: workingDays * HOURS_PER_DAY,
            actual: actual,
            personIds: [...siblingIds],
            countedDays: countedDays,
            overlaps: 0
          });
      }
    }

    const results = Array.from(deduped.values()).filter(r => {
        // Filter for "current" only - using overall_end_date
        const person = people.find(p => p.id === r.personIds[0]);
        const overallEnd = person?.overall_end_date ? new Date(person.overall_end_date) : null;
        return !overallEnd || overallEnd >= new Date();
    });

    let totalExpected = 0;
    let totalActual = 0;
    let sumCappedComp = 0;
    for (const r of results) {
        totalExpected += r.expected;
        totalActual += r.actual;
        sumCappedComp += Math.min((r.actual / r.expected) * 100, 100);
    }

    console.log(`Total People: ${results.length}`);
    console.log(`Total Expected Hours: ${totalExpected.toFixed(1)}`);
    console.log(`Total Actual Hours: ${totalActual.toFixed(1)}`);
    console.log(`Overall Completeness (Capped): ${(sumCappedComp / results.length).toFixed(1)}%`);

    console.log("\n=== PEOPLE WITH OVERLAPS ===");
    results.filter(r => r.overlaps > 0).forEach(r => {
        console.log(`- ${r.name} (${r.team}): ${r.overlaps} overlapping working days [IDs: ${r.personIds.length}]`);
    });

    console.log("\n=== TEAM BREAKDOWN ===");
    const teamMap = new Map();
    for (const r of results) {
        if (!teamMap.has(r.team)) teamMap.set(r.team, { count: 0, sumComp: 0, expected: 0, actual: 0 });
        const t = teamMap.get(r.team);
        t.count++;
        t.sumComp += Math.min((r.actual / r.expected) * 100, 100);
        t.expected += r.expected;
        t.actual += r.actual;
    }
    for (const [team, t] of teamMap.entries()) {
        console.log(`${team}: ${(t.sumComp / t.count).toFixed(1)}% completeness (${t.actual.toFixed(1)}h / ${t.expected.toFixed(1)}h)`);
    }

    console.log("\n=== INCOMPLETE PEOPLE ( < 90% ) ===");
    results.filter(r => (r.actual/r.expected) < 0.9).sort((a,b) => (a.actual/a.expected) - (b.actual/b.expected)).forEach(r => {
        console.log(`- ${r.name} (${r.team}): ${((r.actual/r.expected)*100).toFixed(1)}% (${r.actual.toFixed(1)}h / ${r.expected.toFixed(1)}h)`);
    });

  } catch (err) {
    console.error("Error:", err);
  }
}
run();
