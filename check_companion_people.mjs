import { initializeApp } from 'firebase/app';
import { 
  listPeople
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
    const peopleRes = await listPeople();
    const people = peopleRes.data.peoples || [];
    
    const companionPeople = people.filter(p => p.office === "Companion");
    console.log(`Total people with 'Companion' office: ${companionPeople.length}`);
    
    const teamCounts = {};
    for (const p of companionPeople) {
      teamCounts[p.team] = (teamCounts[p.team] || 0) + 1;
    }
    console.log("Companion people by team:", teamCounts);
    
    if (companionPeople.length > 0) {
      console.log("Sample Companion people:", companionPeople.slice(0, 10).map(p => ({ name: p.name, team: p.team, office: p.office })));
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

run();
