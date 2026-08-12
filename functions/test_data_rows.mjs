import { google } from "googleapis";

const SHEET_ID = "1kHXAbVe-EAD-l63C7o4c1bJcvL0ECEyylXrspV8fJCQ";

async function run() {
  try {
    const auth = new google.auth.GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });
    const authClient = await auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: authClient });

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: "Data summary - P&L phased (de-risked)!A4:GZ10",
    });

    const rows = res.data.values || [];
    console.log("Header 188:", rows[0][188]);
    console.log("Header 189:", rows[0][189]);
    console.log("Header 190:", rows[0][190]);
    console.log("---");
    for (let i = 1; i < Math.min(6, rows.length); i++) {
        console.log(`Row ${i} length: ${rows[i].length}`);
        console.log(`Row ${i} Col 188:`, rows[i][188]);
        console.log(`Row ${i} Col 189:`, rows[i][189]);
        console.log(`Row ${i} Col 190:`, rows[i][190]);
    }
  } catch (error) {
    console.error(error);
  }
}

run();
