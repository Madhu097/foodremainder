import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Bell, Mail, MessageCircle, CheckCircle2, AlertCircle, Send, Globe, Moon, Smartphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { API_BASE_URL } from "@/lib/api";
import { FoodLoader, BouncingFoodLoader } from "@/components/FoodLoader";

interface NotificationPreferences {
  emailNotifications: boolean;
  whatsappNotifications: boolean;
  smsNotifications: boolean;
  telegramNotifications: boolean;
  browserNotifications: boolean;
  telegramChatId?: string;
  notificationDays: number;
  notificationsPerDay: number; // 1-4 times per day
  quietHoursStart?: string | null;
  quietHoursEnd?: string | null;
  servicesConfigured?: {
    email: boolean;
    whatsapp: boolean;
    whatsappCloud?: boolean;
    sms: boolean;
    telegram: boolean;
    push: boolean;
  };
}

interface NotificationSettingsProps {
  userId: string;
}

export function NotificationSettings({ userId }: NotificationSettingsProps) {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailNotifications: true,
    whatsappNotifications: false,
    smsNotifications: false,
    telegramNotifications: false,
    browserNotifications: false,
    telegramChatId: "",
    notificationDays: 3,
    notificationsPerDay: 1,
    quietHoursStart: "",
    quietHoursEnd: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [botUsername, setBotUsername] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchPreferences();
    fetchBotConfig();
  }, [userId]);

  const fetchBotConfig = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/telegram-config`);
      if (response.ok) {
        const data = await response.json();
        setBotUsername(data.botUsername);
      }
    } catch (error) {
      console.error("Error fetching bot config:", error);
    }
  };

  const fetchPreferences = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/preferences/${userId}`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch preferences");
      }
      const data = await response.json();
      setPreferences({
        ...data,
        quietHoursStart: data.quietHoursStart || "",
        quietHoursEnd: data.quietHoursEnd || "",
      });
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

  const subscribeToPush = async () => {
    // Check browser support first
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      toast({
        title: "Not Supported",
        description: "Push notifications are not supported in this browser. Please use Chrome, Firefox, or Edge.",
        variant: "destructive"
      });
      return false;
    }

    // Check if notifications are supported
    if (!('Notification' in window)) {
      toast({
        title: "Not Supported",
        description: "Notifications are not supported in this browser.",
        variant: "destructive"
      });
      return false;
    }

    try {
      setIsSubscribing(true);
      console.log("[Push] Starting push notification subscription...");
      console.log(`[Push] Current permission: ${Notification.permission}`);

      // Request notification permission IMMEDIATELY (must be synchronous with user gesture)
      // This is critical - the permission request must happen in the same call stack as the user click
      let permission = Notification.permission;

      if (permission === 'default') {
        console.log("[Push] Requesting notification permission...");
        permission = await Notification.requestPermission();
        console.log(`[Push] Permission result after request: ${permission}`);
      } else {
        console.log(`[Push] Permission already set to: ${permission}`);
      }

      if (permission !== 'granted') {
        toast({
          title: "Permission Denied",
          description: permission === 'denied'
            ? "Notifications are blocked. Please enable them in your browser settings for this site."
            : "Please allow notifications to enable this feature.",
          variant: "destructive"
        });
        return false;
      }

      console.log("[Push] Permission granted, proceeding with service worker registration...");

      // Check if service worker is already registered
      let registration = await navigator.serviceWorker.getRegistration('/');

      if (!registration) {
        console.log("[Push] Registering service worker...");
        registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });
        console.log("[Push] Service worker registered successfully");
      } else {
        console.log("[Push] Service worker already registered");
      }

      // Wait for service worker to be ready
      console.log("[Push] Waiting for service worker to be ready...");
      await navigator.serviceWorker.ready;
      console.log("[Push] Service worker is ready");

      // Get VAPID public key from server
      console.log("[Push] Fetching VAPID public key...");
      const response = await fetch(`${API_BASE_URL}/api/notifications/vapid-public-key`);
      if (!response.ok) {
        throw new Error(`Failed to get VAPID key: ${response.status} ${response.statusText}`);
      }
      const { publicKey } = await response.json();
      console.log("[Push] VAPID key received");

      // Convert base64 string to Uint8Array for subscribe options
      const urlBase64ToUint8Array = (base64String: string) => {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
          .replace(/\-/g, '+')
          .replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
          outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
      };

      const convertedVapidKey = urlBase64ToUint8Array(publicKey);

      // Check for existing subscription
      let subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        console.log("[Push] Existing subscription found, unsubscribing first...");
        await subscription.unsubscribe();
      }

      // Subscribe to push notifications
      console.log("[Push] Subscribing to push notifications...");
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      });
      console.log("[Push] Push subscription successful");

      // Send subscription to server
      console.log("[Push] Sending subscription to server for userId:", userId);
      const subscribeResponse = await fetch(`${API_BASE_URL}/api/notifications/subscribe`, {
        method: 'POST',
        body: JSON.stringify({ userId, subscription }),
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      if (!subscribeResponse.ok) {
        const errorData = await subscribeResponse.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to save subscription: ${subscribeResponse.status}`);
      }

      console.log("[Push] Subscription saved to server successfully");
      toast({
        title: "Success!",
        description: "Browser notifications enabled successfully. You'll receive alerts for expiring items.",
      });

      return true;
    } catch (error) {
      console.error("[Push] Subscription error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      toast({
        title: "Subscription Failed",
        description: `Could not enable browser notifications: ${errorMessage}`,
        variant: "destructive"
      });
      return false;
    } finally {
      setIsSubscribing(false);
    }
  };

  const handlePushToggle = async (checked: boolean) => {
    console.log("[NotificationSettings] handlePushToggle called with checked:", checked);
    if (checked) {
      console.log("[NotificationSettings] Attempting to subscribe to push notifications...");
      const success = await subscribeToPush();
      console.log("[NotificationSettings] subscribeToPush returned:", success);
      if (success) {
        setPreferences({ ...preferences, browserNotifications: true });
      }
    } else {
      console.log("[NotificationSettings] Disabling browser notifications");
      setPreferences({ ...preferences, browserNotifications: false });
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/preferences/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailNotifications: preferences.emailNotifications,
          whatsappNotifications: preferences.whatsappNotifications,
          smsNotifications: preferences.smsNotifications,
          telegramNotifications: preferences.telegramNotifications,
          browserNotifications: preferences.browserNotifications,
          telegramChatId: preferences.telegramChatId,
          notificationDays: preferences.notificationDays,
          notificationsPerDay: preferences.notificationsPerDay,
          quietHoursStart: preferences.quietHoursStart || null,
          quietHoursEnd: preferences.quietHoursEnd || null,
        }),
        credentials: "include",
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
      const response = await fetch(`${API_BASE_URL}/api/notifications/test/${userId}`, {
        method: "POST",
        credentials: "include",
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
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <FoodLoader size="lg" className="mx-auto" />
            <p className="text-muted-foreground text-sm">Loading settings...</p>
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

          {/* Browser Notifications */}
          <div className="flex items-start justify-between space-x-4 p-4 rounded-lg bg-muted/50">
            <div className="flex items-start space-x-3 flex-1">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20 mt-1">
                <Globe className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Label htmlFor="browser-notifications" className="text-base font-semibold cursor-pointer">
                    Browser Notifications
                  </Label>
                  {preferences.servicesConfigured?.push ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Receive push notifications in your browser
                </p>
              </div>
            </div>
            <Switch
              id="browser-notifications"
              checked={preferences.browserNotifications}
              onCheckedChange={handlePushToggle}
              disabled={isSubscribing}
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
                  {!(preferences.servicesConfigured?.whatsapp || preferences.servicesConfigured?.whatsappCloud) && (
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
              disabled={!(preferences.servicesConfigured?.whatsapp || preferences.servicesConfigured?.whatsappCloud)}
            />
          </div>

          {/* SMS Notifications */}
          <div className="flex items-start justify-between space-x-4 p-4 rounded-lg bg-muted/50">
            <div className="flex items-start space-x-3 flex-1">
              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/20 mt-1">
                <Smartphone className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Label htmlFor="sms-notifications" className="text-base font-semibold cursor-pointer">
                    SMS Notifications
                  </Label>
                  {preferences.servicesConfigured?.sms ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Receive expiry alerts via SMS
                  {!preferences.servicesConfigured?.sms && (
                    <span className="block text-amber-600 dark:text-amber-500 mt-1">
                      ⚠️ SMS service not configured on server
                    </span>
                  )}
                </p>
              </div>
            </div>
            <Switch
              id="sms-notifications"
              checked={preferences.smsNotifications}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, smsNotifications: checked })
              }
              disabled={!preferences.servicesConfigured?.sms}
            />
          </div>

          {/* Telegram Notifications */}
          <div className="flex flex-col space-y-4 p-4 rounded-lg bg-muted/50">
            <div className="flex items-start justify-between space-x-4">
              <div className="flex items-start space-x-3 flex-1">
                <div className="p-2 rounded-lg bg-sky-100 dark:bg-sky-900/20 mt-1">
                  <Send className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="telegram-notifications" className="text-base font-semibold cursor-pointer">
                      Telegram Notifications
                    </Label>
                    {preferences.servicesConfigured?.telegram ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Receive expiry alerts via Telegram bot
                    {!preferences.servicesConfigured?.telegram && (
                      <span className="block text-amber-600 dark:text-amber-500 mt-1">
                        ⚠️ Telegram service not configured on server
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <Switch
                id="telegram-notifications"
                checked={preferences.telegramNotifications}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, telegramNotifications: checked })
                }
                disabled={!preferences.servicesConfigured?.telegram}
              />
            </div>

            {/* Telegram Chat ID Connection */}
            {preferences.telegramNotifications && preferences.servicesConfigured?.telegram && (
              <div className="pl-12 space-y-3">
                {preferences.telegramChatId ? (
                  <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-md">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700 dark:text-green-300">
                      Connected! (ID: {preferences.telegramChatId})
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-auto text-xs h-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => setPreferences({ ...preferences, telegramChatId: "" })}
                    >
                      Disconnect
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Connect your Telegram account to receive notifications.
                    </p>
                    {botUsername ? (
                      <Button variant="default" size="sm" className="bg-sky-600 hover:bg-sky-700" asChild>
                        <a href={`https://t.me/${botUsername}?start=${userId}`} target="_blank" rel="noopener noreferrer">
                          <Send className="w-4 h-4 mr-2" />
                          Connect Telegram
                        </a>
                      </Button>
                    ) : (
                      <p className="text-sm text-amber-600">Loading bot information...</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Clicking the button will open Telegram. Press "Start" to link your account, then <strong>refresh this page</strong>.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quiet Hours */}
          <div className="flex flex-col space-y-4 p-4 rounded-lg bg-muted/50">
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/20 mt-1">
                <Moon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Label className="text-base font-semibold">Quiet Hours</Label>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Don't receive notifications during these hours
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pl-12">
              <div className="space-y-2">
                <Label htmlFor="quiet-start" className="text-xs">Start Time</Label>
                <Input
                  id="quiet-start"
                  type="time"
                  value={preferences.quietHoursStart || ""}
                  onChange={(e) => setPreferences({ ...preferences, quietHoursStart: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quiet-end" className="text-xs">End Time</Label>
                <Input
                  id="quiet-end"
                  type="time"
                  value={preferences.quietHoursEnd || ""}
                  onChange={(e) => setPreferences({ ...preferences, quietHoursEnd: e.target.value })}
                />
              </div>
            </div>
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
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={preferences.notificationDays === 0 ? '' : preferences.notificationDays.toString()}  // ✅ CHANGED
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  if (val === '') {
                    setPreferences({ ...preferences, notificationDays: 0 });  // ✅ CHANGED TO 0
                  } else {
                    const num = parseInt(val);
                    if (!isNaN(num) && num <= 99) {  // ✅ REMOVED >= 1 CHECK
                      setPreferences({ ...preferences, notificationDays: num });
                    }
                  }
                }}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">days before expiry</span>
            </div>
          </div>

          {/* Notifications Per Day */}
          <div className="p-4 rounded-lg bg-muted/50 space-y-3">
            <Label htmlFor="notifications-per-day" className="text-base font-semibold">
              Notification Frequency
            </Label>
            <p className="text-sm text-muted-foreground">
              How many times per day should we send you notifications?
            </p>
            <div className="flex items-center gap-3">
              <Input
                id="notifications-per-day"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={preferences.notificationsPerDay === 0 ? '' : preferences.notificationsPerDay.toString()}  // ✅ CHANGED
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  if (val === '') {
                    setPreferences({ ...preferences, notificationsPerDay: 0 });  // ✅ CHANGED TO 0
                  } else {
                    const num = parseInt(val);
                    if (!isNaN(num) && num <= 9) {  // ✅ REMOVED >= 1 CHECK
                      setPreferences({ ...preferences, notificationsPerDay: num });
                    }
                  }
                }}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">times per day</span>
            </div>
            <p className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/20 p-2 rounded border border-blue-200 dark:border-blue-800">
              💡 <strong>1:</strong> 9 AM • <strong>2:</strong> 9 AM, 6 PM • <strong>3:</strong> 9 AM, 2 PM, 7 PM • <strong>4:</strong> 8 AM, 12 PM, 4 PM, 8 PM
            </p>
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
                  <BouncingFoodLoader size="sm" className="mr-2" />
                  Saving...
                </>
              ) : (
                "Save Preferences"
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleTestNotification}
              disabled={isTesting || (!preferences.emailNotifications && !preferences.whatsappNotifications && !preferences.telegramNotifications && !preferences.browserNotifications)}
              className="flex-1 sm:flex-initial"
            >
              {isTesting ? (
                <>
                  <BouncingFoodLoader size="sm" className="mr-2" />
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
