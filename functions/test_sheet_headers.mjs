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
      range: "Data summary - P&L phased (de-risked)!A4:GZ4",
    });

    const headers = res.data.values[0] || [];
    console.log("Header at 188 (GG):", headers[188]);
    console.log("Header at 189 (GH):", headers[189]);
    
    // find "Opportunity Record Type"
    const idx = headers.findIndex(h => h && h.trim().toLowerCase() === "opportunity record type");
    console.log("Found at index:", idx, "which is column:", idx >= 0 ? String.fromCharCode(65 + Math.floor(idx / 26) - 1) + String.fromCharCode(65 + (idx % 26)) : "not found");
    
    // let's just print a few around it
    for (let i = 185; i <= 195; i++) {
        console.log(`Index ${i}: ${headers[i]}`);
    }

  } catch (error) {
    console.error("Error fetching sheet:", error);
  }
}

run();
