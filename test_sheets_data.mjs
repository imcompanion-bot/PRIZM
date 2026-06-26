import { google } from "googleapis";

const SHEET_ID = "1kHXAbVe-EAD-l63C7o4c1bJcvL0ECEyylXrspV8fJCQ";

async function run() {
  try {
    console.log("Authenticating...");
    const auth = new google.auth.GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const authClient = await auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: authClient });

    console.log("Fetching range A4:Z10...");
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: "Data summary - P&L phased (de-risked)!A4:Z10",
    });

    const rows = res.data.values || [];
    console.log("Headers (Row 4):", rows[0]);
    console.log("Row 5:", rows[1]);
    console.log("Row 6:", rows[2]);
  } catch (error) {
    console.error("Error fetching sheet:", error);
  }
}

run();
