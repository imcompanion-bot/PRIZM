const fs = require('fs');

const code = fs.readFileSync('src/pages/DashboardPage.tsx', 'utf8');

const target = `    const risers = [...withDiff].filter(r => r.diff > 0).sort((a, b) => b.diff - a.diff).slice(0, 5);
    const fallers = [...withDiff].filter(r => r.diff < 0).sort((a, b) => a.diff - b.diff).slice(0, 5);

    let newCount = 0, retainedCount = 0, churnedCount = 0;
    let newValue = 0, retainedValue = 0, churnedValue = 0;
    
    let newClients: any[] = [];
    let retainedClients: any[] = [];
    let churnedClients: any[] = [];

    withDiff.forEach(row => {
      const currentGp = row.gpByPeriod[comparePeriod] || 0;
      const prevGp = basePeriodLabel ? (row.gpByPeriod[basePeriodLabel] || 0) : 0;

      const hasPrev = Math.abs(prevGp) > 1;
      const hasCurrent = Math.abs(currentGp) > 1;

      if (!hasPrev && hasCurrent) {
        newCount++;
        newValue += currentGp;
        newClients.push({ name: row.client, value: currentGp });
      } else if (hasPrev && !hasCurrent) {
        churnedCount++;
        churnedValue += (-prevGp);
        churnedClients.push({ name: row.client, value: -prevGp });
      } else if (hasPrev && hasCurrent) {
        retainedCount++;
        retainedValue += (currentGp - prevGp);
        retainedClients.push({ name: row.client, value: currentGp - prevGp });
      }
    });

    const sortClientsByAbsValue = (arr: any[]) => arr.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
    
    sortClientsByAbsValue(newClients);
    sortClientsByAbsValue(retainedClients);
    sortClientsByAbsValue(churnedClients);

    const metrics = {
      volume: [
        { name: "New", value: newCount, displayValue: newCount, fill: "#10b981", clients: newClients.map(c => c.name) },
        { name: "Retained", value: 0, displayValue: retainedCount, fill: "#3b82f6", clients: retainedClients.map(c => c.name) },
        { name: "Churned", value: -churnedCount, displayValue: -churnedCount, fill: "#f43f5e", clients: churnedClients.map(c => c.name) },
        { name: "Total", value: newCount - churnedCount, displayValue: newCount - churnedCount, fill: "#8b5cf6", clients: [] },
      ],
      value: [
        { name: "New", value: newValue, fill: "#10b981", clients: newClients },
        { name: "Retained", value: retainedValue, fill: "#3b82f6", clients: retainedClients },
        { name: "Churned", value: churnedValue, fill: "#f43f5e", clients: churnedClients },
        { name: "Total", value: newValue + retainedValue + churnedValue, fill: "#8b5cf6", clients: [] },
      ]
    };`;

const replacement = `    const risers = [...withDiff].filter(r => r.diff > 0).sort((a, b) => b.diff - a.diff).slice(0, 5);
    const fallers = [...withDiff].filter(r => r.diff < 0).sort((a, b) => a.diff - b.diff).slice(0, 5);

    let baseCount = 0;
    let baseValue = 0;
    let newCount = 0, retainedCount = 0, churnedCount = 0;
    let newValue = 0, retainedValue = 0, churnedValue = 0;
    
    let newClients: any[] = [];
    let retainedClients: any[] = [];
    let churnedClients: any[] = [];

    withDiff.forEach(row => {
      const currentGp = row.gpByPeriod[comparePeriod] || 0;
      const prevGp = basePeriodLabel ? (row.gpByPeriod[basePeriodLabel] || 0) : 0;

      const hasPrev = Math.abs(prevGp) > 1;
      const hasCurrent = Math.abs(currentGp) > 1;

      if (hasPrev) {
        baseCount++;
        baseValue += prevGp;
      }

      if (!hasPrev && hasCurrent) {
        newCount++;
        newValue += currentGp;
        newClients.push({ name: row.client, value: currentGp });
      } else if (hasPrev && !hasCurrent) {
        churnedCount++;
        churnedValue += (-prevGp);
        churnedClients.push({ name: row.client, value: -prevGp });
      } else if (hasPrev && hasCurrent) {
        retainedCount++;
        retainedValue += (currentGp - prevGp);
        retainedClients.push({ name: row.client, value: currentGp - prevGp });
      }
    });

    const sortClientsByAbsValue = (arr: any[]) => arr.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
    
    sortClientsByAbsValue(newClients);
    sortClientsByAbsValue(retainedClients);
    sortClientsByAbsValue(churnedClients);

    const endCount = baseCount + newCount - churnedCount;
    const endValue = baseValue + newValue + retainedValue + churnedValue;

    const valBase = baseValue;
    const valNew = valBase + newValue;
    const valRetained = valNew + retainedValue;
    const valChurned = valRetained + churnedValue;

    const metrics = {
      volume: [
        { name: basePeriodLabel, value: [0, baseCount], displayValue: baseCount, fill: "#cbd5e1", clients: [] },
        { name: "New", value: [baseCount, baseCount + newCount], displayValue: newCount, fill: "#10b981", clients: newClients.map(c => c.name) },
        { name: "Retained", value: [baseCount + newCount, baseCount + newCount], displayValue: retainedCount, fill: "#3b82f6", clients: retainedClients.map(c => c.name) },
        { name: "Churned", value: [baseCount + newCount, baseCount + newCount - churnedCount], displayValue: -churnedCount, fill: "#f43f5e", clients: churnedClients.map(c => c.name) },
        { name: comparePeriod, value: [0, endCount], displayValue: endCount, fill: "#8b5cf6", clients: [] },
      ],
      value: [
        { name: basePeriodLabel, value: [0, valBase], displayValue: valBase, fill: "#cbd5e1", clients: [] },
        { name: "New", value: [valBase, valNew], displayValue: newValue, fill: "#10b981", clients: newClients },
        { name: "Retained", value: [valNew, valRetained], displayValue: retainedValue, fill: "#3b82f6", clients: retainedClients },
        { name: "Churned", value: [valRetained, valChurned], displayValue: churnedValue, fill: "#f43f5e", clients: churnedClients },
        { name: comparePeriod, value: [0, endValue], displayValue: endValue, fill: "#8b5cf6", clients: [] },
      ]
    };`;

const newCode = code.replace(target, replacement);
if (newCode === code) {
  console.log('Metrics replacement failed');
} else {
  fs.writeFileSync('src/pages/DashboardPage.tsx', newCode);
  console.log('Metrics replacement succeeded');
}
