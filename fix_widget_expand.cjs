const fs = require('fs');
const file = 'src/components/analytics/ClientFinancialsWidget.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add imports
content = content.replace(
  'import { cn } from "@/lib/utils";',
  'import { cn } from "@/lib/utils";\nimport { ChevronDown, ChevronRight } from "lucide-react";'
);

// 2. Add othersList to useMemo return
content = content.replace(
  'return { fullTable, top10, othersValue, totalValue, priorFy, compiledCount: compiled.length };',
  'return { fullTable, top10, othersList: others, othersValue, totalValue, priorFy, compiledCount: compiled.length };'
);

// 3. Add state for isOthersExpanded
content = content.replace(
  'const [activeFy, setActiveFy] = useState("fy25_26");',
  'const [activeFy, setActiveFy] = useState("fy25_26");\n  const [isOthersExpanded, setIsOthersExpanded] = useState(false);'
);

fs.writeFileSync(file, content);
console.log("Prep applied");
