import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Mail, Phone, Calendar, LogOut, ArrowLeft, KeyRound, Info, X } from "lucide-react";
import { motion } from "framer-motion";
import { ChangePasswordModal } from "@/components/ChangePasswordModal";
import { NotificationSettings } from "@/components/NotificationSettings";
import { safeLocalStorage } from "@/lib/storage";

export default function ProfilePage() {
  const [, setLocation] = useLocation();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [showFreeNotification, setShowFreeNotification] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const userStr = safeLocalStorage.getItem("user");
    if (!userStr) {
      setLocation("/auth?mode=login");
      return;
    }
    try {
      const user = JSON.parse(userStr);
      setCurrentUser(user);
      setIsAuthenticated(true);
    } catch (err) {
      safeLocalStorage.removeItem("user");
      setLocation("/auth?mode=login");
    }
  }, [setLocation]);

  // Check if free notification was dismissed
  useEffect(() => {
    const dismissed = safeLocalStorage.getItem("freeNotificationDismissed");
    if (dismissed === "true") {
      setShowFreeNotification(false);
    }
  }, []);

  const handleDismissFreeNotification = () => {
    setShowFreeNotification(false);
    safeLocalStorage.setItem("freeNotificationDismissed", "true");
  };

  const handleLogout = () => {
    safeLocalStorage.removeItem("user");
    setIsAuthenticated(false);
    setCurrentUser(null);
    setLocation("/");
  };

  if (!isAuthenticated || !currentUser) {
    return null;
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar
        isAuthenticated={isAuthenticated}
        onLogoutClick={handleLogout}
      />

      <main className="flex-1">
        {showFreeNotification && (
          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-blue-950/30 border-b border-blue-200 dark:border-blue-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    🎉 You're using Food Reminder Free Edition
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    Enjoying the service? Consider upgrading for premium features like unlimited items, advanced analytics, and priority support.
                  </p>
                </div>
                <button
                  onClick={handleDismissFreeNotification}
                  className="flex-shrink-0 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
                  aria-label="Dismiss notification"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => setLocation("/dashboard")}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          {/* Profile Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="mb-6">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
                    <User className="w-12 h-12 text-white" />
                  </div>
                </div>
                <CardTitle className="text-3xl">{currentUser.username}</CardTitle>
                <CardDescription>Welcome to your profile</CardDescription>
              </CardHeader>
            </Card>
          </motion.div>

          {/* Profile Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Your account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Username */}
                <div className="flex items-start space-x-4 p-4 rounded-lg bg-muted/50">
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                    <User className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Username</p>
                    <p className="text-lg font-semibold">{currentUser.username}</p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start space-x-4 p-4 rounded-lg bg-muted/50">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                    <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Email Address</p>
                    <p className="text-lg font-semibold">{currentUser.email}</p>
                  </div>
                </div>

                {/* Mobile */}
                <div className="flex items-start space-x-4 p-4 rounded-lg bg-muted/50">
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                    <Phone className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Mobile Number</p>
                    <p className="text-lg font-semibold">{currentUser.mobile}</p>
                  </div>
                </div>

                {/* Member Since */}
                {currentUser.createdAt && (
                  <div className="flex items-start space-x-4 p-4 rounded-lg bg-muted/50">
                    <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/20">
                      <Calendar className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Member Since</p>
                      <p className="text-lg font-semibold">{formatDate(currentUser.createdAt)}</p>
                    </div>
                  </div>
                )}

                {/* User ID */}
                <div className="flex items-start space-x-4 p-4 rounded-lg bg-muted/50">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">User ID</p>
                    <p className="text-xs font-mono text-muted-foreground break-all">{currentUser.id}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mt-6"
          >
            <Card>
              <CardHeader>
                <CardTitle>Account Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  onClick={() => setChangePasswordOpen(true)}
                  className="w-full"
                >
                  <KeyRound className="w-4 h-4 mr-2" />
                  Change Password
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleLogout}
                  className="w-full"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Notification Settings */}
          <NotificationSettings userId={currentUser.id} />
        </div>
      </main>

      {/* Change Password Modal */}
      {currentUser && (
        <ChangePasswordModal
          open={changePasswordOpen}
          onOpenChange={setChangePasswordOpen}
          userId={currentUser.id}
        />
      )}
    </div>
  );
}
