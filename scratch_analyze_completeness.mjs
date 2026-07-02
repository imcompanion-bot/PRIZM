import { initializeApp } from 'firebase/app';
import { listPeople, getAllTimeEntries } from './src/dataconnect-generated/esm/index.esm.js';
import fs from 'fs';
import path from 'path';
import { format, startOfWeek, endOfWeek, eachWeekOfInterval, eachDayOfInterval, isWeekend } from 'date-fns';

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

const firebaseConfig = {
  projectId: "pharaoh-54a0e",
  appId: "1:909637352706:web:98a9ef33d6b680d6e8d61b",
  storageBucket: "pharaoh-54a0e.firebasestorage.app",
  apiKey: "AIzaSyBWy2AP5d-YTdpirVipzs2tvd0hVqqfeIw",
  authDomain: "pharaoh-54a0e.firebaseapp.com",
  messagingSenderId: "909637352706",
};

initializeApp(firebaseConfig);

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
    const dcRes = await listPeople();
    const dcPeople = dcRes.data.peoples || [];

    const timeRes = await getAllTimeEntries();
    const allTimeEntries = timeRes.data.timeEntriess || [];

    const startDate = new Date("2026-05-01");
    const endDate = new Date("2026-05-31");

    // Filter time entries for May 2026
    const mayEntries = allTimeEntries.filter(e => {
        const d = new Date(e.date);
        return d >= startDate && d <= endDate;
    });

    const hoursByPerson = new Map();
    for (const e of mayEntries) {
        const id = e.person_id;
        hoursByPerson.set(id, (hoursByPerson.get(id) || 0) + Number(e.hours));
    }

    const peopleList = dcPeople.filter(p => {
        if (!matchesOffice(p.office, "UK")) return false;
        const team = (p.team || "").toLowerCase().trim();
        if (!allowedTeams.has(team)) return false;
        if (!p.isActive) return false;
        
        const empStart = p.employment_start_date ? new Date(p.employment_start_date)
          : p.overall_start_date ? new Date(p.overall_start_date) : null;
        const empEnd = p.employment_end_date ? new Date(p.employment_end_date)
          : p.overall_end_date ? new Date(p.overall_end_date) : null;
        
        if (empStart && empStart > endDate) return false;
        if (empEnd && empEnd < startDate) return false;

        return true;
    });

    console.log(`Eligible People (UK Current): ${peopleList.length}`);

    let totalExpected = 0;
    let totalActual = 0;
    let sumCappedCompleteness = 0;

    const results = [];

    for (const p of peopleList) {
        const empStart = p.employment_start_date ? new Date(p.employment_start_date)
          : p.overall_start_date ? new Date(p.overall_start_date) : null;
        const empEnd = p.employment_end_date ? new Date(p.employment_end_date)
          : p.overall_end_date ? new Date(p.overall_end_date) : null;
        
        const effectiveStart = empStart && empStart > startDate ? empStart : startDate;
        const effectiveEnd = empEnd && empEnd < endDate ? empEnd : endDate;

        const days = eachDayOfInterval({ start: effectiveStart, end: effectiveEnd });
        let workingDays = 0;
        for (const d of days) {
            if (!isWeekend(d)) workingDays++;
        }

        const expected = workingDays * 7.5;
        const actual = hoursByPerson.get(p.id) || 0;
        const capped = expected > 0 ? Math.min(actual, expected) : 0;
        const completeness = expected > 0 ? Math.min((actual / expected) * 100, 100) : 0;

        totalExpected += expected;
        totalActual += actual;
        sumCappedCompleteness += completeness;

        results.push({ name: p.name, team: p.team, expected, actual, completeness });
    }

    const overallCompleteness = peopleList.length > 0 ? sumCappedCompleteness / peopleList.length : 0;

    console.log(`Total Expected: ${totalExpected}h`);
    console.log(`Total Actual: ${totalActual}h`);
    console.log(`Overall Completeness (Capped): ${overallCompleteness.toFixed(1)}%`);

    // Group by team
    const teamMap = new Map();
    for (const r of results) {
        if (!teamMap.has(r.team)) teamMap.set(r.team, { count: 0, sumComp: 0, expected: 0, actual: 0 });
        const t = teamMap.get(r.team);
        t.count++;
        t.sumComp += r.completeness;
        t.expected += r.expected;
        t.actual += r.actual;
    }

    console.log("\n=== TEAM BREAKDOWN ===");
    for (const [team, data] of teamMap.entries()) {
        const avgComp = data.sumComp / data.count;
        console.log(`${team}: ${avgComp.toFixed(1)}% completeness (${data.actual.toFixed(1)}h / ${data.expected.toFixed(1)}h expected)`);
    }

    console.log("\n=== INCOMPLETE PEOPLE ( < 100% ) ===");
    results.filter(r => r.completeness < 100).sort((a,b) => a.completeness - b.completeness).forEach(r => {
        console.log(`- ${r.name} (${r.team}): ${r.completeness.toFixed(1)}% (${r.actual}h / ${r.expected}h)`);
    });

  } catch (err) {
    console.error("Error:", err);
  }
}

run();
