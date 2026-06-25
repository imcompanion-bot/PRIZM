"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runRateCardSync = runRateCardSync;
const googleapis_1 = require("googleapis");
const app_1 = require("firebase-admin/app");
const app_2 = require("firebase/app");
const uuid_1 = require("uuid");
const generated_server_1 = require("@dataconnect/generated-server");
// Namespace for deterministic UUIDs
const NAMESPACE = '1b671a64-40d5-491e-99b0-da01ff1f3341';
if ((0, app_1.getApps)().length === 0) {
    (0, app_1.initializeApp)();
}
if ((0, app_2.getApps)().length === 0) {
    (0, app_2.initializeApp)({
        projectId: "pharaoh-54a0e",
        appId: "1:909637352706:web:98a9ef33d6b680d6e8d61b",
        storageBucket: "pharaoh-54a0e.firebasestorage.app",
        apiKey: "AIzaSyBWy2AP5d-YTdpirVipzs2tvd0hVqqfeIw",
        authDomain: "pharaoh-54a0e.firebaseapp.com",
        messagingSenderId: "909637352706",
    });
}
async function runRateCardSync(spreadsheetId, sheetName) {
    console.log(`Starting Google Sheets Sync for Rate Cards...`);
    console.log(`Spreadsheet: ${spreadsheetId}, Sheet: ${sheetName}`);
    const auth = new googleapis_1.google.auth.GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    const sheets = googleapis_1.google.sheets({ version: 'v4', auth });
    let response;
    try {
        // Resolve GID to actual sheet name if a numeric GID was passed
        let actualSheetName = sheetName;
        if (!isNaN(Number(sheetName))) {
            const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
            const sheet = spreadsheet.data.sheets?.find(s => s.properties?.sheetId === Number(sheetName));
            if (sheet && sheet.properties?.title) {
                actualSheetName = sheet.properties.title;
            }
        }
        response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: actualSheetName,
        });
    }
    catch (e) {
        throw new Error(`Failed to fetch Google Sheet. Make sure you shared the sheet with the Service Account email. Error: ${e.message}`);
    }
    const rows = response.data.values;
    if (!rows || rows.length < 5) {
        throw new Error("Sheet does not have enough rows to parse Rate Cards.");
    }
    // Find where "Role" is to align rows
    let roleRowIdx = 1;
    if (rows[1][1] === 'Role') {
        roleRowIdx = 1;
    }
    else if (rows[0][1] === 'Role') {
        roleRowIdx = 0;
    }
    const headerRow = rows[roleRowIdx];
    const currencyRow = rows[roleRowIdx + 1];
    // The first rate card starts at col 2
    const rateCardNames = headerRow.slice(2);
    const rateCardCurrencies = currencyRow.slice(2);
    const roleUpserts = [];
    const rateCardUpserts = [];
    const BATCH_SIZE = 500;
    let rolesUpsertedCount = 0;
    let rateCardsUpsertedCount = 0;
    console.log(`Found ${rateCardNames.filter(Boolean).length} rate cards.`);
    for (let i = roleRowIdx + 3; i < rows.length; i++) {
        const row = rows[i];
        const roleName = row[1]?.trim();
        if (!roleName || roleName === 'N/A' || roleName === 'Role' || roleName === '')
            continue;
        // Deterministic UUID for role
        const roleId = (0, uuid_1.v5)(`role-${roleName.toLowerCase()}`, NAMESPACE);
        // Parse Capacity (from column AC, but let's default to 80% if not found, though the app assumes 40 billable hours)
        // The previous app logic defaulted billableCapacityHours to 40
        roleUpserts.push({
            id: roleId,
            name: roleName,
            billableCapacityHours: 40,
            createdAt: new Date().toISOString()
        });
        // Parse Rate Cards for this role
        for (let j = 0; j < rateCardNames.length; j++) {
            const rateCardName = rateCardNames[j]?.trim();
            const currency = rateCardCurrencies[j]?.trim() || "GBP";
            if (!rateCardName)
                continue;
            const rawVal = (row[j + 2] || "").toString().trim().replace(/[£$€,]/g, "");
            if (!rawVal || rawVal.toLowerCase() === "blank" || rawVal.toLowerCase() === "n/a" || rawVal === "")
                continue;
            const rate = parseFloat(rawVal);
            if (isNaN(rate) || rate <= 0)
                continue;
            const rateCardId = (0, uuid_1.v5)(`rc-${rateCardName}-${roleId}`, NAMESPACE);
            rateCardUpserts.push({
                id: rateCardId,
                name: rateCardName,
                roleId: roleId,
                hourlyRate: rate,
                currency: currency.toUpperCase(),
                createdAt: new Date().toISOString()
            });
        }
    }
    console.log(`Prepared ${roleUpserts.length} Roles and ${rateCardUpserts.length} Rate Cards for upsert.`);
    // Insert Roles
    for (let i = 0; i < roleUpserts.length; i += BATCH_SIZE) {
        const batch = roleUpserts.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(async (record) => {
            try {
                await (0, generated_server_1.insertRoles)(record);
                rolesUpsertedCount++;
            }
            catch (e) {
                console.error(`Failed to insert role ${record.name}:`, e.message);
            }
        }));
    }
    // Insert Rate Cards
    for (let i = 0; i < rateCardUpserts.length; i += BATCH_SIZE) {
        const batch = rateCardUpserts.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(async (record) => {
            try {
                await (0, generated_server_1.insertRateCards)(record);
                rateCardsUpsertedCount++;
            }
            catch (e) {
                console.error(`Failed to insert rate card ${record.name}:`, e.message);
            }
        }));
    }
    console.log(`Sync Complete: Upserted ${rolesUpsertedCount} roles and ${rateCardsUpsertedCount} rate card entries.`);
    return { success: true, rolesUpserted: rolesUpsertedCount, rateCardsUpserted: rateCardsUpsertedCount };
}
//# sourceMappingURL=syncRateCards.js.map