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
    const projRes = await listProjects();
    const projects = projRes.data.projectss || [];
    
    console.log(`Total projects: ${projects.length}`);
    const withOppNumber = projects.filter(p => p.opportunity_number !== null && p.opportunity_number !== undefined);
    console.log(`Projects with non-null opportunity_number: ${withOppNumber.length}`);
    
    if (withOppNumber.length > 0) {
      console.log("Sample non-null opportunity numbers:", withOppNumber.slice(0, 10).map(p => ({ title: p.title, opportunity_number: p.opportunity_number })));
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

run();
