import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, Phone, Calendar, LogOut, ArrowLeft, KeyRound, Edit2, Check, X, Camera } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ChangePasswordModal } from "@/components/ChangePasswordModal";
import { NotificationSettings } from "@/components/NotificationSettings";
import { safeLocalStorage } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Avatar options with Avengers theme
const AVATARS = [
  { id: "default", name: "Default", color: "from-gray-400 to-gray-600" },
  { id: "iron-man", name: "Iron Man", color: "from-red-500 to-yellow-600" },
  { id: "captain-america", name: "Captain America", color: "from-blue-500 to-red-500" },
  { id: "black-widow", name: "Black Widow", color: "from-black to-red-600" },
  { id: "hulk", name: "Hulk", color: "from-green-500 to-green-700" },
  { id: "thor", name: "Thor", color: "from-blue-400 to-gray-500" },
  { id: "black-panther", name: "Black Panther", color: "from-purple-600 to-black" },
];

export default function ProfilePage() {
  const [, setLocation] = useLocation();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [editData, setEditData] = useState({
    username: "",
    email: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const userStr = safeLocalStorage.getItem("user");
    if (!userStr) {
      setLocation("/auth?mode=login");
      return;
    }
    try {
      const user = JSON.parse(userStr);
      setCurrentUser(user);
      setEditData({
        username: user.username,
        email: user.email,
      });
      setIsAuthenticated(true);
    } catch (err) {
      safeLocalStorage.removeItem("user");
      setLocation("/auth?mode=login");
    }
  }, [setLocation]);

  const handleLogout = () => {
    safeLocalStorage.removeItem("user");
    setIsAuthenticated(false);
    setCurrentUser(null);
    setLocation("/");
  };

  const handleEditToggle = () => {
    if (editMode) {
      // Cancel editing
      setEditData({
        username: currentUser.username,
        email: currentUser.email,
      });
    }
    setEditMode(!editMode);
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/update-profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          username: editData.username,
          email: editData.email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update profile");
      }

      // Update local storage and state
      safeLocalStorage.setItem("user", JSON.stringify(data.user));
      setCurrentUser(data.user);
      setEditMode(false);

      toast({
        title: "Success!",
        description: "Profile updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarSelect = async (avatarId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/update-profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          profilePicture: avatarId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update avatar");
      }

      // Update local storage and state
      safeLocalStorage.setItem("user", JSON.stringify(data.user));
      setCurrentUser(data.user);
      setAvatarDialogOpen(false);

      toast({
        title: "Success!",
        description: "Avatar updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update avatar",
        variant: "destructive",
      });
    }
  };

  const getAvatarGradient = () => {
    const avatar = AVATARS.find((a) => a.id === currentUser?.profilePicture) || AVATARS[0];
    return avatar.color;
  };

  const getAvatarUrl = () => {
    const avatarId = currentUser?.profilePicture || "default";
    return `/avatars/${avatarId}.svg`;
  };

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

  if (!isAuthenticated || !currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Navbar isAuthenticated={isAuthenticated} onLogoutClick={handleLogout} />

      <main className="flex-1 py-6 sm:py-8 lg:py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6"
          >
            <Button
              variant="ghost"
              onClick={() => setLocation("/dashboard")}
              className="group hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back to Dashboard
            </Button>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Left Column - Profile Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="lg:col-span-1"
            >
              <Card className="overflow-hidden border-0 shadow-xl">
                <div className={`h-32 bg-gradient-to-br ${getAvatarGradient()}`} />
                <CardContent className="pt-0 pb-6">
                  <div className="flex flex-col items-center -mt-16">
                    {/* Avatar */}
                    <div className="relative group">
                      <div className="w-32 h-32 rounded-full border-4 border-white dark:border-slate-900 shadow-xl overflow-hidden bg-white">
                        <img
                          src={getAvatarUrl()}
                          alt="Profile Avatar"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        onClick={() => setAvatarDialogOpen(true)}
                        className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                      >
                        <Camera className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Name */}
                    <h2 className="mt-4 text-2xl font-bold text-foreground">
                      {currentUser.username}
                    </h2>
                    <p className="text-sm text-muted-foreground">{currentUser.email}</p>

                    {/* Member Since */}
                    {currentUser.createdAt && (
                      <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>Member since {formatDate(currentUser.createdAt)}</span>
                      </div>
                    )}

                    {/* Quick Actions */}
                    <div className="w-full mt-6 space-y-2">
                      <Button
                        variant="outline"
                        onClick={() => setChangePasswordOpen(true)}
                        className="w-full justify-start"
                      >
                        <KeyRound className="w-4 h-4 mr-2" />
                        Change Password
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleLogout}
                        className="w-full justify-start"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Right Column - Details & Settings */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Information */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <Card className="border-0 shadow-lg">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">Personal Information</CardTitle>
                      <CardDescription>Manage your account details</CardDescription>
                    </div>
                    {!editMode ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleEditToggle}
                        className="gap-2"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleEditToggle}>
                          <X className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSaveProfile}
                          disabled={isSaving}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Username */}
                    <div className="space-y-2">
                      <Label htmlFor="username" className="text-sm font-medium">
                        Username
                      </Label>
                      {editMode ? (
                        <Input
                          id="username"
                          value={editData.username}
                          onChange={(e) =>
                            setEditData({ ...editData, username: e.target.value })
                          }
                          className="font-medium"
                        />
                      ) : (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                          <User className="w-5 h-5 text-primary" />
                          <span className="font-medium">{currentUser.username}</span>
                        </div>
                      )}
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium">
                        Email Address
                      </Label>
                      {editMode ? (
                        <Input
                          id="email"
                          type="email"
                          value={editData.email}
                          onChange={(e) =>
                            setEditData({ ...editData, email: e.target.value })
                          }
                          className="font-medium"
                        />
                      ) : (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                          <Mail className="w-5 h-5 text-blue-500" />
                          <span className="font-medium">{currentUser.email}</span>
                        </div>
                      )}
                    </div>

                    {/* Mobile (Read-only) */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Mobile Number</Label>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <Phone className="w-5 h-5 text-green-500" />
                        <span className="font-medium">{currentUser.mobile}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Contact support to change your mobile number
                      </p>
                    </div>

                    {/* User ID */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">User ID</Label>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <code className="text-xs text-muted-foreground break-all">
                          {currentUser.id}
                        </code>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Notification Settings */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <NotificationSettings userId={currentUser.id} />
              </motion.div>
            </div>
          </div>
        </div>
      </main>

      {/* Avatar Selection Dialog */}
      <Dialog open={avatarDialogOpen} onOpenChange={setAvatarDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Choose Your Avatar</DialogTitle>
            <DialogDescription>
              Select an Avengers-themed avatar for your profile
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 py-4">
            {AVATARS.map((avatar) => (
              <button
                key={avatar.id}
                onClick={() => handleAvatarSelect(avatar.id)}
                className={`group relative flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all hover:scale-105 ${currentUser.profilePicture === avatar.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
                  }`}
              >
                <div className="w-16 h-16 rounded-full overflow-hidden shadow-lg bg-white">
                  <img
                    src={`/avatars/${avatar.id}.svg`}
                    alt={avatar.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-sm font-medium text-center">{avatar.name}</span>
                {currentUser.profilePicture === avatar.id && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Change Password Modal */}
      {
        currentUser && (
          <ChangePasswordModal
            open={changePasswordOpen}
            onOpenChange={setChangePasswordOpen}
            userId={currentUser.id}
          />
        )
      }
    </div >
  );
}
