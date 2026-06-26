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
    const dcRules = rulesRes.data.billabilityRuless || [];
    const dcConds = condsRes.data.billabilityRuleConditionss || [];

    const projectsMap = new Map(projects.map(p => [p.id, p]));
    const projectIds = new Set(projects.map(p => p.id));

    const allowedPeopleIds = new Set(
      people
        .filter(p => allowedTeams.has((p.team || "").toLowerCase().trim()))
        .map(p => p.id)
    );

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

    // Let's compute sums
    let billableSum = 0;
    let nonBillableSum = 0;
    let leaveSum = 0;
    let otherSum = 0;

    const leaveRegex = /(leave|holiday|sick|bank holiday|office closed|non-working day)/i;
    const leaveProjectIds = new Set();
    for (const p of projects) {
      const title = p.title || "";
      const oppNum = p.opportunity_number || "";
      if (leaveRegex.test(title) && (!oppNum || oppNum.trim() === "")) {
        leaveProjectIds.add(p.id);
      }
    }

    for (const entry of entries) {
      if (!entry.person_id || !allowedPeopleIds.has(entry.person_id)) continue;
      const hrs = entry.hours || 0;
      const projName = entry.project_name || entry.projectName;
      
      const isLeave = (
        (entry.project_id && leaveProjectIds.has(entry.project_id)) ||
        (!entry.project_id && projName && leaveRegex.test(projName)) ||
        (entry.notes && leaveRegex.test(entry.notes))
      );

      if (isLeave) {
        leaveSum += hrs;
        continue;
      }

      const proj = projectsMap.get(entry.project_id);
      const projectExists = projectIds.has(entry.project_id);

      const classification = classifyEntry(rules, entry, projectExists, proj);
      if (classification.result === "billable") {
        billableSum += hrs;
      } else {
        nonBillableSum += hrs;
      }
    }

    console.log(`=== Verification of exact sums in memory ===`);
    console.log(`Billable: ${billableSum.toFixed(2)}h`);
    console.log(`Non-Billable: ${nonBillableSum.toFixed(2)}h`);
    console.log(`Leave: ${leaveSum.toFixed(2)}h`);
    console.log(`Total: ${(billableSum + nonBillableSum + leaveSum).toFixed(2)}h`);

  } catch (err) {
    console.error("Error:", err);
  }
}

run();
