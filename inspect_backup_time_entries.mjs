import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backupFile = path.join(__dirname, 'supabase_backup', 'time_entries.json');

const data = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
console.log(`Total backup time entries: ${data.length}`);

const withCode = data.filter(te => te.project_code !== null && te.project_code !== undefined && te.project_code.trim() !== "");
console.log(`Backup time entries with non-empty project_code: ${withCode.length}`);

if (withCode.length > 0) {
  console.log("Sample backup entries with project_code:", withCode.slice(0, 5).map(te => ({
    project_name: te.project_name,
    project_code: te.project_code,
    project_id: te.project_id
  })));
}
