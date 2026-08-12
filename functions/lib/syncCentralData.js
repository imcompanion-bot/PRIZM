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
exports.syncCentralDataCallable = exports.syncCentralDataHttp = exports.syncMonitorAgentCron = exports.syncCentralDataCron = void 0;
exports.runSync = runSync;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
const logger = __importStar(require("firebase-functions/logger"));
const googleapis_1 = require("googleapis");
const uuid_1 = require("uuid");
const supabase_js_1 = require("@supabase/supabase-js");
const app_1 = require("firebase-admin/app");
const nodemailer = __importStar(require("nodemailer"));
// Ensure Apps are initialized
if (!(0, app_1.getApps)().length) {
    (0, app_1.initializeApp)();
}
const SUPABASE_SERVICE_ROLE_SECRET = (0, params_1.defineSecret)("SUPABASE_SERVICE_ROLE_SECRET");
const gmailEmail = (0, params_1.defineSecret)("GMAIL_EMAIL");
const gmailAppPassword = (0, params_1.defineSecret)("GMAIL_APP_PASSWORD");
const NOTIFICATION_RECIPIENTS = (0, params_1.defineSecret)("NOTIFICATION_RECIPIENTS");
const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
async function sendFailureAlert(error, context) {
    const email = gmailEmail.value();
    const password = gmailAppPassword.value();
    if (!email || !password) {
        logger.warn("[Alert] GMAIL_EMAIL or GMAIL_APP_PASSWORD not set. Skipping email alert.");
        return;
    }
    let recipients = email;
    try {
        const customRecipients = NOTIFICATION_RECIPIENTS.value();
        if (customRecipients && customRecipients.trim()) {
            recipients = customRecipients;
        }
    }
    catch (e) {
        logger.info("[Alert] NOTIFICATION_RECIPIENTS secret not configured or available. Defaulting to GMAIL_EMAIL.");
    }
    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
            user: email,
            pass: password,
        },
    });
    const subject = "PRISM: DATABASE SYNC FAILURE";
    const html = `
    <!doctype html>
    <html>
    <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#333;line-height:1.6;padding:24px;max-width:650px;margin:0 auto;background-color:#fafafa;">
      <div style="background:#ffffff;border:1px solid #e0e0e0;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.05);">
        
        <!-- Header -->
        <div style="background:#1e1e24;padding:24px;text-align:center;border-bottom:3px solid #d32f2f;">
          <h1 style="color:#ffffff;margin:0;font-size:22px;letter-spacing:1px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:10px;">
            <span style="font-size:24px;">🚨</span> PRISM SYSTEM ALERT
          </h1>
        </div>
        
        <!-- Body Content -->
        <div style="padding:32px 24px;">
          <h2 style="color:#d32f2f;margin-top:0;font-size:18px;font-weight:600;">PRISM Database Synchronization Failed</h2>
          <p style="font-size:15px;color:#555;">Hello,</p>
          <p style="font-size:15px;color:#555;margin-bottom:24px;">
            The automated pipeline was unable to synchronize data between the <strong>Centralized Google Sheet</strong> and the <strong>PRISM (Supabase) Database</strong>. Below are the context and specific technical details of the failure:
          </p>

          <!-- Context & Technical Details Card -->
          <div style="background:#fff5f5;border-left:4px solid #d32f2f;border-radius:4px;padding:16px;margin-bottom:28px;">
            <h4 style="margin:0 0 8px 0;color:#c62828;font-size:14px;text-transform:uppercase;letter-spacing:0.5px;">Failure Context</h4>
            <p style="margin:0 0 16px 0;font-size:14px;color:#444;"><strong>Trigger Event:</strong> ${escapeHtml(context)}</p>
            
            <h4 style="margin:0 0 8px 0;color:#c62828;font-size:14px;text-transform:uppercase;letter-spacing:0.5px;">Technical Error Stack</h4>
            <pre style="margin:0;padding:12px;background:#1e1e1e;color:#b5cea8;border-radius:6px;font-family:'Courier New',Courier,monospace;font-size:12px;overflow-x:auto;white-space:pre-wrap;word-break:break-all;">${escapeHtml(error?.stack || error?.message || String(error))}</pre>
          </div>

          <!-- Why Did This Happen? -->
          <h3 style="color:#1e1e24;font-size:16px;margin:0 0 10px 0;border-bottom:1px solid #e0e0e0;padding-bottom:6px;">🔍 Why Did This Happen?</h3>
          <p style="font-size:14px;color:#555;margin:0 0 20px 0;">
            Typically, sync failures are caused by one of the following events:
          </p>
          <ul style="font-size:14px;color:#555;margin:0 0 24px 0;padding-left:20px;line-height:1.8;">
            <li><strong>Authentication / API Expiry:</strong> Google Drive or Sheets service credentials have expired, or the service account lacks access to the file.</li>
            <li><strong>Sheet Schema Modifications:</strong> Row columns or tabs have been renamed or shifted in the spreadsheet.</li>
            <li><strong>Supabase Constraints:</strong> Data validation constraints (e.g., duplicate values or missing keys) conflicted during the insert/update process.</li>
            <li><strong>Network Timeouts:</strong> Temporary communication lag between Google Cloud and Supabase hosts.</li>
          </ul>

          <!-- Action Steps -->
          <h3 style="color:#1e1e24;font-size:16px;margin:0 0 10px 0;border-bottom:1px solid #e0e0e0;padding-bottom:6px;">🛠️ What Should You Do Next?</h3>
          <ol style="font-size:14px;color:#555;margin:0 0 28px 0;padding-left:20px;line-height:1.8;">
            <li>
              <strong>Verify Spreadsheet Layout:</strong> Check the source spreadsheet to confirm no critical columns have been modified or left blank.
            </li>
            <li>
              <strong>Examine Complete GCP Logs:</strong> Open the Google Cloud Console logs to view the chronological execution flow and pinpoint the breakdown line.
            </li>
            <li>
              <strong>Trigger a Manual Sync:</strong> Once verified, trigger a manual HTTP execution to verify that the pipeline can run to completion.
            </li>
          </ol>

          <!-- Resources & Links Grid -->
          <h3 style="color:#1e1e24;font-size:16px;margin:0 0 14px 0;border-bottom:1px solid #e0e0e0;padding-bottom:6px;">🔗 Quick Access Resources</h3>
          <div style="display:grid;grid-template-columns:1fr;gap:12px;margin-bottom:8px;">
            <a href="https://docs.google.com/spreadsheets/d/1kHXAbVe-EAD-l63C7o4c1bJcvL0ECEyylXrspV8fJCQ/edit" target="_blank" style="display:block;background:#34a853;color:#ffffff;text-decoration:none;padding:12px;border-radius:6px;text-align:center;font-weight:600;font-size:14px;box-shadow:0 2px 4px rgba(0,0,0,0.08);">
              🟢 Open PRISM Central Spreadsheet
            </a>
            <a href="https://console.firebase.google.com/project/pharaoh-54a0e/functions" target="_blank" style="display:block;background:#ffca28;color:#1e1e24;text-decoration:none;padding:12px;border-radius:6px;text-align:center;font-weight:600;font-size:14px;box-shadow:0 2px 4px rgba(0,0,0,0.08);">
              🟡 Open Firebase Functions Console
            </a>
            <a href="https://supabase.com/dashboard/project/hyfgyfuvligacjwxjnce" target="_blank" style="display:block;background:#3ecf8e;color:#ffffff;text-decoration:none;padding:12px;border-radius:6px;text-align:center;font-weight:600;font-size:14px;box-shadow:0 2px 4px rgba(0,0,0,0.08);">
              🟢 Open Supabase Project Dashboard
            </a>
          </div>

        </div>

        <!-- Footer -->
        <div style="background:#f4f4f7;padding:20px;text-align:center;border-top:1px solid #e8e8eb;">
          <p style="font-size:12px;color:#7e8299;margin:0 0 4px 0;">This is an automated system monitoring alert from the PRISM Backend.</p>
          <p style="font-size:11px;color:#a1a5b7;margin:0;">Do not reply directly to this email.</p>
        </div>

      </div>
    </body>
    </html>
  `;
    try {
        await transporter.sendMail({
            from: `"Project Zen Alerts" <${email}>`,
            to: recipients,
            subject: subject,
            html: html,
        });
        logger.info(`[Alert] Failure alert email sent successfully to: ${recipients}`);
    }
    catch (err) {
        logger.error("[Alert] Failed to send failure alert email:", err);
    }
}
// Fixed namespace for deterministic UUID generation
const NAMESPACE = "1b671a64-40d5-491e-99b0-da01ff1f3341";
// Centralized Sheet ID
const SHEET_ID = "1kHXAbVe-EAD-l63C7o4c1bJcvL0ECEyylXrspV8fJCQ";
let _supabase = null;
function getSupabase() {
    if (!_supabase) {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!supabaseUrl || !supabaseKey) {
            throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_SECRET environment variables.");
        }
        _supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey, {
            auth: { persistSession: false },
        });
    }
    return _supabase;
}
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
    const supabase = getSupabase();
    const updateProgress = async (progressPercent) => {
        try {
            await supabase.from("data_imports").upsert({ dataset: "central_sync_progress", row_count: progressPercent, last_imported_at: new Date().toISOString() }, { onConflict: "dataset" });
        }
        catch (e) {
            logger.error("Failed to update central_sync_progress:", e);
        }
    };
    await updateProgress(1);
    const auth = new googleapis_1.google.auth.GoogleAuth({
        scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });
    googleapis_1.google.options({
        timeout: 60000,
    });
    const authClient = await auth.getClient();
    const sheets = googleapis_1.google.sheets({
        version: "v4",
        auth: authClient,
        timeout: 60000,
    });
    // 1. ROLES & RATE CARDS
    logger.info("Syncing Roles and Rate Cards...");
    await updateProgress(10);
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
    const rolesBatchMap = new Map();
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
        rolesBatchMap.set(roleId, {
            id: roleId,
            name,
            billable_capacity_hours: capacityHours,
            created_at: new Date().toISOString(),
        });
        upsertedRoles++;
    }
    const rolesBatch = Array.from(rolesBatchMap.values());
    if (rolesBatch.length > 0) {
        const { error } = await supabase.from("roles").upsert(rolesBatch);
        if (error)
            throw new Error(`Roles Upsert Error: ${error.message}`);
    }
    // Process Rate Cards
    const clientNames = rateCardsRows[0] || [];
    const currencies = rateCardsRows[1] || [];
    let upsertedRateCards = 0;
    const rateCardsBatchMap = new Map();
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
            rateCardsBatchMap.set(rateCardId, {
                id: rateCardId,
                name: clientName,
                currency,
                hourly_rate: rateVal,
                role_id: roleId || null,
                created_at: new Date().toISOString(),
            });
            upsertedRateCards++;
        }
    }
    const rateCardsBatch = Array.from(rateCardsBatchMap.values());
    if (rateCardsBatch.length > 0) {
        for (let i = 0; i < rateCardsBatch.length; i += 100) {
            const { error } = await supabase.from("rate_cards").upsert(rateCardsBatch.slice(i, i + 100));
            if (error)
                throw new Error(`RateCards Upsert Error: ${error.message}`);
        }
    }
    // 2. PEOPLE
    logger.info("Syncing People...");
    await updateProgress(30);
    const peopleResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: "People Counter Global!A3:O",
    });
    const peopleRows = peopleResponse.data.values || [];
    let upsertedPeople = 0;
    const sheetPersonIds = new Set();
    const nameToCurrentId = new Map();
    const peopleBatchMap = new Map();
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
        peopleBatchMap.set(personId, {
            id: personId,
            name,
            code,
            type,
            team,
            status,
            office: office || "Unknown",
            uk_percentage: ukPct,
            us_percentage: usPct,
            imc_percentage: imcPct,
            employment_start_date: startDate,
            employment_end_date: endDate,
            overall_start_date: overallStart,
            overall_end_date: overallEnd,
            monthly_salary: monthlySalary,
            annual_salary: monthlySalary !== null ? monthlySalary * 12 : null,
            role_id: roleId || null,
            created_at: new Date().toISOString(),
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
            if (!endDate) {
                nameToCurrentId.set(normName, personId);
            }
        }
    }
    const peopleBatch = Array.from(peopleBatchMap.values());
    if (peopleBatch.length > 0) {
        for (let i = 0; i < peopleBatch.length; i += 100) {
            const { error } = await supabase.from("people").upsert(peopleBatch.slice(i, i + 100));
            if (error)
                throw new Error(`People Upsert Error: ${error.message}`);
        }
    }
    // Perform stale records cleanup & relinking
    logger.info("Performing people cleanup and time entry relinking...");
    await updateProgress(50);
    try {
        const existingPeople = [];
        let pPage = 0;
        const pPageSize = 1000;
        while (true) {
            const { data, error } = await supabase
                .from("people")
                .select("*")
                .range(pPage * pPageSize, (pPage + 1) * pPageSize - 1);
            if (error)
                break;
            if (!data || data.length === 0)
                break;
            existingPeople.push(...data);
            if (data.length < pPageSize)
                break;
            pPage++;
        }
        const deactivationsMap = new Map();
        for (const p of existingPeople) {
            if (!sheetPersonIds.has(p.id)) {
                const normName = p.name.toLowerCase().trim();
                const targetCurrentId = nameToCurrentId.get(normName);
                if (targetCurrentId) {
                    logger.info(`Checking and relinking any time entries from stale ID ${p.id} to new ID ${targetCurrentId}`);
                    const { error: relinkErr } = await supabase
                        .from("time_entries")
                        .update({ person_id: targetCurrentId })
                        .eq("person_id", p.id);
                    if (relinkErr) {
                        logger.error(`Error bulk relinking time entries for ${p.id}:`, relinkErr);
                    }
                    await supabase.from("people").delete().eq("id", p.id);
                }
                else {
                    deactivationsMap.set(p.id, {
                        id: p.id,
                        name: p.name,
                        code: p.code,
                        type: p.type || null,
                        team: p.team || null,
                        status: p.status || null,
                        office: p.office || "Unknown",
                        uk_percentage: p.uk_percentage || null,
                        us_percentage: p.us_percentage || null,
                        imc_percentage: p.imc_percentage || null,
                        employment_start_date: p.employment_start_date || null,
                        employment_end_date: p.employment_end_date || null,
                        overall_start_date: p.overall_start_date || null,
                        overall_end_date: p.overall_end_date || null,
                        monthly_salary: p.monthly_salary || null,
                        annual_salary: p.annual_salary || null,
                        role_id: p.role_id || null,
                        created_at: p.created_at || new Date().toISOString(),
                    });
                }
            }
        }
        const deactivations = Array.from(deactivationsMap.values());
        if (deactivations.length > 0) {
            for (let i = 0; i < deactivations.length; i += 100) {
                await supabase.from("people").upsert(deactivations.slice(i, i + 100));
            }
        }
    }
    catch (err) {
        logger.error("Failed to run cleanup / relinking in sync script:", err);
    }
    // 3. PROJECTS
    logger.info("Syncing Projects...");
    await updateProgress(70);
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
    // Fetch existing projects to prevent duplicate key constraint on opportunity_number (Handle pagination > 1000)
    const existingProjects = [];
    let page = 0;
    const pageSize = 1000;
    while (true) {
        const { data, error } = await supabase
            .from("projects")
            .select("id, opportunity_number, title")
            .range(page * pageSize, (page + 1) * pageSize - 1);
        if (error) {
            logger.error("Failed to fetch existing projects for deduplication", error);
            break;
        }
        if (!data || data.length === 0)
            break;
        existingProjects.push(...data);
        if (data.length < pageSize)
            break;
        page++;
    }
    const oppNumberToExistingId = new Map();
    const titleToExistingId = new Map();
    for (const p of existingProjects) {
        if (p.opportunity_number)
            oppNumberToExistingId.set(p.opportunity_number.toLowerCase().trim(), p.id);
        if (p.title)
            titleToExistingId.set(p.title.toLowerCase().trim(), p.id);
    }
    const projectsResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: "Data summary - P&L phased (de-risked)!B5:ZZ",
    });
    const projectsRows = projectsResponse.data.values || [];
    let upsertedProjects = 0;
    const projectsBatchMap = new Map();
    const projectMap = new Map(); // oppName -> id
    const usedOppNumbers = new Set();
    for (const row of projectsRows) {
        const title = row[0];
        if (!title)
            continue;
        let oppNumber = titleToOppNumber.get(title.trim()) || null;
        let oppNumberFromSheet = row[182]; // Column GB (184 - 2 = 182)
        if (oppNumberFromSheet !== undefined && String(oppNumberFromSheet).trim() !== '') {
            oppNumber = String(oppNumberFromSheet).trim();
        }
        let oppNumberLower = oppNumber ? oppNumber.toLowerCase().trim() : null;
        let titleLower = title.toLowerCase().trim();
        let projectId;
        if (oppNumberLower && oppNumberToExistingId.has(oppNumberLower)) {
            projectId = oppNumberToExistingId.get(oppNumberLower);
        }
        else if (titleToExistingId.has(titleLower)) {
            projectId = titleToExistingId.get(titleLower);
        }
        else {
            projectId = (0, uuid_1.v5)(`project_${title}`, NAMESPACE);
        }
        projectMap.set(title, projectId);
        const createdDate = parseDate(row[7]);
        const closeDate = parseDate(row[8]);
        const startDate = parseDate(row[9]);
        const endDate = parseDate(row[10]);
        if (!startDate || !endDate)
            continue;
        if (oppNumber) {
            if (usedOppNumbers.has(oppNumberLower)) {
                logger.warn(`Duplicate Opportunity Number found in sheet: ${oppNumber} for project ${title}. Nulling to prevent crash.`);
                oppNumber = null;
            }
            else {
                usedOppNumbers.add(oppNumberLower);
            }
        }
        const price = parseNumber(row[11]);
        let oppRecordType = row[188];
        if (!oppRecordType) {
            oppRecordType = title.toLowerCase().includes("rfp") || title.toLowerCase().includes("rfi")
                ? "Agency - RFP / RFI"
                : "Agency - Execution";
        }
        projectsBatchMap.set(projectId, {
            id: projectId,
            title,
            sf_account: row[1] || "",
            parent_account: row[2] || "",
            ultimate_parent: row[3] || "",
            office: row[4] || "",
            new_repeat: row[5] || "",
            stage: row[6] || "",
            created_date: createdDate,
            close_date: closeDate,
            start_date: startDate,
            end_date: endDate,
            probability: parseNumber(row[19]),
            start_week: row[20] || "",
            end_week: row[21] || "",
            duration_weeks: parseNumber(row[22]),
            duration_weeks_rounded: parseNumber(row[23]),
            rate_card_discount: 0,
            opportunity_number: oppNumber,
            opportunity_record_type: oppRecordType,
            revenue: price,
            budget_cost: parseNumber(row[12]),
            contracted_infl_cost: parseNumber(row[13]),
            actual_cost: parseNumber(row[14]),
            media_cost: parseNumber(row[15]),
            gp_full_value: parseNumber(row[16]),
            gp_check: row[17] || "",
            gp_full_value_per_day: parseNumber(row[18]),
            extra_data: {
                project_currency: row[212] || null,
                project_currency_revenue: parseNumber(row[213]),
                project_currency_media_cost: parseNumber(row[215]),
                project_currency_gross_budget: parseNumber(row[223]),
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        });
        upsertedProjects++;
    }
    const projectsBatch = Array.from(projectsBatchMap.values());
    if (projectsBatch.length > 0) {
        for (let i = 0; i < projectsBatch.length; i += 100) {
            const { error } = await supabase.from("projects").upsert(projectsBatch.slice(i, i + 100));
            if (error)
                throw new Error(`Projects Upsert Error: ${error.message}`);
        }
        // Cleanup orphaned projects
        const { data: existingProjects } = await supabase.from("projects").select("id");
        if (existingProjects) {
            const validProjectIdsSet = new Set(projectsBatchMap.keys());
            const orphanIds = existingProjects.map((p) => p.id).filter((id) => !validProjectIdsSet.has(id));
            if (orphanIds.length > 0) {
                logger.info(`Deleting ${orphanIds.length} orphaned projects...`);
                for (let i = 0; i < orphanIds.length; i += 100) {
                    const chunk = orphanIds.slice(i, i + 100);
                    await supabase.from("projects").delete().in("id", chunk);
                }
            }
        }
    }
    // 4. SCOPES & ALLOCATIONS
    logger.info("Syncing Scopes...");
    await updateProgress(90);
    const scopesResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: "Scopes!A2:X",
    });
    const scopesRows = scopesResponse.data.values || [];
    let upsertedScopes = 0;
    const scopesBatchMap = new Map();
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
        scopesBatchMap.set(scopeId, {
            id: scopeId,
            project_id: projectId,
            role_id: roleId || null,
            scoped_hours: scopedHours,
            phase_percentages: phasePercentages,
            created_at: new Date().toISOString(),
        });
        upsertedScopes++;
    }
    const scopesBatch = Array.from(scopesBatchMap.values());
    if (scopesBatch.length > 0) {
        for (let i = 0; i < scopesBatch.length; i += 100) {
            const { error } = await supabase.from("project_scopes").upsert(scopesBatch.slice(i, i + 100));
            if (error)
                throw new Error(`Project Scopes Upsert Error: ${error.message}`);
        }
        // Cleanup orphaned project scopes
        const { data: existingScopes } = await supabase.from("project_scopes").select("id");
        if (existingScopes) {
            const validScopeIdsSet = new Set(scopesBatchMap.keys());
            const orphanScopeIds = existingScopes.map((s) => s.id).filter((id) => !validScopeIdsSet.has(id));
            if (orphanScopeIds.length > 0) {
                logger.info(`Deleting ${orphanScopeIds.length} orphaned project scopes...`);
                for (let i = 0; i < orphanScopeIds.length; i += 100) {
                    const chunk = orphanScopeIds.slice(i, i + 100);
                    await supabase.from("project_scopes").delete().in("id", chunk);
                }
            }
        }
    }
    // Update data_imports timestamp from server-side (bypasses any client-side RLS limits!)
    await updateProgress(100);
    const { error: timestampError } = await supabase.from("data_imports").upsert({ dataset: "central_sync", last_imported_at: new Date().toISOString() }, { onConflict: "dataset" });
    if (timestampError) {
        logger.error("Failed to update data_imports timestamp on server side:", timestampError);
    }
    else {
        logger.info("Successfully updated central_sync data_imports timestamp on server side!");
    }
    logger.info(`Sync complete! Roles: ${upsertedRoles}, RateCards: ${upsertedRateCards}, People: ${upsertedPeople}, Projects: ${upsertedProjects}, Scopes: ${upsertedScopes}`);
}
exports.syncCentralDataCron = (0, scheduler_1.onSchedule)({
    schedule: "0 6 * * *",
    timeZone: "Europe/London",
    timeoutSeconds: 500,
    memory: "1GiB",
    secrets: [SUPABASE_SERVICE_ROLE_SECRET, gmailEmail, gmailAppPassword, NOTIFICATION_RECIPIENTS]
}, async (event) => {
    try {
        await runSync();
    }
    catch (err) {
        logger.error("Automated Daily Sync failed:", err);
        await sendFailureAlert(err, "Daily Automated Sync (06:00 AM Europe/London)");
    }
});
exports.syncMonitorAgentCron = (0, scheduler_1.onSchedule)({
    schedule: "15 6 * * *",
    timeZone: "Europe/London",
    timeoutSeconds: 500,
    memory: "1GiB",
    secrets: [SUPABASE_SERVICE_ROLE_SECRET, gmailEmail, gmailAppPassword, NOTIFICATION_RECIPIENTS]
}, async (event) => {
    logger.info("[Monitor Agent] Commencing daily Live Sync validation check...");
    const supabase = getSupabase();
    try {
        const { data, error } = await supabase
            .from("data_imports")
            .select("last_imported_at")
            .eq("dataset", "central_sync")
            .maybeSingle();
        if (error) {
            throw new Error(`Failed to query sync timestamp: ${error.message}`);
        }
        const lastImportedAt = data?.last_imported_at;
        const now = new Date();
        let needsRetry = false;
        if (!lastImportedAt) {
            logger.warn("[Monitor Agent] No successful sync timestamp found. Live Sync has never succeeded!");
            needsRetry = true;
        }
        else {
            const lastSyncTime = new Date(lastImportedAt);
            const diffMs = now.getTime() - lastSyncTime.getTime();
            const diffMinutes = diffMs / (1000 * 60);
            logger.info(`[Monitor Agent] Last successful sync occurred at ${lastImportedAt} (${Math.round(diffMinutes)} minutes ago).`);
            // Threshold is 30 minutes. Since the cron runs at 06:15 AM, the scheduled sync at 06:00 AM
            // should have successfully completed less than 15 minutes ago.
            // If the last success is older than 30 minutes (e.g. yesterday's sync), today's sync failed or skipped!
            if (diffMinutes > 30) {
                logger.warn(`[Monitor Agent] Last successful sync is too old (${Math.round(diffMinutes)} minutes old). Live Sync failed to complete today!`);
                needsRetry = true;
            }
        }
        if (needsRetry) {
            logger.info("[Monitor Agent] Triggering FORCED retry of morning Live Sync...");
            // Update monitoring status to indicate a retry is active
            await supabase.from("data_imports").upsert({ dataset: "sync_monitor_status", last_imported_at: new Date().toISOString(), row_count: -1 }, // row_count -1 means retrying
            { onConflict: "dataset" });
            await runSync();
            logger.info("[Monitor Agent] FORCED retry sync completed successfully!");
            await supabase.from("data_imports").upsert({ dataset: "sync_monitor_status", last_imported_at: new Date().toISOString(), row_count: 1 }, // row_count 1 means retry succeeded
            { onConflict: "dataset" });
        }
        else {
            logger.info("[Monitor Agent] Live Sync validated successfully. No action required.");
            await supabase.from("data_imports").upsert({ dataset: "sync_monitor_status", last_imported_at: new Date().toISOString(), row_count: 0 }, // row_count 0 means validated successfully first time
            { onConflict: "dataset" });
        }
    }
    catch (err) {
        logger.error("[Monitor Agent] Fatal monitoring error:", err);
        await sendFailureAlert(err, "Daily Monitor Agent check & forced sync retry (06:15 AM Europe/London)");
        try {
            await supabase.from("data_imports").upsert({ dataset: "sync_monitor_status", last_imported_at: new Date().toISOString(), row_count: -2 }, // row_count -2 means monitor error
            { onConflict: "dataset" });
        }
        catch (upsertErr) {
            logger.error("[Monitor Agent] Failed to save monitor error status to database:", upsertErr);
        }
    }
});
exports.syncCentralDataHttp = (0, https_1.onRequest)({
    region: "us-east4",
    serviceAccount: "pharaoh-54a0e@appspot.gserviceaccount.com",
    timeoutSeconds: 500,
    memory: "512MiB",
    secrets: [SUPABASE_SERVICE_ROLE_SECRET, gmailEmail, gmailAppPassword, NOTIFICATION_RECIPIENTS]
}, async (req, res) => {
    try {
        if (req.query.testAlert === "true") {
            logger.info("[Test Alert] Triggering test alert email...");
            await sendFailureAlert(new Error("This is a mock diagnostic error to test your notification channel."), "Project Zen Alert Test Route (triggered manually)");
            res.status(200).send({ success: true, message: "Mock failure alert email triggered successfully!" });
            return;
        }
        await runSync();
        res.status(200).send({ success: true, timestamp: new Date().toISOString() });
    }
    catch (err) {
        logger.error("Error running sync", err);
        res.status(500).send({ error: err.message });
    }
});
exports.syncCentralDataCallable = (0, https_1.onCall)({
    region: "us-east4",
    timeoutSeconds: 500,
    memory: "1GiB",
    secrets: [SUPABASE_SERVICE_ROLE_SECRET, gmailEmail, gmailAppPassword, NOTIFICATION_RECIPIENTS]
}, async (request) => {
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