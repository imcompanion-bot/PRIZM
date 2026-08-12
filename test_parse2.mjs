import { format, endOfMonth } from 'date-fns';
const d = endOfMonth(new Date(2026, 0, 1));
console.log(d.toString());
console.log(format(d, "dd MMM"));
