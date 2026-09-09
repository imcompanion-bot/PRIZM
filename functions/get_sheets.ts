import { google } from 'googleapis';
async function run() {
  const auth = new google.auth.GoogleAuth({ scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'] });
  const sheets = google.sheets({ version: 'v4', auth });
  const res = await sheets.spreadsheets.get({ spreadsheetId: '1kHXAbVe-EAD-l63C7o4c1bJcvL0ECEyylXrspV8fJCQ' });
  console.log(res.data.sheets?.map(s => s.properties?.title));
}
run();
