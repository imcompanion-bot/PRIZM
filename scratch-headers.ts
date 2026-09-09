import { google } from 'googleapis';
import * as dotenv from 'dotenv';
import fs from 'fs';

let envStr = '';
if (fs.existsSync('.env')) envStr += fs.readFileSync('.env', 'utf-8') + '\n';
const lines = envStr.split('\n');
const env: Record<string, string> = {};
for (const line of lines) {
  if (line.includes('=')) {
    const [key, ...rest] = line.split('=');
    env[key.trim()] = rest.join('=').trim().replace(/['"]/g, '');
  }
}

async function run() {
  // We don't have service account credentials in the standard .env, we have to look in the functions folder
  const SHEET_ID = "1kHXAbVe-EAD-l63C7o4c1bJcvL0ECEyylXrspV8fJCQ";
}
run();
