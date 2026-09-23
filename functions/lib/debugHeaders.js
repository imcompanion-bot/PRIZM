"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.debugHeadersHttp = void 0;
const https_1 = require("firebase-functions/v2/https");
const googleapis_1 = require("googleapis");
const SHEET_ID = "1kHXAbVe-EAD-l63C7o4c1bJcvL0ECEyylXrspV8fJCQ";
exports.debugHeadersHttp = (0, https_1.onRequest)({ region: "us-east4", timeoutSeconds: 500, memory: "1GiB" }, async (req, res) => {
    try {
        const auth = new googleapis_1.google.auth.GoogleAuth({
            scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
        });
        const authClient = await auth.getClient();
        const sheets = googleapis_1.google.sheets({ version: "v4", auth: authClient });
        const res1 = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: "Talent Contingency (de-risked)!A1:G10",
        });
        const res2 = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: "Talent Savings Summary!A1:G10",
        });
        res.json({
            contingency: res1.data.values,
            savings: res2.data.values
        });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
//# sourceMappingURL=debugHeaders.js.map