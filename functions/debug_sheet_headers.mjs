import { google } from "googleapis";

async function run() {
  const auth = new google.auth.GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  const authClient = await auth.getClient();
  const sheets = google.sheets({ 
    version: "v4", 
    auth: authClient,
  });

  const SHEET_ID = "1kHXAbVe-EAD-l63C7o4c1bJcvL0ECEyylXrspV8fJCQ";

  try {
    const res1 = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: "Talent Contingency (de-risked)!1:5",
    });
    console.log("--- Talent Contingency (de-risked) ---");
    console.log(JSON.stringify(res1.data.values, null, 2));
  } catch (e) {
    console.log("Error reading Contingency:", e.message);
  }

  try {
    const res2 = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: "Talent Savings Summary!1:5",
    });
    console.log("--- Talent Savings Summary ---");
    console.log(JSON.stringify(res2.data.values, null, 2));
  } catch (e) {
    console.log("Error reading Savings:", e.message);
  }
}

run().catch(console.error);
