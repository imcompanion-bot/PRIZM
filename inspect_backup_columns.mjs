import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backupFile = path.join(__dirname, 'supabase_backup', 'projects.json');

const data = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
console.log(`Total backup projects: ${data.length}`);

let nullRecordType = 0;
let nullRevenue = 0;
let revenueEqualsPrice = 0;

for (const p of data) {
  if (p.opportunity_record_type === null) nullRecordType++;
  if (p.revenue === null) nullRevenue++;
  if (p.revenue === p.price) revenueEqualsPrice++;
}

console.log(`Null opportunity_record_type: ${nullRecordType}`);
console.log(`Null revenue: ${nullRevenue}`);
console.log(`Revenue equals Price: ${revenueEqualsPrice} / ${data.length}`);

// Print a few sample projects from backup
console.log("Samples:");
console.log(data.slice(0, 3).map(p => ({
  title: p.title,
  opportunity_number: p.opportunity_number,
  opportunity_record_type: p.opportunity_record_type,
  revenue: p.revenue,
  price: p.price,
  probability: p.probability
})));
