import { getTimeEntriesByDateRange } from "@/dataconnect-generated";

export async function getProjectCostsMonthly(startDate: string, endDate: string) {
  const { data } = await getTimeEntriesByDateRange({ startDate, endDate });
  const entries = data.timeEntriess || [];
  
  const results: any = {};
  for (const entry of entries) {
    const month = entry.date.substring(0, 7) + '-01';
    const key = `${entry.project_id}_${month}`;
    
    if (!results[key]) {
      results[key] = {
        project_id: entry.project_id,
        month_date: month,
        total_hours: 0,
        cost_gbp_staff: 0,
        cost_usd_staff: 0
      };
    }
    
    const hours = entry.hours || 0;
    const hourlyRateGbp = 50; 
    
    results[key].total_hours += hours;
    results[key].cost_gbp_staff += (hours * hourlyRateGbp);
    results[key].cost_usd_staff += (hours * hourlyRateGbp * 1.25);
  }
  
  return Object.values(results);
}

export async function getUtilisationSummary(startDate: string, endDate: string) {
  const { data } = await getTimeEntriesByDateRange({ startDate, endDate });
  const entries = data.timeEntriess || [];
  
  const results: any = {};
  for (const entry of entries) {
    const key = `${entry.person_id}_${entry.project_id}`;
    if (!results[key]) {
      results[key] = {
        person_id: entry.person_id,
        project_id: entry.project_id,
        total_hours: 0,
        leave_hours: 0
      };
    }
    results[key].total_hours += entry.hours || 0;
  }
  
  return Object.values(results);
}

export async function getUtilisationSummaryMonthly(startDate: string, endDate: string) {
  const { data } = await getTimeEntriesByDateRange({ startDate, endDate });
  const entries = data.timeEntriess || [];
  
  const results: any = {};
  for (const entry of entries) {
    const month = entry.date.substring(0, 7) + '-01';
    const key = `${entry.person_id}_${month}_${entry.project_id}`;
    if (!results[key]) {
      results[key] = {
        person_id: entry.person_id,
        project_id: entry.project_id,
        month_date: month,
        total_hours: 0,
        leave_hours: 0
      };
    }
    results[key].total_hours += entry.hours || 0;
  }
  return Object.values(results);
}

export async function getProjectCosts() {
  const { data } = await getCachedAllTimeEntries();
  const entries = data.timeEntriess || [];
  
  const results: any = {};
  for (const entry of entries) {
    const key = entry.project_id || 'unassigned';
    if (!results[key]) {
      results[key] = {
        project_id: entry.project_id,
        total_hours: 0,
        cost_gbp_staff: 0,
        cost_usd_staff: 0
      };
    }
    const hours = entry.hours || 0;
    const hourlyRateGbp = 50; 
    results[key].total_hours += hours;
    results[key].cost_gbp_staff += (hours * hourlyRateGbp);
    results[key].cost_usd_staff += (hours * hourlyRateGbp * 1.25);
  }
  return Object.values(results);
}

export async function getProjectHoursByRole() {
  const [entriesRes, peopleRes] = await Promise.all([
    getCachedAllTimeEntries(),
    getCachedPeople()
  ]);
  const entries = entriesRes.data.timeEntriess || [];
  const people = peopleRes.data.peoples || [];
  const personToRole = new Map(people.map((p: any) => [p.id, p.roleId]));
  
  const results: any = {};
  for (const entry of entries) {
    const roleId = personToRole.get(entry.person_id) || null;
    const key = `${entry.project_id}_${roleId}`;
    if (!results[key]) {
      results[key] = {
        project_id: entry.project_id,
        role_id: roleId,
        total_hours: 0
      };
    }
    results[key].total_hours += entry.hours || 0;
  }
  return Object.values(results);
}

export async function getProjectCostsByRole() {
  const [entriesRes, peopleRes] = await Promise.all([
    getCachedAllTimeEntries(),
    getCachedPeople()
  ]);
  const entries = entriesRes.data.timeEntriess || [];
  const people = peopleRes.data.peoples || [];
  const personToRole = new Map(people.map((p: any) => [p.id, p.roleId]));
  const personToCost = new Map(people.map((p: any) => [p.id, p.costPerHour || 50]));
  
  const results: any = {};
  for (const entry of entries) {
    const roleId = personToRole.get(entry.person_id) || null;
    const costGbp = personToCost.get(entry.person_id) || 50;
    const key = `${entry.project_id}_${roleId}`;
    if (!results[key]) {
      results[key] = {
        project_id: entry.project_id,
        role_id: roleId,
        cost_gbp_staff: 0,
        cost_usd_staff: 0
      };
    }
    const hours = entry.hours || 0;
    results[key].cost_gbp_staff += (hours * costGbp);
    results[key].cost_usd_staff += (hours * costGbp * 1.25);
  }
  return Object.values(results);
}

export async function getProjectPersonHours() {
  const { data } = await getCachedAllTimeEntries();
  const entries = data.timeEntriess || [];
  
  const results: any = {};
  for (const entry of entries) {
    const key = `${entry.project_id}_${entry.person_id}`;
    if (!results[key]) {
      results[key] = {
        project_id: entry.project_id,
        person_id: entry.person_id,
        total_hours: 0
      };
    }
    results[key].total_hours += entry.hours || 0;
  }
  return Object.values(results);
}

export async function getProjectHours() {
  return getProjectCosts(); 
}

let _cachedTimeEntriesPromise: Promise<any> | null = null;
let _cachedTimeEntriesTime = 0;

export async function getCachedAllTimeEntries() {
  const now = Date.now();
  // Cache for 10 seconds to cover all concurrent requests during page load
  if (_cachedTimeEntriesPromise && now - _cachedTimeEntriesTime < 10000) {
    return _cachedTimeEntriesPromise;
  }
  const { getAllTimeEntries } = await import("@/dataconnect-generated");
  _cachedTimeEntriesTime = now;
  _cachedTimeEntriesPromise = getAllTimeEntries().catch(e => {
    _cachedTimeEntriesPromise = null;
    throw e;
  });
  return _cachedTimeEntriesPromise;
}

let _cachedPeoplePromise: Promise<any> | null = null;
let _cachedPeopleTime = 0;

export async function getCachedPeople() {
  const now = Date.now();
  if (_cachedPeoplePromise && now - _cachedPeopleTime < 10000) {
    return _cachedPeoplePromise;
  }
  const { listPeople } = await import("@/dataconnect-generated");
  _cachedPeopleTime = now;
  _cachedPeoplePromise = listPeople().catch(e => {
    _cachedPeoplePromise = null;
    throw e;
  });
  return _cachedPeoplePromise;
}

export async function getPersonHoursInRange({ startDate, endDate }: { startDate: string; endDate: string }) {
  const { data } = await getTimeEntriesByDateRange({ startDate, endDate });
  const entries = data.timeEntriess || [];
  
  const results: any = {};
  for (const entry of entries) {
    const key = entry.person_id || 'unassigned';
    if (!results[key]) {
      results[key] = {
        person_id: entry.person_id,
        total_hours: 0
      };
    }
    results[key].total_hours += entry.hours || 0;
  }
  return Object.values(results);
}
