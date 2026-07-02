const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/components/time-tracking/UtilisationTab.tsx');
let content = fs.readFileSync(file, 'utf8');

const targetMethod = `  const teamSummaries = useMemo(() => {`;
const endMethod = `  }, [personSummaries, showFormer]);`;

const startIndex = content.indexOf(targetMethod);
const endIndex = content.indexOf(endMethod);

if (startIndex === -1 || endIndex === -1) {
  console.log("Could not find teamSummaries block");
  process.exit(1);
}

const before = content.slice(0, startIndex + targetMethod.length);
const inner = content.slice(startIndex + targetMethod.length, endIndex);
const after = content.slice(endIndex);

const wrappedInner = `
    try {
${inner}
    } catch (e) {
      console.error("CRASH IN TEAM SUMMARIES", e);
      return [];
    }
`;

fs.writeFileSync(file, before + wrappedInner + after, 'utf8');
console.log("Added try...catch to teamSummaries");
