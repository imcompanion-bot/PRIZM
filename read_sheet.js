import { google } from 'googleapis';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY),
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.CENTRAL_SPREADSHEET_ID,
    range: "Talent Contingency (de-risked)!A1:Z100",
  });
  
  const rows = res.data.values;
  const header = rows[0]; // Assuming row 0 or 1 is header
  
  for (let i=0; i<rows.length; i++) {
     const opp = rows[i][1] || rows[i][0]; // Check columns for opportunity
     if (typeof opp === 'string' && (opp.includes('Hellmann') || opp.includes('Skincare') || opp.includes('Production Shoot'))) {
         console.log(`Row ${i}:`, rows[i]);
     }
  }
}
run();
