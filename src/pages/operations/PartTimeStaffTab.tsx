import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, Trash2, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function PartTimeStaffTab() {
  const [loading, setLoading] = useState(true);
  const [people, setPeople] = useState<any[]>([]);
  const [configs, setConfigs] = useState<any[]>([]);
  const { toast } = useToast();

  // Form State
  const [selectedPerson, setSelectedPerson] = useState("");
  const [daysPerWeek, setDaysPerWeek] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [peopleRes, configsRes] = await Promise.all([
        supabase.from("people").select("id, name").order("name"),
        supabase
          .from("part_time_configs")
          .select("*, people(name)")
          .order("created_at", { ascending: false }),
      ]);

      if (peopleRes.error) throw peopleRes.error;
      if (configsRes.error) throw configsRes.error;

      setPeople(peopleRes.data || []);
      setConfigs(configsRes.data || []);
    } catch (error: any) {
      console.error("Error fetching part time data", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleAddRow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPerson || !daysPerWeek) {
      toast({ title: "Validation Error", description: "Person and Days per week are required.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("part_time_configs").insert({
        person_id: selectedPerson,
        days_per_week: parseFloat(daysPerWeek),
        start_date: startDate || null,
        end_date: endDate || null,
      });

      if (error) throw error;

      toast({ title: "Added successfully", description: "Part-time configuration added." });
      
      // Reset form
      setSelectedPerson("");
      setDaysPerWeek("");
      setStartDate("");
      setEndDate("");
      
      // Refresh
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    try {
      const { error } = await supabase.from("part_time_configs").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Deleted", description: "Record deleted successfully." });
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-stone-50">
          <h2 className="text-sm font-semibold font-display uppercase tracking-wider flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-blue-500" />
            Add Part-Time Record
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Specify the number of days a person works. Leave dates blank if this applies indefinitely.
          </p>
        </div>
        
        <form onSubmit={handleAddRow} className="p-4 flex flex-wrap gap-4 items-end">
          <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
            <label className="text-xs font-medium text-stone-600">Staff Member</label>
            <Select value={selectedPerson} onValueChange={setSelectedPerson}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select person..." />
              </SelectTrigger>
              <SelectContent>
                {people.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex flex-col gap-1.5 w-32">
            <label className="text-xs font-medium text-stone-600">Days / Week</label>
            <Input 
              type="number" 
              step="0.1" 
              min="0" 
              max="5" 
              value={daysPerWeek} 
              onChange={e => setDaysPerWeek(e.target.value)} 
              placeholder="e.g. 3.5"
              className="h-9"
            />
          </div>

          <div className="flex flex-col gap-1.5 w-40">
            <label className="text-xs font-medium text-stone-600">Start Date (Optional)</label>
            <Input 
              type="date" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)} 
              className="h-9"
            />
          </div>

          <div className="flex flex-col gap-1.5 w-40">
            <label className="text-xs font-medium text-stone-600">End Date (Optional)</label>
            <Input 
              type="date" 
              value={endDate} 
              onChange={e => setEndDate(e.target.value)} 
              className="h-9"
            />
          </div>

          <Button type="submit" disabled={isSubmitting} size="sm" className="h-9 gap-2 whitespace-nowrap bg-blue-600 hover:bg-blue-700">
            {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            Add Record
          </Button>
        </form>
      </div>

      <div className="bg-white rounded-lg border shadow-sm flex-1 flex flex-col min-h-0">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="text-sm font-semibold font-display uppercase tracking-wider">
            Current Part-Time Roster
          </h3>
          <div className="text-xs font-medium text-muted-foreground bg-stone-100 px-2 py-1 rounded">
            {configs.length} Records
          </div>
        </div>
        
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-xs text-stone-500 uppercase bg-stone-50 sticky top-0 z-10 font-display shadow-sm">
              <tr>
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Days / Week</th>
                <th className="px-6 py-3 font-medium">Start Date</th>
                <th className="px-6 py-3 font-medium">End Date</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {configs.map((row) => (
                <tr key={row.id} className="hover:bg-stone-50/50 transition-colors">
                  <td className="px-6 py-3 font-medium text-stone-900">
                    {row.people?.name || "Unknown"}
                  </td>
                  <td className="px-6 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-700/10">
                      {row.days_per_week} days
                    </span>
                  </td>
                  <td className="px-6 py-3 text-stone-600">
                    {row.start_date ? format(new Date(row.start_date), "MMM d, yyyy") : "—"}
                  </td>
                  <td className="px-6 py-3 text-stone-600">
                    {row.end_date ? format(new Date(row.end_date), "MMM d, yyyy") : "—"}
                  </td>
                  <td className="px-6 py-3 text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDelete(row.id)}
                      className="h-8 w-8 text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete record"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {configs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-stone-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <CalendarDays className="h-8 w-8 text-stone-300" />
                      <p>No part-time records found.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
