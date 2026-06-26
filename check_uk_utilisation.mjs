import { initializeApp } from 'firebase/app';
import { 
  getTimeEntriesByDateRange,
  listProjects,
  listPeople,
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

const matchesOffice = (office, filter) => {
  if (filter === "Global") return true;
  if (!office) return false;
  const o = office.toUpperCase();
  if (filter === "UK") return o === "UK" || o === "UNITED KINGDOM" || o === "COMPANION";
  if (filter === "US") return o === "US" || o === "UNITED STATES";
  return false;
};

const allowedTeams = new Set(["account management", "strategy", "strategy and innovation", "creative team", "paid media", "project management", "business affairs", "data"]);

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
    console.log("Fetching records...");
    const [timeRes, projRes, peopleRes, rulesRes, condsRes] = await Promise.all([
      getTimeEntriesByDateRange({ startDate: "2026-05-01", endDate: "2026-05-31" }),
      listProjects(),
      listPeople(),
      listBillabilityRules(),
      listBillabilityRuleConditions()
    ]);

    const timeEntries = timeRes.data.timeEntriess || [];
    const projects = projRes.data.projectss || [];
    const people = peopleRes.data.peoples || [];
    const dbRules = rulesRes.data.billabilityRuless || [];
    const dbConds = condsRes.data.billabilityRuleConditionss || [];

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

    // Filter to UK people matching allowed teams
    const ukPeopleIds = new Set(
      people
        .filter(p => matchesOffice(p.office, "UK") && allowedTeams.has((p.team || "").toLowerCase().trim()))
        .map(p => p.id)
    );
    console.log(`Found ${ukPeopleIds.size} UK people in allowed teams.`);

    const ukEntries = timeEntries.filter(te => te.person_id && ukPeopleIds.has(te.person_id));
    console.log(`Found ${ukEntries.length} UK time entries for allowed teams in May 2026.`);

    let totalWorkedHours = 0;
    let billableHours = 0;
    let leaveHours = 0;

    const leaveRegex = /(leave|holiday|sick|bank holiday|office closed|non-working day)/i;

    for (const te of ukEntries) {
      const proj = projectsMap.get(te.project_id);
      
      // Determine if leave entry
      const isLeave = (
        (te.project_id && te.project_name && leaveRegex.test(te.project_name)) ||
        (te.notes && leaveRegex.test(te.notes))
      );

      const hrs = te.hours || 0;
      totalWorkedHours += hrs;

      if (isLeave) {
        leaveHours += hrs;
        continue;
      }

      // Classify using billability rules
      const entryForClassification = {
        id: te.id,
        date: te.date,
        hours: hrs,
        project_id: te.project_id,
        person_id: te.person_id,
        projects: proj || null
      };

      const projectExists = projectIds.has(te.project_id);
      const { result } = classifyEntry(rules, entryForClassification, projectExists);

      if (result === "billable") {
        billableHours += hrs;
      }
    }

    console.log("\nUK Office Utilisation for May 2026 (exact logic):");
    console.log(`- Worked hours (including leave): ${totalWorkedHours.toFixed(2)}h`);
    console.log(`- Leave hours: ${leaveHours.toFixed(2)}h`);
    console.log(`- Net worked hours: ${(totalWorkedHours - leaveHours).toFixed(2)}h`);
    console.log(`- Billable hours: ${billableHours.toFixed(2)}h`);
    console.log(`- Utilisation %: ${((billableHours / (totalWorkedHours - leaveHours)) * 100).toFixed(1)}%`);

  } catch (error) {
    console.error("Error:", error);
  }
}

run();
