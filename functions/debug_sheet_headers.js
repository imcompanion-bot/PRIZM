const { google } = require("googleapis");
const path = require("path");

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"];
const SPREADSHEET_ID = "1430F9o1E-TeyhZ52Kq4n5HnL9y457BIn4dI8G-B7dM8";

async function run() {
  const auth = new google.auth.GoogleAuth({
    keyFile: "/Users/jamesbrazier/Documents/GitHub/PRIZM/firebase_admin_key.json",
    scopes: SCOPES,
  });

  const sheets = google.sheets({ version: "v4", auth });

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Data summary - P&L phased (de-risked)!B4:ZZ4",
    });
    
    const headers = response.data.values[0];
    headers.forEach((h, i) => console.log(`${i}: ${h}`));
  } catch (err) {
    console.error("Error reading sheets:", err.message);
  }
}

run();
