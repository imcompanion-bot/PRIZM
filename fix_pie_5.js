import fs from 'fs';
const content = fs.readFileSync('src/components/time-tracking/AnalysisTab.tsx', 'utf8');
const pieCode = content.substring(content.indexOf('<PieChart>'), content.indexOf('</PieChart>') + 15);
console.log(pieCode);
