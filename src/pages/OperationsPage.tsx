import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Briefcase, LineChart, Receipt, FileText } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import ProjectsPage from "./ProjectsPage";
import KpiExplorerPage from "./KpiExplorerPage";
import BillableWorkPage from "./BillableWorkPage";
import WeeklyUpdatePage from "./WeeklyUpdatePage";

export default function OperationsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "projects";

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden animate-fade-in">
      {/* Page Header */}
      <div className="p-6 border-b flex items-center justify-between bg-white shadow-sm ring-1 ring-black/5 z-10">
        <div>
          <h1 className="text-2xl font-semibold text-[#4b70d8] font-display uppercase tracking-tight mb-1">
            Operations Hub
          </h1>
          <p className="text-sm text-muted-foreground">
            All-in-one operations control room for tracking project portfolios, key performance indicators, billability rules, and commentary logs.
          </p>
        </div>
      </div>

      {/* Main Tabbed Area */}
      <div className="flex-1 overflow-auto bg-[#faf8f5] p-6">
        <div className="max-w-[1600px] mx-auto bg-white rounded-xl shadow-sm border border-stone-200/80 overflow-hidden h-full flex flex-col">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full flex-1 flex flex-col">
            <div className="border-b bg-stone-50/50 px-6 py-2.5">
              <TabsList className="bg-stone-200/60 p-0.5 border border-stone-200/40">
                <TabsTrigger value="projects" className="gap-2 text-xs py-1.5 font-display uppercase tracking-wide">
                  <Briefcase className="h-3.5 w-3.5" />
                  All Projects
                </TabsTrigger>
                <TabsTrigger value="kpi" className="gap-2 text-xs py-1.5 font-display uppercase tracking-wide">
                  <LineChart className="h-3.5 w-3.5" />
                  KPI Explorer
                </TabsTrigger>
                <TabsTrigger value="billable" className="gap-2 text-xs py-1.5 font-display uppercase tracking-wide">
                  <Receipt className="h-3.5 w-3.5" />
                  Billable Work
                </TabsTrigger>
                <TabsTrigger value="weekly" className="gap-2 text-xs py-1.5 font-display uppercase tracking-wide">
                  <FileText className="h-3.5 w-3.5" />
                  Weekly Update
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-auto p-6 min-h-0">
              <TabsContent value="projects" className="mt-0 h-full flex flex-col focus-visible:ring-0 focus-visible:ring-offset-0">
                <ProjectsPage isEmbedded={true} />
              </TabsContent>

              <TabsContent value="kpi" className="mt-0 h-full flex flex-col focus-visible:ring-0 focus-visible:ring-offset-0">
                <KpiExplorerPage isEmbedded={true} />
              </TabsContent>

              <TabsContent value="billable" className="mt-0 h-full flex flex-col focus-visible:ring-0 focus-visible:ring-offset-0">
                <BillableWorkPage isEmbedded={true} />
              </TabsContent>

              <TabsContent value="weekly" className="mt-0 h-full flex flex-col focus-visible:ring-0 focus-visible:ring-offset-0">
                <WeeklyUpdatePage isEmbedded={true} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
