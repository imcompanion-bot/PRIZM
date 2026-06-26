import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backupFile = path.join(__dirname, 'supabase_backup', 'projects.json');

const data = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
console.log(`Total backup projects: ${data.length}`);

const withOpp = data.filter(p => p.opportunity_number !== null && p.opportunity_number !== undefined && p.opportunity_number !== "");
console.log(`Backup projects with opportunity_number: ${withOpp.length}`);
if (withOpp.length > 0) {
  console.log("Sample backup projects with opportunity number:", withOpp.slice(0, 5).map(p => ({ title: p.title, opportunity_number: p.opportunity_number })));
}
