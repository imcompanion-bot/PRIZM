const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");

const serviceAccountKeyPath = path.join(__dirname, "service-account.json");
const serviceAccountKey = JSON.parse(fs.readFileSync(serviceAccountKeyPath, "utf8"));

const jwtClient = new google.auth.JWT(
  serviceAccountKey.client_email,
  null,
  serviceAccountKey.private_key,
  ["https://www.googleapis.com/auth/spreadsheets.readonly"]
);

const sheets = google.sheets({ version: "v4", auth: jwtClient });
const SHEET_ID = "1nI8Zf3w9rR4jM9A2u7r-D7-49p6c_m0g91y71hB4H4M";

async function main() {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "Data summary - P&L phased (de-risked)!B5:ZZ",
  });
  
  const rows = res.data.values || [];
  const targetRow = rows.find(r => r[0] && r[0].includes("King - All Stars 2026"));
  if (targetRow) {
    console.log("Found row. Title:", targetRow[0]);
    console.log("Index 212 (HF - Currency):", targetRow[212]);
    console.log("Index 213 (HG - Total price):", targetRow[213]);
    console.log("Index 215 (HI - Media costs):", targetRow[215]);
    console.log("Index 223 (HQ - Gross budget):", targetRow[223]);
    console.log("Row length:", targetRow.length);
  } else {
    console.log("Row not found");
  }
}

main().catch(console.error);
