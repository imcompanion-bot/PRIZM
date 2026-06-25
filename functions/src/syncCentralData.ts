import { onSchedule } from "firebase-functions/v2/scheduler";
import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { google } from "googleapis";
import { v5 as uuidv5 } from "uuid";
import { initializeApp, getApps } from "firebase-admin/app";
import { initializeApp as initClientApp, getApps as getClientApps } from "firebase/app";

// Data Connect SDK
import {
  upsertPeople,
  upsertProjects,
  upsertProjectScopes,
  upsertRoles,
  upsertRateCards,
} from "./dataconnect-generated";

// Ensure Apps are initialized
if (!getApps().length) {
  initializeApp();
}

if (!getClientApps().length) {
  const firebaseConfig = {
    projectId: "pharaoh-54a0e",
    // We only need projectId for DataConnect in functions if running in GCP with default creds
  };
  initClientApp(firebaseConfig);
}

// Fixed namespace for deterministic UUID generation
const NAMESPACE = "1b671a64-40d5-491e-99b0-da01ff1f3341";

// Centralized Sheet ID
const SHEET_ID = "1kHXAbVe-EAD-l63C7o4c1bJcvL0ECEyylXrspV8fJCQ";

// Helper to convert Excel serial dates or "dd/mm/yyyy" to YYYY-MM-DD
function parseDate(value: any): string | null {
  if (!value) return null;
  const strVal = String(value).trim();
  
  if (strVal.includes("/")) {
    const parts = strVal.split("/");
    if (parts.length === 3) {
      const [dd, mm, yyyy] = parts;
      if (yyyy.length === 4) {
        return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
      }
    }
  }

  const serial = parseFloat(strVal);
  if (!isNaN(serial) && serial > 10000) {
    const date = new Date(Math.round((serial - 25569) * 86400 * 1000));
    return date.toISOString().split("T")[0];
  }

  return null;
}

function parseNumber(value: any): number | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value === "number") return value;
  const parsed = parseFloat(String(value).replace(/,/g, "").replace(/£|\$|€|%/g, ""));
  return isNaN(parsed) ? null : parsed;
}

export async function runSync() {
  logger.info("Starting centralized sheet sync");

  const auth = new google.auth.GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  const authClient = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: authClient as any });

  // 1. ROLES & RATE CARDS
  logger.info("Syncing Roles and Rate Cards...");
  const rolesResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "Roles & Capacities!A2:B",
  });
  const rateCardsResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "UK Rate Cards!A2:Z",
  });

  const rolesRows = rolesResponse.data.values || [];
  const rateCardsRows = rateCardsResponse.data.values || [];
  
  const roleIdMap = new Map<string, string>(); // name -> id

  // Process Roles
  let upsertedRoles = 0;
  for (const row of rolesRows) {
    const name = row[0];
    if (!name || name === "") continue;

    const roleId = uuidv5(`role_${name.toLowerCase()}`, NAMESPACE);
    roleIdMap.set(name.toLowerCase(), roleId);

    const capStr = String(row[1] || "").replace("%", "");
    const cap = parseFloat(capStr);
    const capacityHours = isNaN(cap) ? 37.5 : (cap / 100) * 37.5;

    await upsertRoles({
      id: roleId,
      name,
      billableCapacityHours: capacityHours,
      createdAt: new Date().toISOString(),
      isActive: true,
    });
    upsertedRoles++;
  }

  // Process Rate Cards
  const clientNames = rateCardsRows[0] || [];
  const currencies = rateCardsRows[1] || [];
  let upsertedRateCards = 0;

  for (let i = 3; i < rateCardsRows.length; i++) {
    const row = rateCardsRows[i];
    const roleName = row[1];
    if (!roleName) continue;

    const roleId = roleIdMap.get(roleName.toLowerCase());

    for (let colIdx = 2; colIdx < clientNames.length; colIdx++) {
      const clientName = clientNames[colIdx];
      const currency = currencies[colIdx] || "GBP";
      if (!clientName) continue;

      const rateVal = parseNumber(row[colIdx]);
      if (rateVal === null) continue;

      const rateCardId = uuidv5(`ratecard_${clientName}_${roleName}`, NAMESPACE);
      
      await upsertRateCards({
        id: rateCardId,
        name: clientName,
        currency,
        hourlyRate: rateVal,
        roleId: roleId || null,
        createdAt: new Date().toISOString(),
        isActive: true,
      });
      upsertedRateCards++;
    }
  }

  // 2. PEOPLE
  logger.info("Syncing People...");
  const peopleResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "People Counter Global!A3:O", 
  });
  const peopleRows = peopleResponse.data.values || [];
  let upsertedPeople = 0;

  for (const row of peopleRows) {
    const name = row[0];
    if (!name) continue;
    const code = row[1];
    const roleName = row[2];
    const type = row[3];
    const team = row[4];
    const status = row[5];
    const ukPct = parseNumber(row[6]);
    const usPct = parseNumber(row[7]);
    const imcPct = parseNumber(row[8]);
    const startDate = parseDate(row[9]);
    const endDate = parseDate(row[10]);
    const overallStart = parseDate(row[11]);
    const overallEnd = parseDate(row[12]);
    const monthlySalary = parseNumber(row[13]);
    const office = row[14];

    const personId = uuidv5(`person_${name.toLowerCase()}`, NAMESPACE);
    const roleId = roleName ? roleIdMap.get(roleName.toLowerCase()) : null;

    await upsertPeople({
      id: personId,
      name,
      code,
      type,
      team,
      status,
      office: office || "Unknown",
      ukPercentage: ukPct,
      usPercentage: usPct,
      imcPercentage: imcPct,
      employmentStartDate: startDate,
      employmentEndDate: endDate,
      overallStartDate: overallStart,
      overallEndDate: overallEnd,
      monthlySalary: monthlySalary,
      annualSalary: monthlySalary !== null ? monthlySalary * 12 : null,
      roleId: roleId || null,
      createdAt: new Date().toISOString(),
      isActive: true,
    });
    upsertedPeople++;
  }

  // 3. PROJECTS
  logger.info("Syncing Projects...");
  const projectsResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "Data summary - P&L phased (de-risked)!B5:Z",
  });
  const projectsRows = projectsResponse.data.values || [];
  let upsertedProjects = 0;

  const projectMap = new Map<string, string>(); // oppName -> id

  for (const row of projectsRows) {
    const title = row[0];
    if (!title) continue;

    const projectId = uuidv5(`project_${title}`, NAMESPACE);
    projectMap.set(title, projectId);

    const createdDate = parseDate(row[7]);
    const closeDate = parseDate(row[8]);
    const startDate = parseDate(row[9]);
    const endDate = parseDate(row[10]);

    if (!startDate || !endDate) continue;

    await upsertProjects({
      id: projectId,
      title,
      sfAccount: row[1] || "",
      parentAccount: row[2] || "",
      ultimateParent: row[3] || "",
      office: row[4] || "",
      newRepeat: row[5] || "",
      stage: row[6] || "",
      createdDate,
      closeDate,
      startDate,
      endDate,
      price: parseNumber(row[11]),
      budgetCost: parseNumber(row[12]),
      contractedInflCost: parseNumber(row[13]),
      actualCost: parseNumber(row[14]),
      mediaCost: parseNumber(row[15]),
      gpFullValue: parseNumber(row[16]),
      gpCheck: row[17] || "",
      gpFullValuePerDay: parseNumber(row[18]),
      probability: parseNumber(row[19]),
      startWeek: row[20] || "",
      endWeek: row[21] || "",
      durationWeeks: parseNumber(row[22]),
      durationWeeksRounded: parseNumber(row[23]),
      rateCardDiscount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
    });
    upsertedProjects++;
  }

  // 4. SCOPES & ALLOCATIONS
  logger.info("Syncing Scopes...");
  const scopesResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "Scopes!A2:X",
  });
  const scopesRows = scopesResponse.data.values || [];
  let upsertedScopes = 0;

  for (const row of scopesRows) {
    const oppName = row[2];
    const roleName = row[4];
    const scopedHours = parseNumber(row[5]);

    if (!oppName || !roleName || scopedHours === null) continue;

    const projectId = projectMap.get(oppName);
    const roleId = roleIdMap.get(roleName.toLowerCase());

    if (!projectId) continue;

    const scopeId = uuidv5(`scope_${projectId}_${roleId || roleName}`, NAMESPACE);

    // Extract phases (Phase 1 to Phase 12 are columns 7 to 18)
    const phasePercentages: any = {};
    for (let i = 0; i < 12; i++) {
      const val = row[7 + i];
      if (val) {
        phasePercentages[`phase${i + 1}`] = String(val);
      }
    }

    await upsertProjectScopes({
      id: scopeId,
      projectId,
      roleId: roleId || null,
      scopedHours,
      phasePercentages: JSON.stringify(phasePercentages),
      createdAt: new Date().toISOString(),
      isActive: true,
    });
    upsertedScopes++;
  }

  logger.info(`Sync complete! Roles: ${upsertedRoles}, RateCards: ${upsertedRateCards}, People: ${upsertedPeople}, Projects: ${upsertedProjects}, Scopes: ${upsertedScopes}`);
}

export const syncCentralDataCron = onSchedule("0 2 * * *", async (event) => {
  await runSync();
});

export const syncCentralDataHttp = onRequest({ region: "us-east4", serviceAccount: "pharaoh-54a0e@appspot.gserviceaccount.com", timeoutSeconds: 500, memory: "512MiB" }, async (req, res) => {
  try {
    await runSync();
    res.status(200).send({ success: true, timestamp: new Date().toISOString() });
  } catch (err: any) {
    logger.error("Error running sync", err);
    res.status(500).send({ error: err.message });
  }
});

import { onCall } from "firebase-functions/v2/https";
export const syncCentralDataCallable = onCall({ region: "us-east4", timeoutSeconds: 500, memory: "1GiB" }, async (request) => {
  try {
    await runSync();
    return { success: true, timestamp: new Date().toISOString() };
  } catch (err: any) {
    logger.error("Error running sync", err);
    throw new Error(err.message);
  }
});
