import { initializeApp } from 'firebase/app';
import { getTimeEntriesByDateRange, listProjects } from './src/dataconnect-generated/esm/index.esm.js';

const firebaseConfig = {
  projectId: "pharaoh-54a0e",
  appId: "1:909637352706:web:98a9ef33d6b680d6e8d61b",
  storageBucket: "pharaoh-54a0e.firebasestorage.app",
  apiKey: "AIzaSyBWy2AP5d-YTdpirVipzs2tvd0hVqqfeIw",
  authDomain: "pharaoh-54a0e.firebaseapp.com",
  messagingSenderId: "909637352706",
};

initializeApp(firebaseConfig);

async function run() {
  try {
    const startDate = "2026-03-01";
    const endDate = "2026-05-31";

    const [entriesRes, projRes] = await Promise.all([
      getTimeEntriesByDateRange({ startDate, endDate }),
      listProjects()
    ]);

    const entries = entriesRes.data.timeEntriess || [];
    const projects = projRes.data.projectss || [];

    const projectsMap = new Map(projects.map(p => [p.id, p]));
    const projectIds = new Set(projects.map(p => p.id));

    let totalEntries = 0;
    let nonNullProjIdEntries = 0;
    let resolvedEntries = 0;
    let unresolvedEntries = 0;

    let unresolvedHours = 0;
    const unresolvedProjectIds = new Set();
    const unresolvedSample = [];

    for (const entry of entries) {
      totalEntries++;
      if (entry.project_id) {
        nonNullProjIdEntries++;
        if (projectsMap.has(entry.project_id)) {
          resolvedEntries++;
        } else {
          unresolvedEntries++;
          unresolvedHours += entry.hours || 0;
          unresolvedProjectIds.add(entry.project_id);
          if (unresolvedSample.length < 5) {
            unresolvedSample.push(entry);
          }
        }
      }
    }

    console.log(`=== Project Matching Diagnostic ===`);
    console.log(`Total time entries: ${totalEntries}`);
    console.log(`Entries with non-null project_id: ${nonNullProjIdEntries}`);
    console.log(`Successfully resolved in projectsMap: ${resolvedEntries}`);
    console.log(`Failed to resolve in projectsMap: ${unresolvedEntries}`);
    console.log(`Failed hours: ${unresolvedHours.toFixed(2)}h`);
    console.log(`Unique unresolved project IDs: ${unresolvedProjectIds.size}`);

    console.log("\nUnresolved sample entries:");
    console.log(JSON.stringify(unresolvedSample, null, 2));

  } catch (err) {
    console.error(err);
  }
}

run();
