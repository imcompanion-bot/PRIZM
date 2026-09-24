const fs = require('fs');

const path = 'src/pages/ProfitabilityPage.tsx';
let content = fs.readFileSync(path, 'utf8');

// We will replace:
// 1. the inside of clientGroups
// 2. inject a new useMemo just before clientGroups
// 3. update the prop passed to ProfitabilityTrendChart

// Find the insertion point before clientGroups
const clientGroupsStart = content.indexOf('  // ── Compute Client Profitability ──');

const newMemo = `  // ── Base Filtered Projects ──
  const baseFilteredProjects = useMemo(() => {
    const EXCLUDED_RECORD_TYPES = ["agency - talent savings", "agency - passthrough costs", "agency - rfp / rfi", "agency - holding pot"];
    const TIMESHEET_DATA_START = "2024-01-01";

    return projects.filter((p: any) => {
      if (!matchesOffice(p.office, officeFilter)) return false;
      // Exclude projects that started before timesheet data exists (1 Jan 2025) to avoid inflated margins
      if (p.start_date && p.start_date.trim() < TIMESHEET_DATA_START) return false;
      // Include projects that were "live" during the period: started before today AND ended after cutoff
      const pStart = p.start_date ? p.start_date.trim() : null;
      const pEnd = p.end_date ? p.end_date.trim() : null;
      if (pEnd && pEnd < cutoffDate) return false;
      if (pStart && pStart > todayStr) return false;
      const client = p.ultimate_parent || p.title || "";
      if (client.toLowerCase().includes("billion dollar boy")) return false;

      // Core check: restrict to allocated clients strictly
      if (isCore) {
        if (!allocatedClients.some(ac => ac.toLowerCase() === client.toLowerCase())) {
          return false;
        }
      }

      // Exclude passthrough / talent savings record types
      const recordType = (p.opportunity_record_type || "").trim().toLowerCase();
      const titleLower = (p.title || "").toLowerCase();
      
      const isTE = recordType === "agency - talent savings" || titleLower.includes("talent savings") || titleLower.includes("talent efficiencies");
      
      if (isTE) {
        return false; // TEs are injected directly from the talent_efficiencies table instead
      } else {
        if (EXCLUDED_RECORD_TYPES.includes(recordType)) return false;
        if (titleLower.includes("holding pot") || titleLower.includes("passthrough costs")) {
          return false;
        }
      }

      return true;
    });
  }, [projects, officeFilter, cutoffDate, todayStr, isCore, allocatedClients]);

  const trendFilteredProjects = useMemo(() => {
    const today = new Date();
    return baseFilteredProjects.filter((p: any) => {
      if (statusFilter === "ended") {
        const projEnd = parseISO(p.end_date);
        if (projEnd > today) return false;
      }
      return true;
    });
  }, [baseFilteredProjects, statusFilter]);

`;

// Extract the old filtered out of clientGroups
const oldFilteredStart = content.indexOf('    const EXCLUDED_RECORD_TYPES =', clientGroupsStart);
const oldFilteredEnd = content.indexOf('    // Helper: count working days between two dates', oldFilteredStart);

const beforeOld = content.substring(0, oldFilteredStart);
const afterOld = content.substring(oldFilteredEnd);

// Replace it with `const filtered = baseFilteredProjects;`
content = beforeOld + `    const filtered = baseFilteredProjects;\n\n` + afterOld;

// Insert newMemo before clientGroupsStart
const finalContent = content.substring(0, clientGroupsStart) + newMemo + content.substring(clientGroupsStart);

fs.writeFileSync(path, finalContent);

console.log('Replaced filtered logic in ProfitabilityPage');
