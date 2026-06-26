import { initializeApp } from 'firebase/app';
import { listProjects } from './src/dataconnect-generated/esm/index.esm.js';

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
    const projRes = await listProjects();
    const projects = projRes.data.projectss || [];
    console.log(`Fetched ${projects.length} projects from Data Connect.`);

    let nullRevenueCount = 0;
    let zeroRevenueCount = 0;
    let positiveRevenueCount = 0;
    const samples = [];

    for (const p of projects) {
      if (p.revenue === undefined) {
        nullRevenueCount++;
      } else if (p.revenue === null || p.revenue === 0) {
        zeroRevenueCount++;
      } else {
        positiveRevenueCount++;
        if (samples.length < 10) {
          samples.push(p);
        }
      }
    }

    console.log(`Revenue stats in Data Connect projects:`);
    console.log(`- Undefined: ${nullRevenueCount}`);
    console.log(`- Null or Zero: ${zeroRevenueCount}`);
    console.log(`- Positive (>0): ${positiveRevenueCount}`);

    console.log("\nSample positive revenue projects:");
    console.log(JSON.stringify(samples, null, 2));

  } catch (err) {
    console.error(err);
  }
}

run();
