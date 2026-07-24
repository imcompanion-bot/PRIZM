import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Trash2, UserPlus, Loader2, Database, Clock } from "lucide-react";
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

export default function SettingsPage() {
  const { appUser } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("user");
  const [adding, setAdding] = useState(false);
  const [allocationUser, setAllocationUser] = useState<any>(null);

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
    if (appUser?.role === "admin") {
      fetchUsers();
    }
  }, [appUser]);

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
          appUser?.role === "admin" ? "w-[800px] grid-cols-4" : "w-[600px] grid-cols-3"
        )}>
          <TabsTrigger value="data">Data Sync</TabsTrigger>
          <TabsTrigger value="quality">Data Quality</TabsTrigger>
          <TabsTrigger value="agents">Agent Centre</TabsTrigger>
          {appUser?.role === "admin" && (
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
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
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
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                              {user.role}
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
                              disabled={user.email === appUser.email}
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
