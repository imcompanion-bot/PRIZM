import fs from 'fs';
const data = JSON.parse(fs.readFileSync('.system_generated/logs/transcript.jsonl', 'utf8').split('\n').pop() || '{}');
