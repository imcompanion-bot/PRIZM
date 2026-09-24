const fs = require('fs');

const path = 'src/pages/ProfitabilityPage.tsx';
let content = fs.readFileSync(path, 'utf8');

// The replacement logic:
// We will extract `const filteredProjects = useMemo(() => { ... }, [projects, officeFilter, cutoffDate, endDateStr, todayStr, isCore, allocatedClients]);`
// And change `const clientGroups = useMemo(() => { ... const filtered = ... })` 
// to use `filteredProjects` directly.

const extractStart = `  // ── Compute Client Profitability ──`;
const extractEnd = `    // Helper: count working days between two dates`;

const toReplace = `  // ── Compute Client Profitability ──

  const clientGroups = useMemo(() => {
    const today = new Date();

    const EXCLUDED_RECORD_TYPES = ["agency - talent savings", "agency - passthrough costs", "agency - rfp / rfi", "agency - holding pot"];

    const TIMESHEET_DATA_START = "2024-01-01";

    const filtered = projects.filter((p: any) => {
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

    // Helper: count working days between two dates`;

const replacement = `  // ── Filter Projects ──
  const filteredProjects = useMemo(() => {
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

      // We also need to check the status filter for the trend chart?
      // Wait, ProfitabilityTrendChart had:
      if (statusFilter === "ended") {
        const projEnd = parseISO(p.end_date);
        const today = new Date();
        if (projEnd > today) return false;
      }

      return true;
    });
  }, [projects, officeFilter, cutoffDate, todayStr, isCore, allocatedClients, statusFilter]);

  // ── Compute Client Profitability ──

  const clientGroups = useMemo(() => {
    const today = new Date();
    
    const filtered = filteredProjects.filter((p: any) => {
      // The original ProfitabilityPage didn't have statusFilter for its main list of projects.
      // Ah wait! The ProfitabilityPage DID have a statusFilter later?
      // Wait, let's just use filteredProjects directly here, but wait... 
      // did the main page use statusFilter? Let's check.
      return true;
    });

    // Helper: count working days between two dates`;

// WAIT. Let's do it cleanly via sed or another script.
