import { 
  listRoles, listProjects, listPeople, getAllTimeEntries, 
  listProjectPhases, listAllocations, listDataImports, listRateCards,
  listProjectScopes
} from "@/dataconnect-generated";
import * as aggregations from "../../lib/aggregations";

class SupabaseQueryBuilder {
  table: string;
  filters: any = {};
  orders: any[] = [];
  isSingle = false;
  rangeParams?: { from: number; to: number };
  
  constructor(table: string) {
    this.table = table;
  }

  range(from: number, to: number) {
    this.rangeParams = { from, to };
    return this;
  }

  limit(count: number) {
    this.rangeParams = { from: 0, to: count - 1 };
    return this;
  }

  select(cols?: string) { return this; }
  
  eq(col: string, val: any) { 
    this.filters[col] = val; 
    return this; 
  }
  
  in(col: string, vals: any[]) {
    this.filters[col] = { in: vals };
    return this;
  }

  not(col: string, op: string, val: any) {
    this.filters[col] = { not: { op, val } };
    return this;
  }

  order(col: string, opts?: { ascending?: boolean }) {
    this.orders.push({ col, asc: opts?.ascending !== false });
    return this;
  }
  
  single() {
    this.isSingle = true;
    return this;
  }
  
  maybeSingle() {
    this.isSingle = true;
    return this;
  }

  async upsert(data: any, opts?: any) {
    return { data: null, error: null };
  }
  
  async insert(data: any) {
    return { data: null, error: null };
  }
  
  delete() {
    return {
      in: async (col: string, vals: any[]) => {
        return { data: null, error: null };
      },
      eq: async (col: string, val: any) => {
        return { data: null, error: null };
      },
      neq: async (col: string, val: any) => {
        return { data: null, error: null };
      }
    };
  }

  async then(resolve: any, reject: any) {
    try {
      let data: any[] = [];
      
      if (this.table === 'roles') {
        const res = await listRoles();
        data = res.data.roless;
      } else if (this.table === 'projects') {
        const res = await listProjects();
        const projects = res.data.projectss || [];
        
        // Fetch relations for projects to match Supabase's project_scopes(id, scoped_hours, role_id), rate_cards(name, hourly_rate, currency)
        const [scopesRes, rateCardsRes] = await Promise.all([
          listProjectScopes(),
          listRateCards()
        ]);
        
        const allScopes = scopesRes.data.projectScopess || [];
        const allRateCards = rateCardsRes.data.rateCardss || [];
        
        data = projects.map((p: any) => {
          const scopes = allScopes.filter((s: any) => s.project_id === p.id);
          const rc = allRateCards.find((r: any) => r.id === p.rate_card_id);
          return {
            ...p,
            status: p.isActive !== false ? "Active" : "Completed",
            project_scopes: scopes,
            rate_cards: rc || null
          };
        });
      } else if (this.table === 'people') {
        const res = await listPeople();
        const people = res.data.peoples || [];
        
        const rolesRes = await listRoles();
        const allRoles = rolesRes.data.roless || [];
        
        data = people.map((p: any) => {
          const role = allRoles.find((r: any) => r.id === p.role_id);
          return {
            ...p,
            roles: role || null
          };
        });
      } else if (this.table === 'rate_cards') {
        const res = await listRateCards();
        data = res.data.rateCardss;
      } else if (this.table === 'time_entries') {
        const [timeRes, peopleRes] = await Promise.all([
          aggregations.getCachedAllTimeEntries(),
          aggregations.getCachedPeople()
        ]);
        const allPeople = peopleRes.data.peoples || [];
        const peopleMap = new Map(allPeople.map(p => [p.id, p]));
        
        data = (timeRes.data.timeEntriess || []).map(te => ({
          ...te,
          people: { role_id: peopleMap.get(te.person_id)?.roleId || null }
        }));
      } else if (this.table === 'project_phases') {
        const res = await listProjectPhases();
        data = res.data.projectPhasess;
      } else if (this.table === 'allocations') {
        const res = await listAllocations();
        data = res.data.allocationss;
      } else if (this.table === 'data_imports') {
        const res = await listDataImports();
        data = res.data.dataImportss;
      } else {
        data = [];
      }

      data = data || [];

      for (const [col, val] of Object.entries(this.filters)) {
        if (val && typeof val === 'object' && 'in' in (val as any)) {
          data = data.filter(d => (val as any).in.includes(d[col]));
        } else if (val && typeof val === 'object' && 'not' in (val as any)) {
          const { op, val: targetVal } = (val as any).not;
          if (op === 'is') {
            data = data.filter(d => d[col] !== targetVal);
          } else {
            // fallback, just exclude matching
            data = data.filter(d => d[col] !== targetVal);
          }
        } else {
          data = data.filter(d => d[col] === val);
        }
      }

      for (const order of this.orders) {
        data.sort((a, b) => {
          if (a[order.col] < b[order.col]) return order.asc ? -1 : 1;
          if (a[order.col] > b[order.col]) return order.asc ? 1 : -1;
          return 0;
        });
      }

      if (this.isSingle) {
        resolve({ data: data[0] || null, error: null });
      } else {
        if (this.rangeParams) {
          data = data.slice(this.rangeParams.from, this.rangeParams.to + 1);
        }
        resolve({ data, error: null });
      }
    } catch (error) {
      console.error(`Error in SupabaseQueryBuilder for table ${this.table}:`, error);
      resolve({ data: null, error });
    }
  }
}

class SupabaseRpcBuilder {
  func: string;
  args: any;
  rangeParams?: { from: number; to: number };
  
  constructor(func: string, args: any) {
    this.func = func;
    this.args = args;
  }
  
  range(from: number, to: number) {
    this.rangeParams = { from, to };
    return this;
  }
  
  async then(resolve: any, reject: any) {
    try {
      let data: any = [];
      if (this.func === 'get_project_costs_monthly') {
        data = await aggregations.getProjectCostsMonthly(this.args?._start_date, this.args?._end_date);
      } else if (this.func === 'get_utilisation_summary') {
        data = await aggregations.getUtilisationSummary(this.args?._start_date, this.args?._end_date);
      } else if (this.func === 'get_utilisation_summary_monthly') {
        data = await aggregations.getUtilisationSummaryMonthly(this.args?._start_date, this.args?._end_date);
      } else if (this.func === 'get_project_costs') {
        data = await aggregations.getProjectCosts();
      } else if (this.func === 'get_project_hours_by_role') {
        data = await aggregations.getProjectHoursByRole();
      } else if (this.func === 'get_project_costs_by_role') {
        data = await aggregations.getProjectCostsByRole();
      } else if (this.func === 'get_project_person_hours') {
        data = await aggregations.getProjectPersonHours();
      } else if (this.func === 'get_project_hours') {
        data = await aggregations.getProjectHours();
      } else if (this.func === 'get_person_hours_in_range') {
        data = await aggregations.getPersonHoursInRange({ startDate: this.args?._start_date, endDate: this.args?._end_date });
      } else if (this.func === 'relink_time_entries_from_fallbacks') {
        resolve({ data: {}, error: null });
        return;
      }
      
      if (this.rangeParams && Array.isArray(data)) {
        data = data.slice(this.rangeParams.from, this.rangeParams.to + 1);
      }
      resolve({ data, error: null });
    } catch (e) {
      console.error(`Error in SupabaseRpcBuilder for func ${this.func}:`, e);
      resolve({ data: null, error: e });
    }
  }
}

export const supabase = {
  from: (table: string) => new SupabaseQueryBuilder(table),
  rpc: (func: string, args?: any) => new SupabaseRpcBuilder(func, args)
};
