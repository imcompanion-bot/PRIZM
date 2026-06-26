import { initializeApp } from 'firebase/app';
import { getTimeEntriesByDateRange, listProjects, listPeople, listBillabilityRules, listBillabilityRuleConditions } from './src/dataconnect-generated/esm/index.esm.js';
import fs from 'fs';
import path from 'path';

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

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY;

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
  if (filter === "US") return o === "US" || o === "UNITED STATES";
  return false;
};

function evaluateCondition(cond, entry, projectExists, proj) {
  switch (cond.field) {
    case "has_project_code": {
      const has = entry.project_id !== null;
      return cond.operator === "is_true" ? has : !has;
    }
    case "project_in_projects": {
      const exists = projectExists && entry.project_id !== null;
      return cond.operator === "is_true" ? exists : !exists;
    }
    case "has_revenue": {
      const has = proj?.revenue != null && proj.revenue > 0;
      return cond.operator === "is_true" ? has : !has;
    }
    case "opportunity_record_type": {
      const val = proj?.opportunity_record_type || "";
      if (cond.operator === "equals") return val === cond.value;
      if (cond.operator === "not_equals") return val !== cond.value;
      if (cond.operator === "contains") return val.toLowerCase().includes(cond.value.toLowerCase());
      return false;
    }
    case "stage": {
      const val = proj?.stage || "";
      if (cond.operator === "equals") return val === cond.value;
      if (cond.operator === "not_equals") return val !== cond.value;
      return false;
    }
    case "office": {
      const val = proj?.office || "";
      if (cond.operator === "equals") return val === cond.value;
      if (cond.operator === "not_equals") return val !== cond.value;
      return false;
    }
    default:
      return false;
  }
}

function evaluateRule(rule, entry, projectExists, proj) {
  if (rule.conditions.length === 0) return true;
  let result = evaluateCondition(rule.conditions[0], entry, projectExists, proj);
  for (let i = 1; i < rule.conditions.length; i++) {
    const cond = rule.conditions[i];
    const condResult = evaluateCondition(cond, entry, projectExists, proj);
    if (cond.logic_operator === "or") {
      result = result || condResult;
    } else {
      result = result && condResult;
    }
  }
  return result;
}

function classifyEntry(rules, entry, projectExists, proj) {
  for (const rule of rules) {
    if (evaluateRule(rule, entry, projectExists, proj)) {
      return { result: rule.is_billable ? "billable" : "non-billable" };
    }
  }
  return { result: "unmatched" };
}

async function run() {
  try {
    const startDate = "2026-03-01";
    const endDate = "2026-05-31";

    const [entriesRes, projRes, peopleRes, rulesRes, condsRes] = await Promise.all([
      getTimeEntriesByDateRange({ startDate, endDate }),
      listProjects(),
      listPeople(),
      listBillabilityRules(),
      listBillabilityRuleConditions()
    ]);

    const entries = entriesRes.data.timeEntriess || [];
    const projects = projRes.data.projectss || [];
    const people = peopleRes.data.peoples || [];
    const dcRules = rulesRes.data.billabilityRuless || [];
    const dcConds = condsRes.data.billabilityRuleConditionss || [];

    const projectsMap = new Map(projects.map(p => [p.id, p]));
    const projectIds = new Set(projects.map(p => p.id));
    const peopleMap = new Map(people.map(p => [p.id, p]));

    const leaveRegex = /(leave|holiday|sick|bank holiday|office closed|non-working day)/i;
    const leaveProjectIds = new Set();
    for (const p of projects) {
      const title = p.title || "";
      const oppNum = p.opportunity_number || "";
      if (leaveRegex.test(title) && (!oppNum || oppNum.trim() === "")) {
        leaveProjectIds.add(p.id);
      }
    }

    const dcCondsByRule = new Map();
    for (const c of dcConds) {
      const rid = c.rule_id;
      if (!dcCondsByRule.has(rid)) dcCondsByRule.set(rid, []);
      dcCondsByRule.get(rid).push({
        field: c.field,
        operator: c.operator,
        value: c.value,
        logic_operator: c.logic_operator || "and"
      });
    }
    const rules = dcRules.map(r => ({
      id: r.id,
      name: r.name,
      is_billable: r.is_billable,
      priority: r.priority,
      conditions: dcCondsByRule.get(r.id) || []
    })).sort((a, b) => a.priority - b.priority);

    // 1. Raw aggregate before filtering people
    const hoursByPerson = new Map();
    for (const entry of entries) {
      if (!entry.person_id) continue;
      if (!hoursByPerson.has(entry.person_id)) {
        hoursByPerson.set(entry.person_id, { total: 0, billable: 0, leave: 0 });
      }
      const rec = hoursByPerson.get(entry.person_id);
      const hrs = entry.hours || 0;
      const projName = entry.project_name || entry.projectName;
      const isLeave = (
        (entry.project_id && leaveProjectIds.has(entry.project_id)) ||
        (!entry.project_id && projName && leaveRegex.test(projName)) ||
        (entry.notes && leaveRegex.test(entry.notes))
      );

      rec.total += hrs;
      if (isLeave) {
        rec.leave += hrs;
      } else {
        const proj = projectsMap.get(entry.project_id);
        const projectExists = projectIds.has(entry.project_id);
        const classification = classifyEntry(rules, entry, projectExists, proj);
        if (classification.result === "billable") {
          rec.billable += hrs;
        }
      }
    }

    let rawTotalActual = 0;
    let rawTotalBillable = 0;
    let rawTotalLeave = 0;

    for (const [pid, rec] of hoursByPerson.entries()) {
      const p = peopleMap.get(pid);
      // Let's filter to allowed teams to match allowed scope
      if (p && allowedTeams.has((p.team || "").toLowerCase().trim())) {
        rawTotalActual += rec.total;
        rawTotalBillable += rec.billable;
        rawTotalLeave += rec.leave;
      }
    }

    console.log(`=== Raw Aggregate (Filtered ONLY by team) ===`);
    console.log(`Actual: ${rawTotalActual.toFixed(2)}h, Leave: ${rawTotalLeave.toFixed(2)}h, Net Worked: ${(rawTotalActual-rawTotalLeave).toFixed(2)}h, Billable: ${rawTotalBillable.toFixed(2)}h`);

    // 2. Aggregate with people filters (simulate verify_uk_3months)
    const nameTeamToIds = new Map();
    const nameToAllIds = new Map();
    const activeTeamsByName = new Map();

    for (const person of people) {
      const normName = person.name.trim().toLowerCase();
      const teamKey = person.team || "Unassigned";
      const key = `${normName}::${teamKey}`;
      if (!nameTeamToIds.has(key)) nameTeamToIds.set(key, []);
      nameTeamToIds.get(key).push(person.id);
      if (!nameToAllIds.has(normName)) nameToAllIds.set(normName, []);
      nameToAllIds.get(normName).push({ id: person.id, team: teamKey });

      const empStart = person.employment_start_date ? new Date(person.employment_start_date)
        : person.overall_start_date ? new Date(person.overall_start_date) : null;
      const empEnd = person.employment_end_date ? new Date(person.employment_end_date)
        : person.overall_end_date ? new Date(person.overall_end_date) : null;
      
      const overlaps = !((empStart && empStart > new Date(endDate)) || (empEnd && empEnd < new Date(startDate)));
      if (overlaps) {
        if (!activeTeamsByName.has(normName)) activeTeamsByName.set(normName, new Set());
        activeTeamsByName.get(normName).add(teamKey);
      }
    }

    const deduped = new Map();
    const skippedPeople = [];

    for (const person of people) {
      const team = (person.team || "").toLowerCase().trim();
      if (!allowedTeams.has(team)) continue;

      const empStart = person.employment_start_date ? new Date(person.employment_start_date)
        : person.overall_start_date ? new Date(person.overall_start_date) : null;
      const empEnd = person.employment_end_date ? new Date(person.employment_end_date)
        : person.overall_end_date ? new Date(person.overall_end_date) : null;
      
      const overlaps = !((empStart && empStart > new Date(endDate)) || (empEnd && empEnd < new Date(startDate)));
      
      if (!overlaps) {
        const hrs = hoursByPerson.get(person.id);
        if (hrs && hrs.total > 0) {
          skippedPeople.push({ person, hrs });
        }
        continue;
      }

      const normName = person.name.trim().toLowerCase();
      const dedupKey = `${normName}::${person.team || "Unassigned"}`;

      if (deduped.has(dedupKey)) continue;

      const siblingIds = new Set(nameTeamToIds.get(dedupKey) || [person.id]);
      const activeTeams = activeTeamsByName.get(normName) || new Set();
      const allForName = nameToAllIds.get(normName) || [];
      const orphanIds = allForName.filter(x => !activeTeams.has(x.team)).map(x => x.id);
      const sortedActive = [...activeTeams].sort();
      if (sortedActive[0] === (person.team || "Unassigned")) {
        for (const oid of orphanIds) siblingIds.add(oid);
      }

      let total = 0, billable = 0, leave = 0;
      for (const sid of siblingIds) {
        const h = hoursByPerson.get(sid);
        if (h) {
          total += h.total;
          billable += h.billable;
          leave += h.leave;
        }
      }

      deduped.set(dedupKey, {
        name: person.name,
        team: person.team,
        actualHours: total,
        billableHours: billable,
        leaveHours: leave
      });
    }

    let dedupTotalActual = 0;
    let dedupTotalBillable = 0;
    let dedupTotalLeave = 0;

    for (const d of deduped.values()) {
      dedupTotalActual += d.actualHours;
      dedupTotalBillable += d.billableHours;
      dedupTotalLeave += d.leaveHours;
    }

    console.log(`\n=== Deduped Aggregate (With dates & overlaps filters) ===`);
    console.log(`Actual: ${dedupTotalActual.toFixed(2)}h, Leave: ${dedupTotalLeave.toFixed(2)}h, Net Worked: ${(dedupTotalActual-dedupTotalLeave).toFixed(2)}h, Billable: ${dedupTotalBillable.toFixed(2)}h`);

    console.log(`\nDifference in Billable: ${(rawTotalBillable - dedupTotalBillable).toFixed(2)}h`);
    console.log(`Difference in Actual: ${(rawTotalActual - dedupTotalActual).toFixed(2)}h`);

    console.log(`\n--- People Skipped from range due to employment dates filter ---`);
    skippedPeople.forEach(s => {
      console.log(`- ${s.person.name} (${s.person.team}) | Office: ${s.person.office}`);
      console.log(`  Employment dates: ${s.person.employment_start_date} to ${s.person.employment_end_date}`);
      console.log(`  Overall dates: ${s.person.overall_start_date} to ${s.person.overall_end_date}`);
      console.log(`  Hours logged: ${s.hrs.total.toFixed(2)}h (Billable: ${s.hrs.billable.toFixed(2)}h, Leave: ${s.hrs.leave.toFixed(2)}h)`);
    });

  } catch (err) {
    console.error(err);
  }
}

run();
