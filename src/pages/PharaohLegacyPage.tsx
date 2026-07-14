import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { initLegacyModule } from "@/lib/pharaoh/legacyPharaoh";
import { LegacyViewWrapper } from "@/components/pharaoh/LegacyViewWrapper";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

export default function PharaohLegacyPage() {
  const [loading, setLoading] = useState(true);
  const [legacy, setLegacy] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("kpix");

  useEffect(() => {
    async function loadData() {
      const { data, error } = await supabase
        .from('pharaoh_data')
        .select('*');
        
      if (error) {
        console.error("Error fetching pharaoh_data:", error);
        setLoading(false);
        return;
      }

      const metricsPayload = data.find(r => r.id === 'metrics')?.payload || {};
      const usPayload = data.find(r => r.id === 'us')?.payload || {};
      const ukPayload = data.find(r => r.id === 'uk')?.payload || {};

      const D = {
        ...metricsPayload,
        us: usPayload,
        uk: ukPayload
      };

      const legacyApi = initLegacyModule(D);
      
      // Provide dummy implementations for legacy global navigation calls to prevent errors
      legacyApi.buildSidebar = () => {};
      window.mkt = 'grp';
      
      setLegacy(legacyApi);
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <Loader2 className="animate-spin w-8 h-8 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
      <div className="p-6 border-b flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight mb-1">Legacy Pharaoh Views</h1>
          <p className="text-sm text-muted-foreground">Read-only historical views migrated from the old system.</p>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="kpix">KPIs</TabsTrigger>
            <TabsTrigger value="flags">Data Quality</TabsTrigger>
            <TabsTrigger value="weekly">Weekly Update</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <div className="flex-1 overflow-auto bg-[#f9f7f4]">
        {activeTab === "kpix" && <LegacyViewWrapper legacy={legacy} viewFn="renderKpix" />}
        {activeTab === "flags" && <LegacyViewWrapper legacy={legacy} viewFn="renderFlags" />}
        {activeTab === "weekly" && <LegacyViewWrapper legacy={legacy} viewFn="renderWeekly" />}
      </div>
    </div>
  );
}
