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
        range: "Data summary - P&L phased (de-risked)!A4:ZZ3000",
      });

      const rows = response.data.values || [];

      res.json({
        rows
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }
);
