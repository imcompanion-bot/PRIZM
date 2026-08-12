import { parseISO, format } from 'date-fns';
process.env.TZ = 'America/New_York';
const d = parseISO("2026-04-01");
console.log(d.toString());
console.log(format(d, "yyyy-MM-dd"));
