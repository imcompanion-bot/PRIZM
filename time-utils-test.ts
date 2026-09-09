function getMostRecentlyCompletedQuarter(date: Date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth(); 

  let completedQ = "";
  let fyYear1 = 0;
  let fyYear2 = 0;

  if (month >= 7 && month <= 9) { 
    completedQ = "Q1";
    fyYear1 = year;
    fyYear2 = year + 1;
  } else if (month >= 10 || month === 0) { 
    completedQ = "Q2";
    fyYear1 = month === 0 ? year - 1 : year;
    fyYear2 = fyYear1 + 1;
  } else if (month >= 1 && month <= 3) { 
    completedQ = "Q3";
    fyYear1 = year - 1;
    fyYear2 = year;
  } else if (month >= 4 && month <= 6) { 
    completedQ = "Q4";
    fyYear1 = year - 1;
    fyYear2 = year;
  }

  const yr1Str = fyYear1.toString().slice(-2);
  const yr2Str = fyYear2.toString().slice(-2);

  return `${completedQ} ${yr1Str}/${yr2Str}`;
}

function getMostRecentlyCompletedYear(date: Date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth(); 

  let fyYear1 = 0;
  let fyYear2 = 0;

  if (month >= 4) {
    fyYear1 = year - 1;
    fyYear2 = year;
  } else {
    fyYear1 = year - 2;
    fyYear2 = year - 1;
  }
  
  const yr1Str = fyYear1.toString().slice(-2);
  const yr2Str = fyYear2.toString().slice(-2);

  return `${yr1Str}/${yr2Str}`;
}

console.log("Quarter:", getMostRecentlyCompletedQuarter(new Date(2026, 8, 9)));
console.log("Year:", getMostRecentlyCompletedYear(new Date(2026, 8, 9)));
