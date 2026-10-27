import { google } from "googleapis";
import fs from "fs";

async function run() {
  const serviceAccountKeyPath = "functions/service-account.json"; // wait, no service account json here. I can use the existing auth logic in functions? No, let's just query the db!
}
