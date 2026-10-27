import fs from 'fs';

let code = fs.readFileSync('functions/src/syncCentralData.ts', 'utf8');

const targetStart = `  // 2. PEOPLE
  logger.info("Syncing People...");
  await updateProgress(30);
  const peopleResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "People Counter Global!A3:O", 
  });
  const peopleRows = peopleResponse.data.values || [];
  let upsertedPeople = 0;

  const sheetPersonIds = new Set<string>();
  const nameToCurrentId = new Map<string, string>();
  const peopleBatchMap = new Map<string, any>();

  for (const row of peopleRows) {
    const name = row[0];
    if (!name) continue;
    const code = row[1];
    const roleName = row[2];
    const type = row[3];
    const team = row[4];
    const status = row[5];
    const ukPct = parseNumber(row[6]);
    const usPct = parseNumber(row[7]);
    const imcPct = parseNumber(row[8]);
    const startDate = parseDate(row[9]);
    const endDate = parseDate(row[10]);
    const overallStart = parseDate(row[11]);
    const overallEnd = parseDate(row[12]);
    const monthlySalary = parseNumber(row[13]);
    const office = row[14];`;

const replacement = `  // 2. PEOPLE
  logger.info("Syncing People...");
  await updateProgress(30);
  const peopleResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "People Counter Global!A2:ZZ", 
  });
  const peopleRowsAll = peopleResponse.data.values || [];
  let upsertedPeople = 0;

  const sheetPersonIds = new Set<string>();
  const nameToCurrentId = new Map<string, string>();
  const peopleBatchMap = new Map<string, any>();
  
  let colMap = {
    name: 0, code: 1, roleName: 2, type: 3, team: 4, status: 5,
    ukPct: 6, usPct: 7, imcPct: 8, startDate: 9, endDate: 10,
    overallStart: 11, overallEnd: 12, monthlySalary: 13, office: 14
  };

  let startIndex = 0;
  if (peopleRowsAll.length > 0) {
    // If the first row looks like headers
    const firstRowStr = String(peopleRowsAll[0][0] || "").toLowerCase();
    if (firstRowStr.includes("name") || firstRowStr.includes("employee")) {
      startIndex = 1; // data starts on next row
      const headers = peopleRowsAll[0].map((h) => String(h || "").toLowerCase().trim());
      
      const findCol = (searchTerms) => {
        const idx = headers.findIndex(h => searchTerms.some(term => h === term || h.includes(term)));
        return idx;
      };

      const cName = findCol(["name", "employee name"]);
      const cCode = findCol(["code", "employee code"]);
      const cRole = findCol(["role", "job title"]);
      const cType = findCol(["type", "employment type"]);
      const cTeam = findCol(["team", "department"]);
      const cStatus = findCol(["status"]);
      const cUk = findCol(["uk %", "uk %", "uk"]);
      const cUs = findCol(["us %", "us %", "us"]);
      const cImc = findCol(["imc %", "imc %", "imc"]);
      const cStart = findCol(["start date", "employment start"]);
      const cEnd = findCol(["end date", "employment end"]);
      const cOStart = findCol(["overall start date", "overall start"]);
      const cOEnd = findCol(["overall end date", "overall end"]);
      const cSal = findCol(["monthly salary", "salary"]);
      const cOff = findCol(["office", "location"]);

      if (cName !== -1) colMap.name = cName;
      if (cCode !== -1) colMap.code = cCode;
      if (cRole !== -1) colMap.roleName = cRole;
      if (cType !== -1) colMap.type = cType;
      if (cTeam !== -1) colMap.team = cTeam;
      if (cStatus !== -1) colMap.status = cStatus;
      if (cUk !== -1) colMap.ukPct = cUk;
      if (cUs !== -1) colMap.usPct = cUs;
      if (cImc !== -1) colMap.imcPct = cImc;
      if (cStart !== -1) colMap.startDate = cStart;
      if (cEnd !== -1) colMap.endDate = cEnd;
      if (cOStart !== -1) colMap.overallStart = cOStart;
      if (cOEnd !== -1) colMap.overallEnd = cOEnd;
      if (cSal !== -1) colMap.monthlySalary = cSal;
      if (cOff !== -1) colMap.office = cOff;
    }
  }

  for (let i = startIndex; i < peopleRowsAll.length; i++) {
    const row = peopleRowsAll[i];
    const name = row[colMap.name];
    if (!name) continue;
    const code = row[colMap.code];
    const roleName = row[colMap.roleName];
    const type = row[colMap.type];
    const team = row[colMap.team];
    const status = row[colMap.status];
    const ukPct = parseNumber(row[colMap.ukPct]);
    const usPct = parseNumber(row[colMap.usPct]);
    const imcPct = parseNumber(row[colMap.imcPct]);
    const startDate = parseDate(row[colMap.startDate]);
    const endDate = parseDate(row[colMap.endDate]);
    const overallStart = parseDate(row[colMap.overallStart]);
    const overallEnd = parseDate(row[colMap.overallEnd]);
    const monthlySalary = parseNumber(row[colMap.monthlySalary]);
    const office = row[colMap.office];`;

if (code.includes(targetStart)) {
  code = code.replace(targetStart, replacement);
  fs.writeFileSync('functions/src/syncCentralData.ts', code);
  console.log("Successfully patched syncCentralData.ts");
} else {
  console.log("Could not find targetStart in syncCentralData.ts");
}
