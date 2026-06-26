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
      return { result: rule.is_billable ? "billable" : "non-billable", ruleName: rule.name };
    }
  }
  return { result: "unmatched", ruleName: "None" };
}

async function run() {
  try {
    const START_DATE = "2026-03-01";
    const END_DATE = "2026-05-31";

    console.log(`Analyzing billability gaps between ${START_DATE} and ${END_DATE}...`);

    // Fetch people
    let people = [];
    let offset = 0;
    const batchSize = 1000;
    while (true) {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/people?select=id,name,office,team&limit=${batchSize}&offset=${offset}`, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
      });
      const data = await res.json();
      if (!data || data.length === 0) break;
      people.push(...data);
      if (data.length < batchSize) break;
      offset += batchSize;
    }
    const allowedPeopleIds = new Set(
      people
        .filter(p => allowedTeams.has((p.team || "").toLowerCase().trim()))
        .map(p => p.id)
    );

    // Fetch projects
    let projects = [];
    offset = 0;
    while (true) {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/projects?select=*&limit=${batchSize}&offset=${offset}`, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
      });
      const data = await res.json();
      if (!data || data.length === 0) break;
      projects.push(...data);
      if (data.length < batchSize) break;
      offset += batchSize;
    }
    const projectsMap = new Map(projects.map(p => [p.id, p]));
    const projectIds = new Set(projects.map(p => p.id));

    // Fetch rules
    const rulesRes = await fetch(`${SUPABASE_URL}/rest/v1/billability_rules?select=*`, {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    });
    const dbRules = await rulesRes.json();
    const condsRes = await fetch(`${SUPABASE_URL}/rest/v1/billability_rule_conditions?select=*`, {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    });
    const dbConds = await condsRes.json();

    const condsByRule = new Map();
    for (const c of dbConds) {
      const rid = c.rule_id;
      if (!condsByRule.has(rid)) condsByRule.set(rid, []);
      condsByRule.get(rid).push({
        field: c.field,
        operator: c.operator,
        value: c.value,
        logic_operator: c.logic_operator || "and"
      });
    }

    const rules = dbRules.map(r => ({
      id: r.id,
      name: r.name,
      is_billable: r.is_billable,
      priority: r.priority,
      conditions: condsByRule.get(r.id) || []
    })).sort((a, b) => a.priority - b.priority);

    // Fetch all time entries in date range
    let timeEntries = [];
    offset = 0;
    while (true) {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/time_entries?select=id,hours,notes,project_id,project_name,date,person_id&date=gte.${START_DATE}&date=lte.${END_DATE}&limit=${batchSize}&offset=${offset}`, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
      });
      const data = await res.json();
      if (!data || data.length === 0) break;
      timeEntries.push(...data);
      if (data.length < batchSize) break;
      offset += batchSize;
    }
    console.log(`Loaded ${timeEntries.length} time entries in range.`);

    const leaveRegex = /(leave|holiday|sick|bank holiday|office closed|non-working day)/i;

    let totalLogged = 0;
    let totalLeave = 0;
    let totalBillable = 0;
    let totalNonBillable = 0;
    let totalUnmatched = 0;

    const nonBillableProjects = {};
    const unmatchedProjects = {};

    for (const entry of timeEntries) {
      if (!entry.person_id || !allowedPeopleIds.has(entry.person_id)) continue;
      const hrs = entry.hours || 0;
      totalLogged += hrs;

      const projName = entry.project_name;
      const notes = entry.notes || "";
      const isLeave = (
        (entry.project_id && projectsMap.get(entry.project_id) && leaveRegex.test(projectsMap.get(entry.project_id).title)) ||
        (!entry.project_id && projName && leaveRegex.test(projName)) ||
        (notes && leaveRegex.test(notes))
      );

      if (isLeave) {
        totalLeave += hrs;
        continue;
      }

      const proj = projectsMap.get(entry.project_id);
      const projectExists = projectIds.has(entry.project_id);
      const { result, ruleName } = classifyEntry(rules, entry, projectExists, proj);

      if (result === "billable") {
        totalBillable += hrs;
      } else if (result === "non-billable") {
        totalNonBillable += hrs;
        const name = proj ? proj.title : (entry.project_name || "Unknown");
        const key = `${name} (Project ID: ${entry.project_id || 'null'}, Rule: ${ruleName})`;
        nonBillableProjects[key] = (nonBillableProjects[key] || 0) + hrs;
      } else {
        totalUnmatched += hrs;
        const name = proj ? proj.title : (entry.project_name || "Unknown");
        const key = `${name} (Project ID: ${entry.project_id || 'null'})`;
        unmatchedProjects[key] = (unmatchedProjects[key] || 0) + hrs;
      }
    }

    console.log("\n--- Totals Summary ---");
    console.log(`Total Logged: ${totalLogged.toFixed(2)}h`);
    console.log(`Total Leave: ${totalLeave.toFixed(2)}h`);
    console.log(`Net Worked: ${(totalLogged - totalLeave).toFixed(2)}h`);
    console.log(`Total Billable: ${totalBillable.toFixed(2)}h`);
    console.log(`Total Non-Billable: ${totalNonBillable.toFixed(2)}h`);
    console.log(`Total Unmatched: ${totalUnmatched.toFixed(2)}h`);

    console.log("\n--- Top Non-Billable Projects ---");
    const sortedNonBillable = Object.entries(nonBillableProjects).sort((a,b)=>b[1]-a[1]);
    sortedNonBillable.slice(0, 40).forEach(([key, hrs]) => {
      console.log(`- ${key}: ${hrs.toFixed(2)}h`);
    });

    console.log("\n--- Top Unmatched Projects ---");
    const sortedUnmatched = Object.entries(unmatchedProjects).sort((a,b)=>b[1]-a[1]);
    sortedUnmatched.slice(0, 40).forEach(([key, hrs]) => {
      console.log(`- ${key}: ${hrs.toFixed(2)}h`);
    });

  } catch (err) {
    console.error("Error:", err);
  }
}

run();
