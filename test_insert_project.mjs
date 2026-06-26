import { initializeApp } from 'firebase/app';
import { 
  insertProjects,
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
    const testId = "00000000-0000-0000-0000-999999999999";
    console.log("Querying projects...");
    const projRes = await listProjects();
    const projects = projRes.data.projectss || [];
    const testProj = projects.find(p => p.title.includes("Test Opportunity"));
    console.log("Retrieved test project by title:", testProj);
    
  } catch (error) {
    console.error("Error:", error);
  }
}

run();
