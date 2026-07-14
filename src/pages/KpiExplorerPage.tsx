import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { initLegacyModule } from "@/lib/pharaoh/legacyPharaoh";
import { LegacyViewWrapper } from "@/components/pharaoh/LegacyViewWrapper";
import { Loader2 } from "lucide-react";

export default function KpiExplorerPage() {
  const [loading, setLoading] = useState(true);
  const [legacy, setLegacy] = useState<any>(null);

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
      (window as any).mkt = 'grp';
      
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
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden animate-fade-in">
      <div className="p-6 border-b flex items-center justify-between bg-white shadow-sm ring-1 ring-black/5 z-10">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">
            KPI Explorer
          </h1>
          <p className="text-sm text-muted-foreground">Dedicated historical KPI metrics and performance tracking explorer.</p>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto bg-[#faf8f5] p-6">
        <div className="max-w-[1600px] mx-auto bg-white rounded-lg shadow-sm border border-stone-100 p-4">
          <LegacyViewWrapper legacy={legacy} viewFn="renderKpix" />
        </div>
      </div>
    </div>
  );
}
