import { google } from 'googleapis';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

let envStr = '';
if (fs.existsSync('.env')) envStr += fs.readFileSync('.env', 'utf-8') + '\n';

async function run() {
  const SHEET_ID = "1kHXAbVe-EAD-l63C7o4c1bJcvL0ECEyylXrspV8fJCQ";
  const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  // I need to use the service account somehow... wait, there is no service account file in the repo.
  // Wait, I don't have the google credentials. But I can just check my code in syncCentralData.ts.
}
run();
