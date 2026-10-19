import fetch from 'node-fetch';

async function run() {
  const resp = await fetch(`https://api.frankfurter.dev/v1/2024-05-01..2025-04-30?base=GBP&symbols=USD`);
  const data = await resp.json();
  let sum = 0;
  let count = 0;
  for (const [date, currencies] of Object.entries(data.rates || {})) {
    const usd = currencies.USD;
    if (usd) {
      sum += usd;
      count++;
    }
  }
  console.log("Average FY24/25:", sum / count);
}
run();
