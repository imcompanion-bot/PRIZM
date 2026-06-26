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
    
    const withCode = timeEntries.filter(te => te.projectCode !== null && te.projectCode !== undefined && te.projectCode.trim() !== "");
    console.log(`Time entries with non-empty projectCode: ${withCode.length}`);
    
    if (withCode.length > 0) {
      console.log("Sample non-empty projectCode entries:", withCode.slice(0, 5).map(te => ({
        projectName: te.projectName,
        projectCode: te.projectCode,
        project_id: te.project_id
      })));
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

run();
