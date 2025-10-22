import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Bell, Mail, MessageCircle, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

interface NotificationPreferences {
  emailNotifications: boolean;
  whatsappNotifications: boolean;
  notificationDays: number;
  servicesConfigured?: {
    email: boolean;
    whatsapp: boolean;
  };
}

interface NotificationSettingsProps {
  userId: string;
}

export function NotificationSettings({ userId }: NotificationSettingsProps) {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailNotifications: true,
    whatsappNotifications: false,
    notificationDays: 3,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPreferences();
  }, [userId]);

  const fetchPreferences = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/notifications/preferences/${userId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch preferences");
      }
      const data = await response.json();
      setPreferences(data);
    } catch (error) {
      console.error("Error fetching notification preferences:", error);
      toast({
        title: "Error",
        description: "Failed to load notification preferences",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/notifications/preferences/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailNotifications: preferences.emailNotifications,
          whatsappNotifications: preferences.whatsappNotifications,
          notificationDays: preferences.notificationDays,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save preferences");
      }

      toast({
        title: "Saved!",
        description: "Notification preferences updated successfully",
      });
    } catch (error) {
      console.error("Error saving notification preferences:", error);
      toast({
        title: "Error",
        description: "Failed to save notification preferences",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestNotification = async () => {
    setIsTesting(true);
    try {
      const response = await fetch(`/api/notifications/test/${userId}`, {
        method: "POST",
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Test Sent!",
          description: result.message,
        });
      } else {
        toast({
          title: "Test Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error testing notification:", error);
      toast({
        title: "Error",
        description: "Failed to send test notification",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notification Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notification Settings
          </CardTitle>
          <CardDescription>
            Manage how you receive alerts about expiring food items
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email Notifications */}
          <div className="flex items-start justify-between space-x-4 p-4 rounded-lg bg-muted/50">
            <div className="flex items-start space-x-3 flex-1">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20 mt-1">
                <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Label htmlFor="email-notifications" className="text-base font-semibold cursor-pointer">
                    Email Notifications
                  </Label>
                  {preferences.servicesConfigured?.email ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Receive expiry alerts via email
                  {!preferences.servicesConfigured?.email && (
                    <span className="block text-amber-600 dark:text-amber-500 mt-1">
                      ⚠️ Email service not configured on server
                    </span>
                  )}
                </p>
              </div>
            </div>
            <Switch
              id="email-notifications"
              checked={preferences.emailNotifications}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, emailNotifications: checked })
              }
              disabled={!preferences.servicesConfigured?.email}
            />
          </div>

          {/* WhatsApp Notifications */}
          <div className="flex items-start justify-between space-x-4 p-4 rounded-lg bg-muted/50">
            <div className="flex items-start space-x-3 flex-1">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20 mt-1">
                <MessageCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Label htmlFor="whatsapp-notifications" className="text-base font-semibold cursor-pointer">
                    WhatsApp Notifications
                  </Label>
                  {preferences.servicesConfigured?.whatsapp ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Receive expiry alerts via WhatsApp
                  {!preferences.servicesConfigured?.whatsapp && (
                    <span className="block text-amber-600 dark:text-amber-500 mt-1">
                      ⚠️ WhatsApp service not configured on server
                    </span>
                  )}
                </p>
              </div>
            </div>
            <Switch
              id="whatsapp-notifications"
              checked={preferences.whatsappNotifications}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, whatsappNotifications: checked })
              }
              disabled={!preferences.servicesConfigured?.whatsapp}
            />
          </div>

          {/* Notification Days Threshold */}
          <div className="p-4 rounded-lg bg-muted/50 space-y-3">
            <Label htmlFor="notification-days" className="text-base font-semibold">
              Notification Timing
            </Label>
            <p className="text-sm text-muted-foreground">
              Get notified when items are expiring within this many days
            </p>
            <div className="flex items-center gap-3">
              <Input
                id="notification-days"
                type="number"
                min="1"
                max="30"
                value={preferences.notificationDays}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    notificationDays: parseInt(e.target.value) || 3,
                  })
                }
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">days before expiry</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Preferences"
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleTestNotification}
              disabled={isTesting || (!preferences.emailNotifications && !preferences.whatsappNotifications)}
              className="flex-1 sm:flex-initial"
            >
              {isTesting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4 mr-2" />
                  Test Notification
                </>
              )}
            </Button>
          </div>

          <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
            <strong>ℹ️ Note:</strong> Notifications are sent for items expiring within your specified timeframe. 
            The test button will send an immediate notification if you have any expiring items.
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
