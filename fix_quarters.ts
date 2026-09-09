import fs from 'fs';

const path = 'functions/src/syncCentralData.ts';
let content = fs.readFileSync(path, 'utf8');

const map = {
  '20/21 Q1': 'GI',
  '20/21 Q2': 'GJ',
  '20/21 Q3': 'GK',
  '20/21 Q4': 'GL',
  '21/22 Q1': 'GC',
  '21/22 Q2': 'GD',
  '21/22 Q3': 'GE',
  '21/22 Q4': 'GF',
  '22/23 Q1': 'EY',
  '22/23 Q2': 'EZ',
  '22/23 Q3': 'FA',
  '22/23 Q4': 'FB',
  '23/24 Q1': 'GO',
  '23/24 Q2': 'GP',
  '23/24 Q3': 'GQ',
  '23/24 Q4': 'GR',
  '24/25 Q1': 'HW',
  '24/25 Q2': 'HX',
  '24/25 Q3': 'HY',
  '24/25 Q4': 'HZ',
  '25/26 Q1': 'IT',
  '25/26 Q2': 'IU',
  '25/26 Q3': 'IV',
  '25/26 Q4': 'IW',
  '26/27 Q1': 'IX',
  '26/27 Q2': 'IY',
  '26/27 Q3': 'IZ',
  '26/27 Q4': 'JA'
};

function letterToCol(letter: string) {
  let col = 0;
  for (let i = 0; i < letter.length; i++) {
    col = col * 26 + (letter.charCodeAt(i) - 64);
  }
  return col - 1; // 0-indexed relative to A
}

let newContent = content;

for (const [key, letter] of Object.entries(map)) {
  const parts = key.split(' ');
  let fy, q;
  if (parts[0].includes('/')) {
    fy = parts[0];
    q = parts[1];
  } else {
    q = parts[0];
    fy = parts[1];
  }
  
  const fyParts = fy.split('/');
  const yr1 = fyParts[0];
  const yr2 = fyParts[1];
  
  const dbKey = `gp_${q.toLowerCase()}_${yr1}_${yr2}`;
  
  // Previously we used letterToCol(letter) directly, without subtracting 1
  const originalIndex = letterToCol(letter); 
  const badIndex = originalIndex - 1; 
  
  const regex = new RegExp(`${dbKey}:\\s*parseNumber\\(row\\[${badIndex}\\]\\)`);
  if (regex.test(newContent)) {
    newContent = newContent.replace(regex, `${dbKey}: parseNumber(row[${originalIndex}])`);
  } else {
    console.log("NOT FOUND:", dbKey);
  }
}

fs.writeFileSync(path, newContent);
console.log("Reverted quarters indices!");
