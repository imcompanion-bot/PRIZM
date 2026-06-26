const { initializeApp } = require('firebase/app');
const { executeQuery, queryRef, getDataConnect } = require('firebase/data-connect');

const firebaseConfig = {
  projectId: "pharaoh-54a0e",
  appId: "1:909637352706:web:98a9ef33d6b680d6e8d61b",
  storageBucket: "pharaoh-54a0e.firebasestorage.app",
  apiKey: "AIzaSyBWy2AP5d-YTdpirVipzs2tvd0hVqqfeIw",
  authDomain: "pharaoh-54a0e.firebaseapp.com",
  messagingSenderId: "909637352706",
};

const app = initializeApp(firebaseConfig);
const { connectorConfig } = require('./src/dataconnect-generated/index.cjs.js');
const dc = getDataConnect(connectorConfig);

async function run() {
  console.log("Checking if billability rules exist...");
  try {
    // We can run a dynamic query using queryRef since they are registered or we can just fetch all rules
    const rulesRef = queryRef(dc, 'ListBillabilityRules');
    const { data: rulesData } = await executeQuery(rulesRef);
    console.log("Rules:", rulesData);
  } catch (error) {
    console.log("Failed to query via SDK (probably query is not defined). Attempting generic check:", error.message);
  }
}

run();
