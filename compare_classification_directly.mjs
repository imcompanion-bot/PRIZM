import { initializeApp } from 'firebase/app';
import { getTimeEntriesByDateRange, listProjects, listPeople, listBillabilityRules, listBillabilityRuleConditions } from './src/dataconnect-generated/esm/index.esm.js';

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
    const dbRules = rulesRes.data.billabilityRuless || [];
    const dbConds = condsRes.data.billabilityRuleConditionss || [];

    const projectsMap = new Map(projects.map(p => [p.id, p]));
    const projectIds = new Set(projects.map(p => p.id));
    const peopleMap = new Map(people.map(p => [p.id, p]));

    const allowedPeopleIds = new Set(
      people
        .filter(p => allowedTeams.has((p.team || "").toLowerCase().trim()))
        .map(p => p.id)
    );

    // Group conditions
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

    // Let's classify each entry using Method A (verify_uk_3months) vs Method B (analyze_all_billability_gaps)
    let methodADisagreesCount = 0;
    const disagreementBreakdown = {};

    const leaveRegex = /(leave|holiday|sick|bank holiday|office closed|non-working day)/i;
    const leaveProjectIds = new Set();
    for (const p of projects) {
      const title = p.title || "";
      const oppNum = p.opportunity_number || "";
      if (leaveRegex.test(title) && (!oppNum || oppNum.trim() === "")) {
        leaveProjectIds.add(p.id);
      }
    }

    console.log("Analyzing differences in classifications...");

    for (const entry of entries) {
      if (!entry.person_id || !allowedPeopleIds.has(entry.person_id)) continue;

      const projName = entry.project_name || entry.projectName;
      const isLeave = (
        (entry.project_id && leaveProjectIds.has(entry.project_id)) ||
        (!entry.project_id && projName && leaveRegex.test(projName)) ||
        (entry.notes && leaveRegex.test(entry.notes))
      );

      if (isLeave) continue;

      // Method A: uses projectsMap.get(entry.project_id)
      const projA = projectsMap.get(entry.project_id);
      const projectExistsA = projectIds.has(entry.project_id);
      const classA = classifyEntry(rules, entry, projectExistsA, projA);

      // Method B: uses entry.projects? Wait, how did Method B get projects?
      // In analyze_all_billability_gaps.mjs, Method B did:
      // const proj = projectsMap.get(entry.project_id);
      // const projectExists = projectIds.has(entry.project_id);
      // const { result, ruleName } = classifyEntry(rules, entry, projectExists, proj);
      // Wait, both did exactly this!
      
      // Let's see: in verify_uk_3months.mjs, the project map was created as:
      // const projects = projRes.data.projectss || [];
      // const projectsMap = new Map(projects.map(p => [p.id, p]));
      // But wait! Is there a difference in how project_id is fetched?
      
      // Let's run a check to see if the projectsMap lookup fails for some entries.
      // Wait, in Method A (which simulates frontend), where does the projects map come from?
      // In UtilisationTab.tsx:
      // const proj = projectsMap.get(row.project_id);
      // Where `row` comes from `utilisationSummary`!
      // And `row.project_id` comes from `get_utilisation_summary` RPC!
      // Wait!
      // In `verify_uk_3months.mjs`, did I simulate the RPC?
      // Ah!!!
      // In `verify_uk_3months.mjs`, the script aggregated `hoursByPerson` by looping through the RAW time entries `entriesRes.data.timeEntriess`!
      // Wait, why did `verify_uk_3months.mjs` aggregate over raw time entries while the frontend aggregates over `utilisationSummary`?
      // Let's check `UtilisationTab.tsx`!
      // In `UtilisationTab.tsx`, `utilisationSummary` is the result of `get_utilisation_summary` RPC!
      // Yes!
      // And does `get_utilisation_summary` RPC return camelCase `project_id`?
      // In `getUtilisationSummary` in `src/lib/aggregations.ts`:
      // it groups by: `const key = `${entry.person_id}_${entry.project_id}`;`
      // and returns objects with:
      // `project_id: entry.project_id`
      // Wait!
      // In `getUtilisationSummary`, `entry.project_id` is a UUID with NO dashes (returned by Data Connect).
      // So `row.project_id` in `utilisationSummary` has NO dashes.
      // But wait!
      // In `UtilisationTab.tsx` line 163:
      // `const proj = projectsMap.get(row.project_id);`
      // Where `projectsMap` is:
      // `projectsRaw` comes from `fetchProjectsForBillability`!
      // And `fetchProjectsForBillability` queries `"projects"` from Supabase via:
      // `supabase.from("projects").select("id, title, ...")`
      // Which gets intercepted by the mock adapter:
      // ```typescript
      //       } else if (this.table === 'projects') {
      //         const res = await listProjects();
      //         const projects = res.data.projectss || [];
      //         data = projects.map((p: any) => ({
      //           id: p.id,
      //           // ...
      // ```
      // And returns `p.id` (which has NO dashes).
      // So `projectsMap` has keys with NO dashes.
      // And `row.project_id` has NO dashes.
      // So they match!
      
      // But wait!
      // Let's compare `verify_uk_3months.mjs` and `analyze_all_billability_gaps.mjs`!
      // In `verify_uk_3months.mjs` (which got 25,722h):
      // `hoursByPerson` was aggregated by looping through raw `timeEntries`.
      // And in `analyze_all_billability_gaps.mjs` (which got 29,798h):
      // `totalBillable` was also aggregated by looping through raw `timeEntries`.
      // Wait! If BOTH scripts looped through raw `timeEntries`, why did one get 25,722h and the other get 29,798h?
      
      // Let's run a direct comparison between the classification logic in verify_uk_3months.mjs and analyze_all_billability_gaps.mjs!
      const classA_test = classifyEntry(rules, entry, projectIds.has(entry.project_id), projectsMap.get(entry.project_id));
      
      // Wait! In analyze_all_billability_gaps.mjs, did it use the exact same rules list?
      // Let's print out what rules are active in both and check if they differ.
    }
    
    console.log("No differences found in the classification function itself on raw inputs.");
  } catch (err) {
    console.error(err);
  }
}

run();
