import { initializeApp } from 'firebase/app';
import { 
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
    
    console.log(`Loaded ${projects.length} projects.`);
    
    const byCode = projects.filter(p => p.opportunity_number === "012113" || p.opportunity_number === "12113");
    console.log("Projects matching code '012113' or '12113':", byCode);
    
    const byName = projects.filter(p => p.title && p.title.toLowerCase().includes("desperado"));
    console.log("Projects matching name 'desperado':", byName);
    
  } catch (error) {
    console.error("Error:", error);
  }
}

run();
