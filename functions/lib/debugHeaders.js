"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.debugHeadersHttp = void 0;
const https_1 = require("firebase-functions/v2/https");
const googleapis_1 = require("googleapis");
const SHEET_ID = "1kHXAbVe-EAD-l63C7o4c1bJcvL0ECEyylXrspV8fJCQ";
exports.debugHeadersHttp = (0, https_1.onRequest)({ timeoutSeconds: 500, memory: "1GiB" }, async (req, res) => {
    try {
        const auth = new googleapis_1.google.auth.GoogleAuth({
            scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
        });
        const authClient = await auth.getClient();
        const sheets = googleapis_1.google.sheets({ version: "v4", auth: authClient });
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: "Data summary - P&L phased (de-risked)!A4:GZ10",
        });
        const rows = response.data.values || [];
        const headers = rows[0] || [];
        const oppIdx = headers.findIndex(h => h && String(h).trim().toLowerCase() === "opportunity record type");
        const resData = {
            oppIdx,
            headers: {
                187: headers[187],
                188: headers[188],
                189: headers[189],
                190: headers[190],
            },
            rows: []
        };
        for (let i = 1; i < Math.min(6, rows.length); i++) {
            resData.rows.push({
                row: i,
                length: rows[i].length,
                188: rows[i][188],
                189: rows[i][189],
                190: rows[i][190],
            });
        }
        res.json(resData);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
//# sourceMappingURL=debugHeaders.js.map