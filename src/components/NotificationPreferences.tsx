import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Bell, Loader2, Mail, Save, Send } from "lucide-react";
import { toast } from "@/hooks/use-toast";
interface NotificationPreference {
  id?: string;
  user_id: string;
  enabled: boolean;
  frequency: "daily" | "weekly" | "monthly";
  search_keyword: string | null;
  experience_level: string | null;
  job_boards: string[];
  last_sent_at: string | null;
}

const JOB_BOARDS = [
  { id: "weworkremotely", label: "We Work Remotely" },
  { id: "remoteok", label: "RemoteOK" },
  { id: "workingnomads", label: "Working Nomads" },
];

const NotificationPreferences = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreference>({
    user_id: user?.id || "",
    enabled: false,
    frequency: "daily",
    search_keyword: null,
    experience_level: null,
    job_boards: ["weworkremotely", "remoteok", "workingnomads"],
    last_sent_at: null,
  });

  useEffect(() => {
    if (user) {
      fetchPreferences();
    }
  }, [user]);

  const fetchPreferences = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPreferences({
          id: data.id,
          user_id: data.user_id,
          enabled: data.enabled,
          frequency: data.frequency as "daily" | "weekly" | "monthly",
          search_keyword: data.search_keyword,
          experience_level: data.experience_level,
          job_boards: data.job_boards || ["weworkremotely", "remoteok", "workingnomads"],
          last_sent_at: data.last_sent_at,
        });
      } else {
        setPreferences(prev => ({ ...prev, user_id: user.id }));
      }
    } catch (error) {
      console.error("Error fetching preferences:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const dataToSave = {
        user_id: user.id,
        enabled: preferences.enabled,
        frequency: preferences.frequency,
        search_keyword: preferences.search_keyword || null,
        experience_level: preferences.experience_level || null,
        job_boards: preferences.job_boards,
      };

      if (preferences.id) {
        // Update existing
        const { error } = await supabase
          .from("notification_preferences")
          .update(dataToSave)
          .eq("id", preferences.id);

        if (error) throw error;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from("notification_preferences")
          .insert(dataToSave)
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setPreferences(prev => ({ ...prev, id: data.id }));
        }
      }

      // If enabling alerts, ensure the user is synced to Mailchimp.
      // Signup already syncs, but enabling later can leave Mailchimp state stale.
      if (preferences.enabled) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("email")
          .eq("id", user.id)
          .maybeSingle();

        const email = profile?.email;
        const fullName = "";

        if (email) {
          const { error } = await supabase.functions.invoke("mailchimp-sync", {
            body: { email, fullName },
          });

          if (error) {
            console.error("[NOTIFICATION-PREFERENCES] mailchimp-sync failed:", error);
          }
        } else {
          console.warn("[NOTIFICATION-PREFERENCES] No profile email found; skipping mailchimp-sync.");
        }
      }

      toast({
        title: "Preferences saved",
        description: preferences.enabled
          ? `You'll receive ${preferences.frequency} job alerts.`
          : "Job alerts are now disabled.",
      });
    } catch (error: any) {
      console.error("Error saving preferences:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save preferences",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleBoardToggle = (boardId: string, checked: boolean) => {
    setPreferences(prev => ({
      ...prev,
      job_boards: checked
        ? [...prev.job_boards, boardId]
        : prev.job_boards.filter(id => id !== boardId),
    }));
  };

  const handleTestAlert = async () => {
    if (!user || !preferences.id) {
      toast({
        title: "Save preferences first",
        description: "Please save your notification preferences before testing.",
        variant: "destructive",
      });
      return;
    }

    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("job-alerts", {
        body: { test: true, user_id: user.id },
      });

      if (error) throw error;

      if (data?.emailsSent > 0) {
        toast({
          title: "Test email sent!",
          description: `Check your inbox for ${data.emailsSent} job alert email.`,
        });
      } else if (data?.details?.length > 0) {
        toast({
          title: "No jobs to send",
          description: data.details[0] || "No new jobs matching your preferences.",
        });
      } else {
        toast({
          title: "Alert processed",
          description: data?.message || "Check your email inbox.",
        });
      }
    } catch (error: any) {
      console.error("Error testing alert:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send test alert",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          Email Notifications
        </CardTitle>
        <CardDescription>
          Receive job alerts based on your preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="notifications-enabled">Enable Job Alerts</Label>
            <p className="text-sm text-muted-foreground">
              Receive email notifications when new jobs are scraped
            </p>
          </div>
          <Switch
            id="notifications-enabled"
            checked={preferences.enabled}
            onCheckedChange={(checked) => 
              setPreferences(prev => ({ ...prev, enabled: checked }))
            }
          />
        </div>

        {preferences.enabled && (
          <>
            {/* Frequency */}
            <div className="space-y-2">
              <Label htmlFor="frequency">Alert Frequency</Label>
              <Select
                value={preferences.frequency}
                onValueChange={(value: "daily" | "weekly" | "monthly") =>
                  setPreferences(prev => ({ ...prev, frequency: value }))
                }
              >
                <SelectTrigger id="frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Search Keyword */}
            <div className="space-y-2">
              <Label htmlFor="keyword">Search Keyword (optional)</Label>
              <Input
                id="keyword"
                placeholder="e.g., developer, designer, marketing"
                value={preferences.search_keyword || ""}
                onChange={(e) =>
                  setPreferences(prev => ({ ...prev, search_keyword: e.target.value || null }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Only receive alerts for jobs matching this keyword
              </p>
            </div>

            {/* Experience Level */}
            <div className="space-y-2">
              <Label htmlFor="experience">Experience Level (optional)</Label>
              <Select
                value={preferences.experience_level || "all"}
                onValueChange={(value) =>
                  setPreferences(prev => ({ 
                    ...prev, 
                    experience_level: value === "all" ? null : value 
                  }))
                }
              >
                <SelectTrigger id="experience">
                  <SelectValue placeholder="All Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="junior">Junior</SelectItem>
                  <SelectItem value="mid">Mid-Level</SelectItem>
                  <SelectItem value="senior">Senior</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Job Boards */}
            <div className="space-y-3">
              <Label>Job Boards</Label>
              <div className="space-y-2">
                {JOB_BOARDS.map((board) => (
                  <div key={board.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={board.id}
                      checked={preferences.job_boards.includes(board.id)}
                      onCheckedChange={(checked) => 
                        handleBoardToggle(board.id, checked as boolean)
                      }
                    />
                    <Label htmlFor={board.id} className="font-normal cursor-pointer">
                      {board.label}
                    </Label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Select which job boards to include in your alerts
              </p>
            </div>
          </>
        )}

        {/* Last Sent Info */}
        {preferences.last_sent_at && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4" />
            Last alert sent: {new Date(preferences.last_sent_at).toLocaleDateString()}
          </div>
        )}

        {/* Save Button */}
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Preferences
          </Button>
          {preferences.enabled && preferences.id && (
            <Button 
              onClick={handleTestAlert} 
              disabled={testing} 
              variant="outline"
              className="flex-1"
            >
              {testing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Send Test Alert
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationPreferences;
