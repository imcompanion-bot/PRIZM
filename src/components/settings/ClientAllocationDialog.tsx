import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Search } from "lucide-react";

interface ClientAllocationDialogProps {
  user: any;
  allClients: string[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ClientAllocationDialog({ user, allClients, isOpen, onClose, onSuccess }: ClientAllocationDialogProps) {
  const [selectedClients, setSelectedClients] = useState<string[]>(user?.allocatedClients || []);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  // Sync state when dialog opens
  useMemo(() => {
    if (isOpen && user) {
      setSelectedClients(user.allocatedClients || []);
      setSearch("");
    }
  }, [isOpen, user]);

  const filteredClients = useMemo(() => {
    if (!search) return allClients;
    return allClients.filter(c => c.toLowerCase().includes(search.toLowerCase()));
  }, [allClients, search]);

  const toggleClient = (client: string) => {
    setSelectedClients(prev => 
      prev.includes(client) ? prev.filter(c => c !== client) : [...prev, client]
    );
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("app_users")
        .update({ allocated_clients: selectedClients })
        .eq("id", user.id);
        
      if (error) throw error;
      toast.success(`Updated clients for ${user.email}`);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to update clients: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign Clients to {user?.email}</DialogTitle>
          <DialogDescription>
            Select the clients this user should see when they use the "My Clients" view on the Pharaoh dashboard.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clients..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="flex justify-between items-center px-1">
            <span className="text-sm font-medium text-muted-foreground">
              {selectedClients.length} clients selected
            </span>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setSelectedClients([])}
              disabled={selectedClients.length === 0}
            >
              Clear all
            </Button>
          </div>

          <ScrollArea className="h-[300px] border rounded-md p-4">
            {allClients.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground text-sm">
                No clients found in database.
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground text-sm">
                No clients match your search.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredClients.map((client) => (
                  <div key={client} className="flex items-center space-x-3">
                    <Checkbox
                      id={`client-${client}`}
                      checked={selectedClients.includes(client)}
                      onCheckedChange={() => toggleClient(client)}
                    />
                    <label
                      htmlFor={`client-${client}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                    >
                      {client}
                    </label>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || allClients.length === 0}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
