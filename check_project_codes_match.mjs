import { initializeApp } from 'firebase/app';
import { 
  getAllTimeEntries,
  listProjects
} from './src/dataconnect-generated/esm/index.esm.js';

const firebaseConfig = {
  projectId: "pharaoh-54a0e",
  appId: "1:909637352706:web:98a9ef33d6b680d6e8d61b",
  storageBucket: "pharaoh-54a0e.firebasestorage.app",
  apiKey: "AIzaSyBWy2AP5d-YTdpirVipzs2tvd0hVqqfeIw",
  authDomain: "pharaoh-54a0e.firebaseapp.com",
  messagingSenderId: "909637352706",
};

const app = initializeApp(firebaseConfig);

async function run() {
  try {
    console.log("Fetching projects...");
    const projRes = await listProjects();
    const projects = projRes.data.projectss || [];
    
    console.log("Fetching all time entries...");
    const timeRes = await getAllTimeEntries();
    const timeEntries = timeRes.data.timeEntriess || [];
    
    const projectCodes = new Set();
    for (const te of timeEntries) {
      if (te.projectCode) projectCodes.add(te.projectCode.trim());
    }
    
    const opportunityNumbers = new Set();
    for (const p of projects) {
      if (p.opportunity_number) opportunityNumbers.add(p.opportunity_number.trim());
    }
    
    console.log(`Unique project codes in time entries: ${projectCodes.size}`);
    console.log(`Unique opportunity numbers in projects: ${opportunityNumbers.size}`);
    
    const overlap = [];
    for (const code of projectCodes) {
      if (opportunityNumbers.has(code)) {
        overlap.push(code);
      }
    }
    
    console.log(`Overlap count: ${overlap.length}`);
    if (overlap.length > 0) {
      console.log("Sample overlapping codes:", overlap.slice(0, 10));
    } else {
      console.log("No overlap found between time entry project codes and project opportunity numbers.");
      console.log("Sample project codes in time entries:", Array.from(projectCodes).slice(0, 10));
      console.log("Sample opportunity numbers in projects:", Array.from(opportunityNumbers).slice(0, 10));
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

run();
