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
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: "People Counter Global!1:3",
    });
    console.log("--- People Counter Global ---");
    console.log(res.data.values[0]);
    console.log(res.data.values[1]);
    console.log(res.data.values[2]);
  } catch (e) {
    console.log("Error reading People:", e.message);
  }
}

run().catch(console.error);
