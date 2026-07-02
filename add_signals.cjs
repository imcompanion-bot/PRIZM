const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/pages/FeeCalculatorPage.tsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/<Section([\s\S]*?)>/g, (match, p1) => {
  if (p1.includes('title="Overview"')) return match;
  if (p1.includes('expandSignal')) return match;
  return `<Section${p1} expandSignal={expandAllSignal} collapseSignal={collapseAllSignal}>`;
});

fs.writeFileSync(file, content, 'utf8');
console.log('Done');
