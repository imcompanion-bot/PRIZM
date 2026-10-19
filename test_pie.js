import fs from 'fs';
const content = fs.readFileSync('src/components/analytics/ClientFinancialsWidget.tsx', 'utf8');
const pieCode = content.substring(content.indexOf('<RechartsPrimitive.PieChart>'), content.indexOf('</RechartsPrimitive.PieChart>') + 30);
console.log(pieCode);
