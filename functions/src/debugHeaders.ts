import { onRequest } from "firebase-functions/v2/https";
import { google } from "googleapis";

const SHEET_ID = "1kHXAbVe-EAD-l63C7o4c1bJcvL0ECEyylXrspV8fJCQ";

export const debugHeadersHttp = onRequest(
  { region: "us-east4", timeoutSeconds: 500, memory: "1GiB" },
  async (req, res) => {
    try {
      const auth = new google.auth.GoogleAuth({
        scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
      });
      const authClient = await auth.getClient();
      const sheets = google.sheets({ version: "v4", auth: authClient as any });

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
        rows: [] as any[]
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
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }
);
