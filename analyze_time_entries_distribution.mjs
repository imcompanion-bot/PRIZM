import { initializeApp } from 'firebase/app';
import { 
  getAllTimeEntries
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
    console.log("Fetching all time entries...");
    const timeRes = await getAllTimeEntries();
    const timeEntries = timeRes.data.timeEntriess || [];
    console.log(`Loaded ${timeEntries.length} time entries.`);
    
    const counts = {};
    for (const te of timeEntries) {
      const name = te.projectName || "Unassigned / Null";
      counts[name] = (counts[name] || 0) + 1;
    }
    
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    console.log("Top 30 projects by entry count:");
    console.log(sorted.slice(0, 30));
    
  } catch (error) {
    console.error("Error:", error);
  }
}

run();
