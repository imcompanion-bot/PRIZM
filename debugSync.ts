import { google } from 'googleapis';
async function run() {
  const auth = new google.auth.GoogleAuth({ scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'] });
  const sheets = google.sheets({ version: 'v4', auth });
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: '1kHXAbVe-EAD-l63C7o4c1bJcvL0ECEyylXrspV8fJCQ', range: 'Data summary - P&L phased (de-risked)!B5:ZZ' });
  const rows = res.data.values || [];
  let sum178 = 0, sum201 = 0, sum251 = 0;
  for (const row of rows) {
    if (String(row[1]).includes('Heineken') || String(row[2]).includes('Heineken') || String(row[3]).includes('Heineken')) {
      const v178 = parseFloat(String(row[178] || '').replace(/,/g, ''));
      if (!isNaN(v178)) sum178 += v178;
      const v201 = parseFloat(String(row[201] || '').replace(/,/g, ''));
      if (!isNaN(v201)) sum201 += v201;
      const v251 = parseFloat(String(row[251] || '').replace(/,/g, ''));
      if (!isNaN(v251)) sum251 += v251;
    }
  }
  console.log('Sums from sheet B5:ZZ - 178:', sum178, '201:', sum201, '251:', sum251);
}
run();
