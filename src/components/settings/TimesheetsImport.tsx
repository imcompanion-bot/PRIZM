import { useState, useCallback } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, AlertTriangle, Clock, FileSpreadsheet, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format, parse, formatDistanceToNow, isValid } from "date-fns";
import Papa from "papaparse";

const tryParseDate = (val: string): string | null => {
  if (!val?.trim()) return null;
  const formats = ["dd/MM/yyyy", "MM/dd/yyyy", "yyyy-MM-dd", "dd-MM-yyyy", "dd MMM yyyy", "MMM dd, yyyy"];
  for (const fmt of formats) {
    try {
      const parsed = parse(val.trim(), fmt, new Date());
      if (isValid(parsed)) return format(parsed, "yyyy-MM-dd");
    } catch {}
  }
  const native = new Date(val.trim());
  if (isValid(native)) return format(native, "yyyy-MM-dd");
  return null;
};

const recordImport = async (dataset: string, rowCount: number, queryClient: any) => {
  await supabase.from("data_imports" as any).upsert(
    { dataset, last_imported_at: new Date().toISOString(), row_count: rowCount } as any,
    { onConflict: "dataset" } as any
  );
  queryClient.invalidateQueries({ queryKey: ["data_imports"] });
};

const cleanStr = (value: string) => (value || "").replace(/^["']+|["']+$/g, "").trim();

export const TimesheetsImport = ({ lastImported }: { lastImported?: any }) => {
  const queryClient = useQueryClient();
  const [isDragging, setIsDragging] = useState(false);
  const [parsing, setParsing] = useState(false);

  // Fetch current database timeframe
  const { data: timeframe, isLoading: isLoadingTimeframe } = useQuery({
    queryKey: ["timesheets_timeframe"],
    queryFn: async () => {
      const { getOldestTimeEntry, getNewestTimeEntry } = await import("@/dataconnect-generated");
      const [minRes, maxRes] = await Promise.all([
        getOldestTimeEntry(),
        getNewestTimeEntry()
      ]);
      
      const minDate = minRes.data.timeEntriess?.[0]?.date;
      const maxDate = maxRes.data.timeEntriess?.[0]?.date;
      
      return { minDate, maxDate };
    }
  });

  const [importProgress, setImportProgress] = useState<{ current: number, total: number } | null>(null);

  const importEntries = useMutation({
    mutationFn: async ({ entries, fromDate }: { entries: any[]; fromDate: string | null }) => {
      // Data connect requires importing the actual generated mutations
      const { 
        deleteTimeEntriesByDate,
        deleteAllTimeEntries,
        insertTimeEntries 
      } = await import("@/dataconnect-generated");

      if (fromDate) {
        await deleteTimeEntriesByDate({ fromDate });
      } else {
        await deleteAllTimeEntries();
      }

      // To prevent RESOURCE_EXHAUSTED connection pool limits on Data Connect,
      // we batch requests at a very low concurrency (e.g. 15 parallel requests max)
      const CONCURRENCY_LIMIT = 15;
      
      for (let i = 0; i < entries.length; i += CONCURRENCY_LIMIT) {
        const batch = entries.slice(i, i + CONCURRENCY_LIMIT);
        
        await Promise.all(batch.map(async (entry) => {
           return insertTimeEntries({
             createdAt: format(new Date(), 'yyyy-MM-dd'),
             date: entry.date,
             hours: entry.hours,
             id: crypto.randomUUID(),
             notes: entry.notes,
             personId: entry.person_id,
             personName: entry.fallback_person_name,
             projectCode: entry.fallback_opportunity_number,
             projectId: entry.project_id,
             projectName: entry.fallback_project_name
           });
        }));
        
        setImportProgress({ current: Math.min(i + CONCURRENCY_LIMIT, entries.length), total: entries.length });
      }
    },
    onSuccess: (_, { entries }) => {
      queryClient.invalidateQueries({ queryKey: ["time_entries"] });
      queryClient.invalidateQueries({ queryKey: ["time_entries_all"] });
      queryClient.invalidateQueries({ queryKey: ["project_hours"] });
      queryClient.invalidateQueries({ queryKey: ["timesheets_timeframe"] });
      
      // Invalidate profitability and utilisation aggregations
      queryClient.invalidateQueries({ queryKey: ["profitability_project_costs"] });
      queryClient.invalidateQueries({ queryKey: ["profitability_monthly_costs"] });
      queryClient.invalidateQueries({ queryKey: ["profitability_hours_by_role"] });
      queryClient.invalidateQueries({ queryKey: ["profitability_costs_by_role"] });
      queryClient.invalidateQueries({ queryKey: ["profitability_project_person_hours"] });
      queryClient.invalidateQueries({ queryKey: ["profitability_project_person_project_hours"] });
      queryClient.invalidateQueries({ queryKey: ["utilisation_summary"] });
      queryClient.invalidateQueries({ queryKey: ["utilisation_summary_monthly"] });
      
      recordImport("timesheets", entries.length, queryClient);
      toast.success(`Successfully imported ${entries.length} timesheets`);
      setImportProgress(null);
    },
    onError: (e: Error) => {
      toast.error(e.message);
      setImportProgress(null);
    },
  });

  const processCsvData = async (lines: string[][]) => {
    if (lines.length < 2) { toast.error("No valid data found in CSV"); return; }
    
    const headers = lines[0].map((h) => (h || "").trim().toLowerCase());
    const findCol = (...keys: string[]) => {
      for (const k of keys) {
        const idx = headers.findIndex((h) => h.includes(k));
        if (idx !== -1) return idx;
      }
      return -1;
    };

    const col = {
      date: findCol("date"),
      hours: findCol("hours"),
      notes: findCol("notes"),
      project_name: findCol("project_name", "project name", "project"),
      project_code: findCol("project_code", "project code", "code"),
      person_name: findCol("person_name", "person name", "name"),
      office: findCol("office"),
      role: findCol("role"),
      project_title: findCol("project_title", "project title"),
      opportunity_number: findCol("opportunity_number", "opportunity number", "opp")
    };

    if (col.date === -1 || col.hours === -1 || col.person_name === -1) {
      toast.error("Missing required columns: date, hours, person_name");
      return;
    }

    const { data: allProjects } = await supabase.from("projects").select("id, opportunity_number, title");
    const { data: allPeople } = await supabase.from("people").select("id, name, code, role_id, employment_start_date");

    const projectMapByCode = new Map((allProjects || []).filter(p => p.opportunity_number).map(p => [p.opportunity_number!.toLowerCase().trim(), p.id]));
    const projectMapByName = new Map((allProjects || []).filter(p => p.title).map(p => [p.title.toLowerCase().trim(), p.id]));

    const stripDiacritics = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    const peopleByName = new Map<string, any[]>();
    for (const p of allPeople || []) {
      const name = stripDiacritics(p.name.toLowerCase().trim());
      if (!peopleByName.has(name)) peopleByName.set(name, []);
      peopleByName.get(name)?.push(p);
    }

    const getPersonIds = (first: string, last: string, entryDate: string): string[] => {
      const targetName = stripDiacritics(`${first} ${last}`.toLowerCase().trim());
      const targetDate = entryDate ? new Date(entryDate).getTime() : 0;

      const matches = peopleByName.get(targetName) || [];
      if (matches.length === 0) return [];
      if (matches.length === 1) return [matches[0].id];

      const validMatches = matches.filter(p => {
        if (!p.employment_start_date) return true;
        return new Date(p.employment_start_date).getTime() <= targetDate;
      });

      if (validMatches.length === 0) return [matches[0].id];
      validMatches.sort((a, b) => {
        const da = a.employment_start_date ? new Date(a.employment_start_date).getTime() : 0;
        const db = b.employment_start_date ? new Date(b.employment_start_date).getTime() : 0;
        return db - da; 
      });

      return [validMatches[0].id];
    };

    const entries = [];
    const errors = [];
    let earliestDate: string | null = null;

    for (let i = 1; i < lines.length; i++) {
      const cells = lines[i];
      if (!cells || cells.length < 2) continue;

      const dVal = cells[col.date];
      if (!dVal) continue;
      
      const parsedDate = tryParseDate(dVal);
      if (!parsedDate) { errors.push(`Row ${i+1}: invalid date "${dVal}"`); continue; }
      
      if (!earliestDate || parsedDate < earliestDate) {
        earliestDate = parsedDate;
      }

      const hVal = parseFloat(cells[col.hours]?.replace(/[^\d.-]/g, ''));
      if (isNaN(hVal) || hVal <= 0) continue;

      const fullName = cleanStr(cells[col.person_name] || "");
      if (!fullName) { errors.push(`Row ${i+1}: missing name`); continue; }
      const fName = fullName.split(" ")[0] || "";
      const lName = fullName.split(" ").slice(1).join(" ") || "";

      const pIds = getPersonIds(fName, lName, parsedDate);
      const personId = pIds.length > 0 ? pIds[0] : null;

      let projectId = null;
      if (col.project_code !== -1) {
        const code = cleanStr(cells[col.project_code] || "");
        if (code) projectId = projectMapByCode.get(code.toLowerCase());
      }
      if (!projectId && col.opportunity_number !== -1) {
        const opp = cleanStr(cells[col.opportunity_number] || "");
        if (opp) projectId = projectMapByCode.get(opp.toLowerCase());
      }
      if (!projectId && col.project_title !== -1) {
        const pname = cleanStr(cells[col.project_title] || "");
        if (pname) projectId = projectMapByName.get(pname.toLowerCase());
      }
      if (!projectId && col.project_name !== -1) {
        const pname = cleanStr(cells[col.project_name] || "");
        if (pname) projectId = projectMapByName.get(pname.toLowerCase());
      }

      let isBillable = true;
      const notes = col.notes !== -1 ? cleanStr(cells[col.notes] || "") : null;
      if (notes && (notes.toLowerCase().includes("leave") || notes.toLowerCase().includes("holiday") || notes.toLowerCase().includes("closed"))) {
        isBillable = false;
      }

      entries.push({
        date: parsedDate,
        person_id: personId,
        project_id: projectId,
        hours: hVal,
        task: null,
        notes: notes,
        is_billable: isBillable,
        fallback_person_name: !personId ? `${fName} ${lName}` : null,
        fallback_project_name: !projectId && col.project_name !== -1 ? cleanStr(cells[col.project_name] || "") : null,
        fallback_opportunity_number: !projectId && col.opportunity_number !== -1 ? cleanStr(cells[col.opportunity_number] || "") : null,
      });
    }

    if (errors.length > 0) {
      toast.warning(`${errors.length} issues skipped (e.g. ${errors[0]})`);
    }

    if (!entries.length) { toast.error("No valid entries found in file"); return; }
    
    // Use the earliest date found in the file as the overwrite point
    toast.loading(`Replacing timesheets from ${format(new Date(earliestDate!), "dd MMM yyyy")} onwards...`, { id: 'import-toast' });
    
    importEntries.mutate(
      { entries, fromDate: earliestDate },
      {
        onSettled: () => {
          toast.dismiss('import-toast');
        }
      }
    );
  };

  const handleFileUpload = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error("Please upload a valid CSV file");
      return;
    }

    setParsing(true);
    Papa.parse<string[]>(file, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        processCsvData(results.data).finally(() => setParsing(false));
      },
      error: (error) => {
        console.error("CSV Parse Error:", error);
        toast.error(`Error reading CSV: ${error.message}`);
        setParsing(false);
      }
    });
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-display">Harvest Timesheet Import</CardTitle>
            <CardDescription>Drag and drop a Harvest CSV export to synchronize timesheets.</CardDescription>
          </div>
          {lastImported && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-2.5 py-1.5 rounded-md shrink-0">
              <Clock className="h-3 w-3" />
              <span>
                Last import: {formatDistanceToNow(new Date(lastImported.last_imported_at), { addSuffix: true })}
                {" · "}{lastImported.row_count} rows
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Timeframe Info */}
        <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4 flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-blue-900">Current Database Coverage</h3>
          {isLoadingTimeframe ? (
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <Loader2 className="h-3 w-3 animate-spin" /> Fetching timeframe...
            </div>
          ) : timeframe?.minDate && timeframe?.maxDate ? (
            <p className="text-sm text-blue-800">
              The database currently holds timesheets from <strong>{format(new Date(timeframe.minDate), "dd MMM yyyy")}</strong> to <strong>{format(new Date(timeframe.maxDate), "dd MMM yyyy")}</strong>.
              <br/><br/>
              You only need to upload Harvest data from <strong>{format(new Date(timeframe.maxDate), "dd MMM yyyy")}</strong> onwards.
            </p>
          ) : (
            <p className="text-sm text-blue-800">No timesheets currently exist in the database.</p>
          )}
        </div>

        <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-700">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>When you upload a file, the system will automatically find the earliest date in your CSV and <strong>replace all existing timesheets from that date onwards</strong> to prevent duplicates.</span>
        </div>

        {/* Drag and Drop Zone */}
        <div 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-xl p-10 transition-colors flex flex-col items-center justify-center gap-4 text-center cursor-pointer
            ${isDragging ? 'border-primary bg-primary/5' : 'border-border bg-card hover:bg-muted/50'}
            ${(parsing || importEntries.isPending) ? 'opacity-50 pointer-events-none' : ''}
          `}
          onClick={() => {
            const el = document.getElementById("csv-upload-input");
            if (el) el.click();
          }}
        >
          <input 
            type="file" 
            id="csv-upload-input" 
            accept=".csv" 
            className="hidden" 
            onChange={(e) => {
              if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
              e.target.value = ''; // Reset input
            }}
          />
          
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            {parsing || importEntries.isPending ? (
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
            ) : (
              <FileSpreadsheet className="h-6 w-6 text-primary" />
            )}
          </div>
          
          <div>
            <p className="text-sm font-medium">
              {parsing ? "Parsing CSV..." : 
               importProgress ? `Importing Timesheets (${importProgress.current} / ${importProgress.total})...` : 
               importEntries.isPending ? "Importing Timesheets..." : "Click or drag Harvest CSV here"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Supports standard Harvest detailed time reports
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
