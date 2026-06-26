import { initializeApp } from 'firebase/app';
import { 
  getTimeEntriesByDateRange,
  listProjects,
  listBillabilityRules,
  listBillabilityRuleConditions
} from './src/dataconnect-generated/esm/index.esm.js';

const firebaseConfig = {
  projectId: "pharaoh-54a0e",
  appId: "1:909637352706:web:98a9ef33d6b680d6e8d61b",
  storageBucket: "pharaoh-54a0e.firebasestorage.app",
  apiKey: "AIzaSyBWy2AP5d-YTdpirVipzs2tvd0hVqqfeIw",
  authDomain: "pharaoh-54a0e.firebaseapp.com",
  messagingSenderId: "909637352706",
};

const app = initializeApp(firebaseConfig);

function evaluateCondition(cond, entry, projectExists) {
  const proj = entry.projects;
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

function evaluateRule(rule, entry, projectExists) {
  if (rule.conditions.length === 0) return true;
  let result = evaluateCondition(rule.conditions[0], entry, projectExists);
  for (let i = 1; i < rule.conditions.length; i++) {
    const cond = rule.conditions[i];
    const condResult = evaluateCondition(cond, entry, projectExists);
    if (cond.logic_operator === "or") {
      result = result || condResult;
    } else {
      result = result && condResult;
    }
  }
  return result;
}

function classifyEntry(rules, entry, projectExists) {
  for (const rule of rules) {
    if (evaluateRule(rule, entry, projectExists)) {
      return { result: rule.is_billable ? "billable" : "non-billable", matchedRule: rule };
    }
  }
  return { result: "unmatched" };
}

async function run() {
  try {
    console.log("Fetching Data Connect records for May 2026...");
    const [timeRes, projRes, rulesRes, condsRes] = await Promise.all([
      getTimeEntriesByDateRange({ startDate: "2026-05-01", endDate: "2026-05-31" }),
      listProjects(),
      listBillabilityRules(),
      listBillabilityRuleConditions()
    ]);

    const timeEntries = timeRes.data.timeEntriess || [];
    const projects = projRes.data.projectss || [];
    const dbRules = rulesRes.data.billabilityRuless || [];
    const dbConds = condsRes.data.billabilityRuleConditionss || [];

    console.log(`Loaded: ${timeEntries.length} time entries, ${projects.length} projects, ${dbRules.length} rules, ${dbConds.length} conditions.`);

    const projectsMap = new Map(projects.map(p => [p.id, p]));
    const projectIds = new Set(projects.map(p => p.id));

    // Construct rules
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
    }));

    console.log("Constructed Rules:", JSON.stringify(rules, null, 2));

    // Filter to May 2026 (the "1 month" preset range)
    const mayEntries = timeEntries.filter(te => te.date && te.date.startsWith("2026-05"));
    console.log(`\nAnalyzing May 2026: found ${mayEntries.length} entries.`);

    let billableCount = 0;
    let nonBillableCount = 0;
    let unmatchedCount = 0;
    
    let billableHours = 0;
    let nonBillableHours = 0;
    let unmatchedHours = 0;

    const unmatchedSamples = [];
    const nonBillableSamples = [];

    for (const te of mayEntries) {
      const proj = projectsMap.get(te.project_id);
      const entryForClassification = {
        id: te.id,
        date: te.date,
        hours: te.hours,
        project_id: te.project_id,
        person_id: te.person_id,
        projects: proj || null
      };

      const projectExists = projectIds.has(te.project_id);
      const { result, matchedRule } = classifyEntry(rules, entryForClassification, projectExists);

      if (result === "billable") {
        billableCount++;
        billableHours += te.hours;
      } else if (result === "non-billable") {
        nonBillableCount++;
        nonBillableHours += te.hours;
        if (nonBillableSamples.length < 5) {
          nonBillableSamples.push({ te, proj, matchedRule });
        }
      } else {
        unmatchedCount++;
        unmatchedHours += te.hours;
        if (unmatchedSamples.length < 5) {
          unmatchedSamples.push({ te, proj });
        }
      }
    }

    console.log("\nResults for May 2026:");
    console.log(`- Billable: ${billableCount} entries, ${billableHours} hours`);
    console.log(`- Non-Billable: ${nonBillableCount} entries, ${nonBillableHours} hours`);
    console.log(`- Unmatched: ${unmatchedCount} entries, ${unmatchedHours} hours`);
    console.log(`- Total: ${mayEntries.length} entries, ${billableHours + nonBillableHours + unmatchedHours} hours`);

    if (unmatchedSamples.length > 0) {
      console.log("\nUnmatched samples:");
      console.log(JSON.stringify(unmatchedSamples, null, 2));
    }
    if (nonBillableSamples.length > 0) {
      console.log("\nNon-billable samples:");
      console.log(JSON.stringify(nonBillableSamples, null, 2));
    }

  } catch (error) {
    console.error("Error:", error);
  }
}

run();
