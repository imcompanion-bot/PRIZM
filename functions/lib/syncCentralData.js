"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncCentralDataCallable = exports.syncCentralDataHttp = exports.syncCentralDataCron = void 0;
exports.runSync = runSync;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const https_1 = require("firebase-functions/v2/https");
const logger = __importStar(require("firebase-functions/logger"));
const googleapis_1 = require("googleapis");
const uuid_1 = require("uuid");
const app_1 = require("firebase-admin/app");
const app_2 = require("firebase/app");
// Data Connect SDK
const dataconnect_generated_1 = require("./dataconnect-generated");
// Ensure Apps are initialized
if (!(0, app_1.getApps)().length) {
    (0, app_1.initializeApp)();
}
if (!(0, app_2.getApps)().length) {
    const firebaseConfig = {
        projectId: "pharaoh-54a0e",
        // We only need projectId for DataConnect in functions if running in GCP with default creds
    };
    (0, app_2.initializeApp)(firebaseConfig);
}
// Fixed namespace for deterministic UUID generation
const NAMESPACE = "1b671a64-40d5-491e-99b0-da01ff1f3341";
// Centralized Sheet ID
const SHEET_ID = "1kHXAbVe-EAD-l63C7o4c1bJcvL0ECEyylXrspV8fJCQ";
// Helper to convert Excel serial dates or "dd/mm/yyyy" to YYYY-MM-DD
function parseDate(value) {
    if (!value)
        return null;
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
function parseNumber(value) {
    if (value === undefined || value === null || value === "")
        return null;
    if (typeof value === "number")
        return value;
    const parsed = parseFloat(String(value).replace(/,/g, "").replace(/£|\$|€|%/g, ""));
    return isNaN(parsed) ? null : parsed;
}
async function runSync() {
    logger.info("Starting centralized sheet sync");
    const auth = new googleapis_1.google.auth.GoogleAuth({
        scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });
    const authClient = await auth.getClient();
    const sheets = googleapis_1.google.sheets({ version: "v4", auth: authClient });
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
    const roleIdMap = new Map(); // name -> id
    // Process Roles
    let upsertedRoles = 0;
    for (const row of rolesRows) {
        const name = row[0];
        if (!name || name === "")
            continue;
        const roleId = (0, uuid_1.v5)(`role_${name.toLowerCase()}`, NAMESPACE);
        roleIdMap.set(name.toLowerCase(), roleId);
        const capStr = String(row[1] || "").replace("%", "");
        const cap = parseFloat(capStr);
        const capacityHours = isNaN(cap) ? 37.5 : (cap / 100) * 37.5;
        await (0, dataconnect_generated_1.upsertRoles)({
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
        if (!roleName)
            continue;
        const roleId = roleIdMap.get(roleName.toLowerCase());
        for (let colIdx = 2; colIdx < clientNames.length; colIdx++) {
            const clientName = clientNames[colIdx];
            const currency = currencies[colIdx] || "GBP";
            if (!clientName)
                continue;
            const rateVal = parseNumber(row[colIdx]);
            if (rateVal === null)
                continue;
            const rateCardId = (0, uuid_1.v5)(`ratecard_${clientName}_${roleName}`, NAMESPACE);
            await (0, dataconnect_generated_1.upsertRateCards)({
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
    const sheetPersonIds = new Set();
    const nameToCurrentId = new Map();
    for (const row of peopleRows) {
        const name = row[0];
        if (!name)
            continue;
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
        const personKey = code ? `person_${code.toLowerCase().trim()}` : `person_${name.toLowerCase().trim()}`;
        const personId = (0, uuid_1.v5)(personKey, NAMESPACE);
        const roleId = roleName ? roleIdMap.get(roleName.toLowerCase()) : null;
        await (0, dataconnect_generated_1.upsertPeople)({
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
        sheetPersonIds.add(personId);
        // Map normalized name to the current active/latest contract ID in the sheet
        const normName = name.toLowerCase().trim();
        const prevId = nameToCurrentId.get(normName);
        if (!prevId) {
            nameToCurrentId.set(normName, personId);
        }
        else {
            // Prefer ongoing contract (no end date) or later end date
            if (!endDate) {
                nameToCurrentId.set(normName, personId);
            }
        }
    }
    // Perform stale records cleanup & relinking
    logger.info("Performing people cleanup and time entry relinking...");
    try {
        const existingPeopleRes = await (0, dataconnect_generated_1.listPeople)();
        const existingPeople = existingPeopleRes.data.peoples || [];
        const timeEntriesRes = await (0, dataconnect_generated_1.getAllTimeEntries)();
        const allTimeEntries = timeEntriesRes.data.timeEntriess || [];
        for (const p of existingPeople) {
            if (!sheetPersonIds.has(p.id)) {
                const normName = p.name.toLowerCase().trim();
                const targetCurrentId = nameToCurrentId.get(normName);
                if (targetCurrentId) {
                    // Relink any time entries to the new ID
                    const staleEntries = allTimeEntries.filter(e => e.person_id === p.id);
                    if (staleEntries.length > 0) {
                        logger.info(`Relinking ${staleEntries.length} time entries from stale ID ${p.id} (${p.name}) to new ID ${targetCurrentId}`);
                        for (const entry of staleEntries) {
                            await (0, dataconnect_generated_1.updateTimeEntryPerson)({ id: entry.id, personId: targetCurrentId });
                        }
                    }
                    logger.info(`Deleting stale person record ${p.id} (${p.name}, code: ${p.code})`);
                    await (0, dataconnect_generated_1.deletePeople)({ id: p.id });
                }
                else {
                    // No replacement found in the sheet (person removed entirely). Mark them as inactive.
                    logger.info(`Deactivating obsolete person record ${p.id} (${p.name}, code: ${p.code})`);
                    await (0, dataconnect_generated_1.upsertPeople)({
                        id: p.id,
                        name: p.name,
                        code: p.code,
                        type: p.type || null,
                        team: p.team || null,
                        status: p.status || null,
                        office: p.office || "Unknown",
                        ukPercentage: p.uk_percentage || null,
                        usPercentage: p.us_percentage || null,
                        imcPercentage: p.imc_percentage || null,
                        employmentStartDate: p.employment_start_date || null,
                        employmentEndDate: p.employment_end_date || null,
                        overallStartDate: p.overall_start_date || null,
                        overallEndDate: p.overall_end_date || null,
                        monthlySalary: p.monthly_salary || null,
                        annualSalary: p.annual_salary || null,
                        roleId: p.role_id || null,
                        createdAt: p.created_at || new Date().toISOString(),
                        isActive: false,
                    });
                }
            }
        }
    }
    catch (err) {
        logger.error("Failed to run cleanup / relinking in sync script:", err);
    }
    // 3. PROJECTS
    logger.info("Syncing Projects...");
    // Load Scopes first to extract opportunity numbers
    const titleToOppNumber = new Map();
    try {
        const scopesResponseForOpp = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: "Scopes!A2:C",
        });
        const scopesRowsForOpp = scopesResponseForOpp.data.values || [];
        for (const row of scopesRowsForOpp) {
            const oppNumber = row[0];
            const title = row[2];
            if (oppNumber && title) {
                titleToOppNumber.set(title.trim(), oppNumber.trim());
            }
        }
        logger.info(`Loaded ${titleToOppNumber.size} title-to-opportunity mappings from Scopes`);
    }
    catch (err) {
        logger.error("Failed to load Scopes for opportunity number mapping", err);
    }
    const projectsResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: "Data summary - P&L phased (de-risked)!B5:Z",
    });
    const projectsRows = projectsResponse.data.values || [];
    let upsertedProjects = 0;
    const projectMap = new Map(); // oppName -> id
    for (const row of projectsRows) {
        const title = row[0];
        if (!title)
            continue;
        const projectId = (0, uuid_1.v5)(`project_${title}`, NAMESPACE);
        projectMap.set(title, projectId);
        const createdDate = parseDate(row[7]);
        const closeDate = parseDate(row[8]);
        const startDate = parseDate(row[9]);
        const endDate = parseDate(row[10]);
        if (!startDate || !endDate)
            continue;
        const price = parseNumber(row[11]);
        const oppNumber = titleToOppNumber.get(title.trim()) || null;
        const oppRecordType = title.toLowerCase().includes("rfp") || title.toLowerCase().includes("rfi")
            ? "Agency - RFP / RFI"
            : "Agency - Execution";
        await (0, dataconnect_generated_1.upsertProjects)({
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
            price,
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
            opportunityNumber: oppNumber,
            opportunityRecordType: oppRecordType,
            revenue: price,
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
        if (!oppName || !roleName || scopedHours === null)
            continue;
        const projectId = projectMap.get(oppName);
        const roleId = roleIdMap.get(roleName.toLowerCase());
        if (!projectId)
            continue;
        const scopeId = (0, uuid_1.v5)(`scope_${projectId}_${roleId || roleName}`, NAMESPACE);
        // Extract phases (Phase 1 to Phase 12 are columns 7 to 18)
        const phasePercentages = {};
        for (let i = 0; i < 12; i++) {
            const val = row[7 + i];
            if (val) {
                phasePercentages[`phase${i + 1}`] = String(val);
            }
        }
        await (0, dataconnect_generated_1.upsertProjectScopes)({
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
exports.syncCentralDataCron = (0, scheduler_1.onSchedule)({ schedule: "0 7 * * *", timeZone: "Europe/London" }, async (event) => {
    await runSync();
});
exports.syncCentralDataHttp = (0, https_1.onRequest)({ region: "us-east4", serviceAccount: "pharaoh-54a0e@appspot.gserviceaccount.com", timeoutSeconds: 500, memory: "512MiB" }, async (req, res) => {
    try {
        await runSync();
        res.status(200).send({ success: true, timestamp: new Date().toISOString() });
    }
    catch (err) {
        logger.error("Error running sync", err);
        res.status(500).send({ error: err.message });
    }
});
const https_2 = require("firebase-functions/v2/https");
exports.syncCentralDataCallable = (0, https_2.onCall)({ region: "us-east4", timeoutSeconds: 500, memory: "1GiB" }, async (request) => {
    try {
        await runSync();
        return { success: true, timestamp: new Date().toISOString() };
    }
    catch (err) {
        logger.error("Error running sync", err);
        throw new Error(err.message);
    }
});
//# sourceMappingURL=syncCentralData.js.map