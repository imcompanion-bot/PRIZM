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

async function run() {
  try {
    const START_DATE = "2026-03-01";
    const END_DATE = "2026-05-31";

    console.log(`Analyzing date range ${START_DATE} to ${END_DATE}...`);

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
    const peopleMap = new Map(people.map(p => [p.id, p]));

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
    console.log(`Loaded ${projects.length} projects.`);

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

    console.log("\n--- Active Rules and Conditions ---");
    rules.forEach(r => {
      console.log(`Priority ${r.priority} | Rule: "${r.name}" | isBillable: ${r.is_billable}`);
      r.conditions.forEach(c => {
        console.log(`  - Condition: ${c.logic_operator} ${c.field} ${c.operator} "${c.value}"`);
      });
    });

    // Call RPC get_utilisation_summary
    console.log("\nCalling get_utilisation_summary RPC...");
    const rpcRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_utilisation_summary`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ _start_date: START_DATE, _end_date: END_DATE })
    });
    const utilisationSummary = await rpcRes.json();
    console.log(`RPC returned ${utilisationSummary.length} rows.`);

    // We want to simulate the GLOBAL filter totals.
    // Filter to allowed teams first.
    const allowedPeopleIds = new Set(
      people
        .filter(p => allowedTeams.has((p.team || "").toLowerCase().trim()))
        .map(p => p.id)
    );

    // Group hours by project
    const projectHours = new Map();
    let orphanHours = 0;
    let totalNetHours = 0;

    for (const row of utilisationSummary) {
      if (!row.person_id || !allowedPeopleIds.has(row.person_id)) continue;
      const hrs = Number(row.total_hours);
      const leaveHrs = Number(row.leave_hours);
      const netHrs = hrs - leaveHrs;
      if (netHrs <= 0) continue;

      totalNetHours += netHrs;

      if (!row.project_id) {
        orphanHours += netHrs;
        continue;
      }

      if (!projectHours.has(row.project_id)) {
        projectHours.set(row.project_id, 0);
      }
      projectHours.set(row.project_id, projectHours.get(row.project_id) + netHrs);
    }

    console.log(`Total Net Worked Hours in scope: ${totalNetHours.toFixed(2)}h`);
    console.log(`Orphan net hours: ${orphanHours.toFixed(2)}h`);

    // Classify projects
    const classifiedProjects = [];
    for (const [projId, hrs] of projectHours.entries()) {
      const proj = projectsMap.get(projId);
      const projectExists = projectIds.has(projId);

      // Evaluate billability
      let matchedRule = null;
      let isBillable = false;

      for (const rule of rules) {
        let ruleResult = true;
        if (rule.conditions.length > 0) {
          const evalCond = (cond) => {
            switch (cond.field) {
              case "has_project_code": {
                const has = projId !== null;
                return cond.operator === "is_true" ? has : !has;
              }
              case "project_in_projects": {
                const exists = projectExists && projId !== null;
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
          };

          ruleResult = evalCond(rule.conditions[0]);
          for (let i = 1; i < rule.conditions.length; i++) {
            const cond = rule.conditions[i];
            const condResult = evalCond(cond);
            if (cond.logic_operator === "or") {
              ruleResult = ruleResult || condResult;
            } else {
              ruleResult = ruleResult && condResult;
            }
          }
        }

        if (ruleResult) {
          matchedRule = rule;
          isBillable = rule.is_billable;
          break;
        }
      }

      classifiedProjects.push({
        id: projId,
        title: proj?.title || "Unknown",
        oppNumber: proj?.opportunity_number || "None",
        stage: proj?.stage || "None",
        revenue: proj?.revenue || 0,
        oppType: proj?.opportunity_record_type || "None",
        hours: hrs,
        isBillable,
        ruleName: matchedRule ? matchedRule.name : "None"
      });
    }

    // Group hours by rule/status
    const summary = {};
    let totalBillableCalculated = 0;
    for (const p of classifiedProjects) {
      const key = `${p.isBillable ? "BILLABLE" : "NON-BILL"} - ${p.ruleName}`;
      summary[key] = (summary[key] || 0) + p.hours;
      if (p.isBillable) {
        totalBillableCalculated += p.hours;
      }
    }
    console.log("\nSummary of net hours by rule classification:", summary);
    console.log(`Total Billable Calculated: ${totalBillableCalculated.toFixed(2)}h`);

    // Let's print all NON-BILLABLE projects with hours to see why they are non-billable
    console.log("\n--- Top Non-billable projects with logged hours ---");
    classifiedProjects
      .filter(p => !p.isBillable)
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 30)
      .forEach(p => {
        console.log(`- ${p.title} (${p.oppNumber}) | Hours: ${p.hours.toFixed(1)} | Rule: ${p.ruleName} | Stage: ${p.stage} | Revenue: ${p.revenue} | Type: ${p.oppType}`);
      });

  } catch (err) {
    console.error("Error in run:", err);
  }
}

run();
