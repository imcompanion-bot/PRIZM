import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Trash2, UserPlus, Loader2, Database, Clock, ShieldCheck, ArchiveRestore } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { DEFAULT_ROLE_PERMISSIONS, FeaturePermissions } from "@/lib/permissions";
import { Navigate } from "react-router-dom";
import { getFunctions, httpsCallable } from "firebase/functions";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";

import { TimesheetsImport } from "@/components/settings/TimesheetsImport";
import { ClientAllocationDialog } from "@/components/settings/ClientAllocationDialog";
import { UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { initLegacyModule } from "@/lib/pharaoh/legacyPharaoh";
import { LegacyViewWrapper } from "@/components/pharaoh/LegacyViewWrapper";
import { AgentCentreTab } from "@/components/settings/AgentCentreTab";

const DataSyncTab = () => {
  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressStage, setProgressStage] = useState("");

  const { data: lastImportedAt, refetch: refetchSyncStatus } = useQuery({
    queryKey: ["sync_central_data_status"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("data_imports" as any)
        .select("last_imported_at")
        .eq("dataset", "central_sync")
        .maybeSingle();
      if (error) return null;
      return data?.last_imported_at || null;
    },
  });

  useEffect(() => {
    let intervalId: any;
    if (isSyncing) {
      setProgressPercent(1);
      setProgressStage("Connecting & initiating sheet connection...");

      const fetchProgress = async () => {
        try {
          const { data, error } = await supabase
            .from("data_imports" as any)
            .select("row_count")
            .eq("dataset", "central_sync_progress")
            .maybeSingle();

          if (!error && data) {
            const count = data.row_count || 0;
            setProgressPercent(count);

            // Map progress values to detailed descriptive messages
            if (count <= 1) {
              setProgressStage("Initiating secure connection with Google Sheets...");
            } else if (count === 10) {
              setProgressStage("Syncing Roles, Capacities & Rate Cards...");
            } else if (count === 30) {
              setProgressStage("Syncing Active Team Members (People rows)...");
            } else if (count === 50) {
              setProgressStage("Performing database cleanups & relinking timesheets...");
            } else if (count === 70) {
              setProgressStage("Syncing Client Projects (can take up to 45s)...");
            } else if (count === 90) {
              setProgressStage("Syncing and uploading Project Scopes (11,000+ items)...");
            } else if (count >= 100) {
              setProgressStage("Finalizing and updating database timestamps...");
            }
          }
        } catch (err) {
          console.error("Error polling sync progress:", err);
        }
      };

      // Poll every 2 seconds
      fetchProgress();
      intervalId = setInterval(fetchProgress, 2000);
    } else {
      setProgressPercent(0);
      setProgressStage("");
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isSyncing]);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const functions = getFunctions(undefined, 'us-east4');
      const syncCentralData = httpsCallable(functions, 'syncCentralDataCallable', { timeout: 300000 });
      
      const result = await syncCentralData();
      
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      queryClient.invalidateQueries({ queryKey: ["rate-cards"] });
      queryClient.invalidateQueries({ queryKey: ["people"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project_scopes"] });
      queryClient.invalidateQueries({ queryKey: ["project_ids_set_v2"] });
      queryClient.invalidateQueries({ queryKey: ["projects_for_billability_v3"] });
      queryClient.invalidateQueries({ queryKey: ["utilisation_summary"] });
      queryClient.invalidateQueries({ queryKey: ["utilisation_summary_monthly"] });
      
      await refetchSyncStatus();

      toast.success(`Successfully synced full database from centralized sheet!`);
    } catch (e: any) {
      toast.error(`Sync failed: ${e.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 max-w-3xl">
        <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Database className="w-5 h-5 text-primary" />
          Live Sync: Full Database
        </h2>
        <p className="text-gray-500 mb-6 text-sm">
          Clicking the button below will securely connect to the centralized master Google Sheet and instantly synchronize all Roles, Rate Cards, People, Projects, and Scopes into the application.
        </p>

        <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Data Source:</h3>
          <p className="text-sm text-gray-600">Centralized Data - Master Sheet</p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <Button 
              onClick={handleSync} 
              disabled={isSyncing}
              className="w-full sm:w-auto bg-black text-white hover:bg-gray-800 animate-none transition-all duration-200"
            >
              {isSyncing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Syncing from Google...
                </>
              ) : (
                "Sync Full Database"
              )}
            </Button>
            {lastImportedAt && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-2.5 py-1.5 rounded-md">
                <Clock className="h-3 w-3" />
                Last successful sync: {new Date(lastImportedAt).toLocaleString()}
              </span>
            )}
          </div>

          {isSyncing && (
            <div className="mt-4 border-t border-gray-100 pt-5 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-gray-700 animate-pulse flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  {progressStage}
                </span>
                <span className="text-gray-500 font-mono font-bold bg-gray-100 px-2 py-0.5 rounded text-xs">
                  {progressPercent}%
                </span>
              </div>
              <Progress value={progressPercent} className="h-2 bg-gray-100 [&>div]:bg-black" />
              <p className="text-xs text-gray-400 italic">
                Please do not close or refresh this tab while the master sheet sync is in progress.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-3xl">
        <TimesheetsImport />
      </div>
    </div>
  );
};

const DataQualityTab = () => {
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
      <div className="p-8 flex items-center justify-center h-48">
        <Loader2 className="animate-spin w-8 h-8 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 max-w-full">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Data Quality Completeness
        </h2>
        <p className="text-gray-500 mb-6 text-sm">
          Historical data completeness flags and quality checks from the Pharaoh legacy database.
        </p>

        <div className="bg-white rounded-lg border border-stone-100 p-4 overflow-x-auto">
          <LegacyViewWrapper legacy={legacy} viewFn="renderFlags" />
        </div>
      </div>
    </div>
  );
};

const ClientArchiveTab = () => {
  const [archivedClients, setArchivedClients] = useState<string[]>(() => {
    const stored = localStorage.getItem("prism_inactive_clients");
    return stored ? JSON.parse(stored) : [];
  });

  const handleRestoreClient = (clientName: string) => {
    const next = archivedClients.filter(c => c !== clientName);
    setArchivedClients(next);
    localStorage.setItem("prism_inactive_clients", JSON.stringify(next));
    
    toast.success(`Client "${clientName}" has been successfully restored to the main roster!`, {
      icon: "🎉",
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 max-w-4xl">
        <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <ArchiveRestore className="w-5 h-5 text-primary" />
          Client Archive & Deactivation
        </h2>
        <p className="text-gray-500 mb-6 text-sm">
          Deactivated and archived client accounts are listed below. Restoring a client instantly returns their profile, projects, actual hours, and workspace command centers back to the main Client Portfolio.
        </p>

        {archivedClients.length === 0 ? (
          <div className="text-center py-16 border border-dashed rounded-lg bg-gray-50/50 border-gray-200 flex flex-col items-center justify-center space-y-3">
            <div className="p-3 rounded-full bg-gray-100 text-gray-400">
              <ArchiveRestore className="w-8 h-8" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900">Your archive is completely empty</h3>
            <p className="text-xs text-gray-500 max-w-sm">All clients are currently active and showing inside the Client Portfolio workspaces.</p>
          </div>
        ) : (
          <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="font-semibold text-gray-900 text-xs">Client Name</TableHead>
                  <TableHead className="font-semibold text-gray-900 text-xs text-center">Status</TableHead>
                  <TableHead className="font-semibold text-gray-900 text-xs text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {archivedClients.map((client) => (
                  <TableRow key={client} className="hover:bg-gray-50/50 transition-colors">
                    <TableCell className="font-semibold text-sm text-gray-900 py-3.5 pl-6">
                      {client}
                    </TableCell>
                    <TableCell className="text-center py-3.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-medium">
                        Inactive / Archived
                      </span>
                    </TableCell>
                    <TableCell className="text-right pr-6 py-3.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestoreClient(client)}
                        className="h-8 text-xs font-semibold hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-all gap-1.5"
                      >
                        <ArchiveRestore className="w-3.5 h-3.5" />
                        Restore Client
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
};

export default function SettingsPage() {
  const { appUser } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("Core");
  const [adding, setAdding] = useState(false);
  const [allocationUser, setAllocationUser] = useState<any>(null);

  const checkboxColors: Record<string, string> = {
    Master: "data-[state=checked]:bg-[#fe4f2a] data-[state=checked]:border-[#fe4f2a] border-stone-300 focus-visible:ring-[#fe4f2a]",
    Ambassador: "data-[state=checked]:bg-[#4b70d8] data-[state=checked]:border-[#4b70d8] border-stone-300 focus-visible:ring-[#4b70d8]",
    Champion: "data-[state=checked]:bg-[#ff7daa] data-[state=checked]:border-[#ff7daa] border-stone-300 focus-visible:ring-[#ff7daa]",
    Core: "data-[state=checked]:bg-[#ffc300] data-[state=checked]:border-[#ffc300] data-[state=checked]:text-black border-stone-300 focus-visible:ring-[#ffc300]"
  };

  const isAdmin = appUser?.role === "admin" || appUser?.role === "Master";

  const [matrix, setMatrix] = useState<Record<string, FeaturePermissions>>(() => {
    const stored = localStorage.getItem("prism_role_permissions");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error("Failed to parse stored permissions matrix", e);
      }
    }
    return DEFAULT_ROLE_PERMISSIONS;
  });

  const handleToggleMatrix = (role: string, feature: keyof FeaturePermissions) => {
    const updated = {
      ...matrix,
      [role]: {
        ...matrix[role],
        [feature]: !matrix[role][feature]
      }
    };
    setMatrix(updated);
    localStorage.setItem("prism_role_permissions", JSON.stringify(updated));
    toast.success(`Updated ${feature} access for ${role}`);
  };

  const { data: allClients = [] } = useQuery({
    queryKey: ["all_pharaoh_clients"],
    queryFn: async () => {
      const { data: usData } = await supabase.from('pharaoh_data').select('payload').eq('id', 'us').maybeSingle();
      const { data: ukData } = await supabase.from('pharaoh_data').select('payload').eq('id', 'uk').maybeSingle();
      
      const usClients = Object.values(usData?.payload?.owner_clients || {}).flat() as string[];
      const ukClients = Object.values(ukData?.payload?.owner_clients || {}).flat() as string[];
      
      return [...new Set([...usClients, ...ukClients])].sort();
    }
  });

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [appUser, isAdmin]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from("app_users").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      setUsers(data?.map(u => ({
        id: u.id,
        email: u.email,
        role: u.role,
        createdAt: u.created_at,
        addedBy: u.added_by,
        allocatedClients: u.allocated_clients || []
      })) || []);
    } catch (error) {
      console.error("Failed to fetch users", error);
      toast.error("Failed to load users list.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!newEmail || !newEmail.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }

    try {
      setAdding(true);
      const { error } = await supabase.from("app_users").insert([{
        email: newEmail.toLowerCase(),
        role: newRole,
        added_by: appUser?.email || "unknown",
      }]);
      if (error) throw error;
      toast.success("User added successfully.");
      setNewEmail("");
      setNewRole("user");
      fetchUsers();
    } catch (error: any) {
      console.error("Failed to add user", error);
      if (error.message && error.message.includes("duplicate key")) {
        toast.error("User already exists.");
      } else {
        toast.error("Failed to add user.");
      }
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteUser = async (id: string, email: string) => {
    if (email === appUser?.email) {
      toast.error("You cannot remove yourself.");
      return;
    }
    
    if (!confirm(`Are you sure you want to remove ${email}?`)) return;

    try {
      const { error } = await supabase.from("app_users").delete().eq("id", id);
      if (error) throw error;
      toast.success("User removed successfully.");
      fetchUsers();
    } catch (error) {
      console.error("Failed to delete user", error);
      toast.error("Failed to remove user.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage application data and user access.</p>
      </div>

      <Tabs defaultValue="data" className="space-y-6">
        <TabsList className={cn(
          "grid",
          isAdmin ? "w-[1000px] grid-cols-5" : "w-[800px] grid-cols-4"
        )}>
          <TabsTrigger value="data">Data Sync</TabsTrigger>
          <TabsTrigger value="quality">Data Quality</TabsTrigger>
          <TabsTrigger value="agents">Agent Centre</TabsTrigger>
          <TabsTrigger value="archive">Client Archive</TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="access">Access Control</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="data">
          <DataSyncTab />
        </TabsContent>

        <TabsContent value="quality">
          <DataQualityTab />
        </TabsContent>

        <TabsContent value="agents">
          <AgentCentreTab />
        </TabsContent>

        <TabsContent value="archive">
          <ClientArchiveTab />
        </TabsContent>

        {appUser?.role === "admin" && (
          <TabsContent value="access">
            <div className="bg-card border rounded-xl overflow-hidden">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold mb-4">Add User</h2>
                <div className="flex items-end gap-4">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@billiondollarboy.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                    />
                  </div>
                  <div className="w-48 space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={newRole} onValueChange={setNewRole}>
                      <SelectTrigger id="role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Master">Master (Admin)</SelectItem>
                        <SelectItem value="Ambassador">Ambassador</SelectItem>
                        <SelectItem value="Champion">Champion</SelectItem>
                        <SelectItem value="Core">Core</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleAddUser} disabled={adding}>
                    {adding ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />}
                    Add User
                  </Button>
                </div>
              </div>

              <div className="p-0">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Added By</TableHead>
                      <TableHead>Clients</TableHead>
                      <TableHead>Date Added</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No users found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.email}</TableCell>
                           <TableCell>
                            <span className={cn(
                              "px-2.5 py-1 rounded-full text-xs font-semibold border",
                              (user.role === 'admin' || user.role === 'Master') && "bg-[#fe4f2a]/10 text-[#fe4f2a] border-[#fe4f2a]/30",
                              user.role === 'Ambassador' && "bg-[#4b70d8]/10 text-[#4b70d8] border-[#4b70d8]/30",
                              user.role === 'Champion' && "bg-[#ff7daa]/10 text-[#ff7daa] border-[#ff7daa]/30",
                              (user.role === 'user' || user.role === 'Core') && "bg-[#ffc300]/10 text-[#b28400] border-[#ffc300]/40"
                            )}>
                              {user.role === 'admin' ? 'Master' : user.role === 'user' ? 'Core' : user.role}
                            </span>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{user.addedBy || '-'}</TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => setAllocationUser(user)}
                            >
                              <UserCheck className="w-3 h-3 mr-1.5" />
                              {user.allocatedClients?.length || 0} Clients
                            </Button>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </TableCell>
                           <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleDeleteUser(user.id, user.email)}
                              disabled={user.email === appUser?.email}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Feature Access Matrix Configurator */}
            <div className="bg-card border rounded-xl overflow-hidden p-6 shadow-sm">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-stone-950 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#4b70d8]" />
                  Feature Access Matrix Dashboard
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Configure which platform modules and analytics screens are visible to each access tier in real-time.
                </p>
              </div>

              <div className="overflow-x-auto border rounded-lg bg-white">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="w-64 font-semibold text-stone-900 text-xs uppercase tracking-wider">Feature Module</TableHead>
                      <TableHead className="text-center font-bold text-xs uppercase tracking-wider text-[#fe4f2a]">Master</TableHead>
                      <TableHead className="text-center font-bold text-xs uppercase tracking-wider text-[#4b70d8]">Ambassador</TableHead>
                      <TableHead className="text-center font-bold text-xs uppercase tracking-wider text-[#ff7daa]">Champion</TableHead>
                      <TableHead className="text-center font-bold text-xs uppercase tracking-wider text-[#b28400]">Core</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      { key: "home", label: "Home Dashboard", desc: "Main summary dashboard, key metrics, and Margin Sentry copilot" },
                      { key: "utilisation", label: "Time & Utilisation", desc: "Roster lists, capacity charts, and hours analytics" },
                      { key: "profitability", label: "Profitability Analytics", desc: "Revenue burn rate tracking and margin calculations" },
                      { key: "clientPortfolio", label: "Client Portfolio", desc: "Accounts management and client roster" },
                      { key: "resourcePlanner", label: "Resource Planner", desc: "Cross-office resource allocations and forecast timeline" },
                      { key: "feeCalculator", label: "Fee Calculator", desc: "Billing rate models and project cost modeling" },
                      { key: "operationsHub", label: "Operations Hub", desc: "Master administrative operations controls" },
                      { key: "settings", label: "Settings Screen", desc: "Data synchronization and access control parameters" }
                    ].map((feature) => (
                      <TableRow key={feature.key} className="hover:bg-muted/10">
                        <TableCell className="py-3">
                          <div>
                            <span className="font-semibold text-xs text-stone-900">{feature.label}</span>
                            <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{feature.desc}</p>
                          </div>
                        </TableCell>
                        {["Master", "Ambassador", "Champion", "Core"].map((roleName) => (
                          <TableCell key={roleName} className="text-center py-3">
                            <Checkbox 
                              checked={matrix[roleName]?.[feature.key as keyof FeaturePermissions] ?? false}
                              onCheckedChange={() => handleToggleMatrix(roleName, feature.key as keyof FeaturePermissions)}
                              disabled={roleName === "Master" && feature.key === "settings"} // Safeguard settings module from Master lockout
                              className={cn("mx-auto", checkboxColors[roleName])}
                            />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>
      
      <ClientAllocationDialog 
        user={allocationUser}
        allClients={allClients}
        isOpen={!!allocationUser}
        onClose={() => setAllocationUser(null)}
        onSuccess={fetchUsers}
      />
    </div>
  );
}
