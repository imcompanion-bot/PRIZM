import dotenv from 'dotenv';
dotenv.config();

async function run() {
   const res = await fetch("https://synccentraldatahttp-c3vwaisz6a-uk.a.run.app", {
       method: "POST"
   });
   console.log(res.status, await res.text());
}
run();
