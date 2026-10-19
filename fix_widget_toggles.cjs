const fs = require('fs');
const file = 'src/components/analytics/ClientFinancialsWidget.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add local state
content = content.replace(
  'const [metric, setMetric] = useState<MetricType>("gp");\n  const [activeFy, setActiveFy] = useState("fy25_26");',
  'const [metric, setMetric] = useState<MetricType>("gp");\n  const [activeFy, setActiveFy] = useState("fy25_26");\n  const [localOfficeFilter, setLocalOfficeFilter] = useState<OfficeFilter>(officeFilter);'
);

// 2. Change logic to use localOfficeFilter
content = content.replace(
  'if (officeFilter === "Global") matchesOffice = true;\n      else if (officeFilter === "UK") matchesOffice = (o === "UK" || o === "UNITED KINGDOM" || o === "COMPANION");\n      else if (officeFilter === "US") matchesOffice = (o === "US" || o === "UNITED STATES");',
  'if (localOfficeFilter === "Global") matchesOffice = true;\n      else if (localOfficeFilter === "UK") matchesOffice = (o === "UK" || o === "UNITED KINGDOM" || o === "COMPANION");\n      else if (localOfficeFilter === "US") matchesOffice = (o === "US" || o === "UNITED STATES");'
);

// Wait, there are two instances of officeFilter logic in the file: one for projects, one for TEs.
// I'll replace all instances of `officeFilter ===` with `localOfficeFilter ===`.
content = content.replace(/officeFilter === /g, 'localOfficeFilter === ');

// Update the dependency array
content = content.replace(
  '[projects, tes, metric, activeFy, officeFilter, displayCurrency]',
  '[projects, tes, metric, activeFy, localOfficeFilter, displayCurrency]'
);

// 3. Add the UI toggle next to the FY dropdown
const uiToggle = `
          <FilterToggleGroup 
            value={localOfficeFilter} 
            onChange={(v) => setLocalOfficeFilter(v as OfficeFilter)} 
            options={[
              { value: "Global", label: "Global" },
              { value: "UK", label: "UK" },
              { value: "US", label: "US" }
            ]} 
          />
          <span className="text-sm font-medium text-muted-foreground ml-2">FY</span>`;

content = content.replace(
  '<span className="text-sm font-medium text-muted-foreground">FY</span>',
  uiToggle
);

fs.writeFileSync(file, content);
console.log("Updated widget toggles successfully");
