"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const googleapis_1 = require("googleapis");
const app_1 = require("firebase-admin/app");
if ((0, app_1.getApps)().length === 0) {
    (0, app_1.initializeApp)();
}
async function analyze() {
    try {
        const auth = new googleapis_1.google.auth.GoogleAuth({
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });
        const sheets = googleapis_1.google.sheets({ version: 'v4', auth });
        const spreadsheetId = '1kHXAbVe-EAD-l63C7o4c1bJcvL0ECEyylXrspV8fJCQ';
        console.log("Fetching spreadsheet metadata...");
        const metadata = await sheets.spreadsheets.get({ spreadsheetId });
        for (const sheet of metadata.data.sheets || []) {
            const title = sheet.properties?.title;
            console.log(`\n================================`);
            console.log(`TAB: ${title}`);
            console.log(`================================`);
            const data = await sheets.spreadsheets.values.get({
                spreadsheetId,
                range: `${title}!A1:Z5`
            });
            const rows = data.data.values || [];
            rows.forEach((row, idx) => {
                console.log(`Row ${idx + 1}:`, JSON.stringify(row));
            });
        }
    }
    catch (e) {
        console.error("Failed to analyze sheet:", e.message);
    }
}
analyze();
//# sourceMappingURL=analyzeSheet.js.map