import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, Phone, Calendar, LogOut, ArrowLeft, KeyRound, Edit2, Check, X, Camera, Upload, Copy, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ChangePasswordModal } from "@/components/ChangePasswordModal";
import { NotificationSettings } from "@/components/NotificationSettings";
import { safeLocalStorage } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL } from "@/lib/api";
import { BouncingFoodLoader } from "@/components/FoodLoader";
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
  const [uploadingImage, setUploadingImage] = useState(false);
  const [copiedUserId, setCopiedUserId] = useState(false);

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

  const handleCustomImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image size should be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploadingImage(true);
    try {
      // Convert image to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;

        const response = await fetch(`${API_BASE_URL}/api/auth/update-profile`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: currentUser.id,
            profilePicture: base64String,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to upload image");
        }

        // Update local storage and state
        safeLocalStorage.setItem("user", JSON.stringify(data.user));
        setCurrentUser(data.user);
        setAvatarDialogOpen(false);

        toast({
          title: "Success!",
          description: "Profile picture updated successfully",
        });
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const getAvatarGradient = () => {
    const profilePic = currentUser?.profilePicture;
    // If it's a custom uploaded image (base64) or not in lists
    if (profilePic && profilePic.startsWith('data:image')) {
      return "from-violet-500 to-fuchsia-600";
    }
    const avatar = AVATARS.find((a) => a.id === profilePic);
    return avatar ? avatar.color : "from-slate-400 to-slate-600";
  };

  const getAvatarUrl = () => {
    const profilePic = currentUser?.profilePicture;

    // Safety check
    if (!profilePic) {
      return "/avatars/default.svg";
    }

    // Check if it's a base64 image (custom upload)
    if (profilePic.startsWith('data:image')) {
      return profilePic;
    }

    // Check if it's a valid preset ID
    const isPreset = AVATARS.some(a => a.id === profilePic);
    if (isPreset) {
      return `/avatars/${profilePic}.svg`;
    }

    // Default fallback
    return "/avatars/default.svg";
  };

  const getUserDisplayId = () => {
    if (!currentUser) return "";
    // Create a formatted user ID like "username#1234"
    const hashPart = currentUser.id.slice(0, 8).toUpperCase();
    return `${currentUser.username}#${hashPart}`;
  };

  const copyUserId = () => {
    if (!currentUser) return;
    navigator.clipboard.writeText(getUserDisplayId());
    setCopiedUserId(true);
    toast({
      title: "Copied!",
      description: "User ID copied to clipboard",
    });
    setTimeout(() => setCopiedUserId(false), 2000);
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
              <Card className="overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
                <div className={`h-40 bg-gradient-to-br ${getAvatarGradient()} relative`}>
                  <div className="absolute inset-0 bg-black/10" />
                  <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/30 to-transparent" />
                </div>
                <CardContent className="pt-0 pb-8">
                  <div className="flex flex-col items-center -mt-20">
                    {/* Avatar */}
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-purple-500/30 rounded-full blur-xl group-hover:blur-2xl transition-all" />
                      <div className="relative w-32 h-32 rounded-full border-4 border-white dark:border-slate-900 shadow-2xl overflow-hidden bg-white">
                        <img
                          src={getAvatarUrl()}
                          alt="Profile"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            // Prevent infinite loop by checking if we're already trying to load the default
                            if (!target.src.includes('default.svg')) {
                              target.src = '/avatars/default.svg';
                            }
                          }}
                        />
                      </div>
                      <button
                        onClick={() => setAvatarDialogOpen(true)}
                        className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center transition-all hover:scale-110 hover:shadow-xl"
                      >
                        <Camera className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Name */}
                    <h2 className="mt-6 text-2xl font-bold text-foreground tracking-tight">
                      {currentUser.username}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">{currentUser.email}</p>

                    {/* User ID Badge */}
                    <div className="mt-3 flex items-center gap-2">
                      <div className="px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border border-purple-100 dark:border-purple-900">
                        <span className="text-xs font-mono font-semibold text-purple-700 dark:text-purple-300">
                          {getUserDisplayId()}
                        </span>
                      </div>
                      <button
                        onClick={copyUserId}
                        className="p-1.5 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors group"
                        title="Copy User ID"
                      >
                        {copiedUserId ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform" />
                        )}
                      </button>
                    </div>

                    {/* Member Since */}
                    {currentUser.createdAt && (
                      <div className="mt-4 flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-100 dark:border-blue-900">
                        <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                          Member since {formatDate(currentUser.createdAt)}
                        </span>
                      </div>
                    )}

                    {/* Quick Actions */}
                    <div className="w-full mt-8 space-y-3">
                      <Button
                        variant="outline"
                        onClick={() => setChangePasswordOpen(true)}
                        className="w-full justify-start hover:bg-slate-100 dark:hover:bg-slate-800 transition-all hover:shadow-md group"
                      >
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 mr-3 group-hover:bg-primary/20 transition-colors">
                          <KeyRound className="w-4 h-4 text-primary" />
                        </div>
                        <span>Change Password</span>
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleLogout}
                        className="w-full justify-start hover:shadow-md transition-all group"
                      >
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/20 mr-3 group-hover:bg-white/30 transition-colors">
                          <LogOut className="w-4 h-4" />
                        </div>
                        <span>Sign Out</span>
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
                      <div className="flex items-center gap-2">
                        <div className="flex-1 p-3 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border border-purple-100 dark:border-purple-900">
                          <code className="text-sm font-mono font-semibold text-purple-700 dark:text-purple-300">
                            {getUserDisplayId()}
                          </code>
                        </div>
                        <button
                          onClick={copyUserId}
                          className="p-3 rounded-lg border border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-all group"
                          title="Copy User ID"
                        >
                          {copiedUserId ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                          ) : (
                            <Copy className="w-5 h-5 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform" />
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Your unique identifier for support and sharing
                      </p>
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
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center">Customize Profile Picture</DialogTitle>
            <DialogDescription className="text-center">
              Upload your own photo or choose from our gallery
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            {/* Custom Upload Section */}
            <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-primary/50 transition-colors">
              <div className="flex flex-col items-center gap-3">
                <div className="bg-primary/10 p-4 rounded-full">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <div className="text-center space-y-1">
                  <h3 className="font-semibold text-foreground">Upload Custom Photo</h3>
                  <p className="text-xs text-muted-foreground">Supports PNG, JPG (max 5MB)</p>
                </div>


                {/* Mobile-Friendly File Input */}
                <label
                  htmlFor="profile-upload-input"
                  className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6 py-2 mt-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ pointerEvents: uploadingImage ? 'none' : 'auto' }}
                >
                  {uploadingImage ? (
                    <>
                      <BouncingFoodLoader size="sm" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <span>Choose from Device</span>
                  )}
                </label>
                <input
                  id="profile-upload-input"
                  type="file"
                  accept="image/*"
                  onChange={handleCustomImageUpload}
                  disabled={uploadingImage}
                  className="hidden"
                  aria-label="Upload profile picture"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground font-medium">Or Select Avatar</span>
                </div>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 sm:gap-4">
                {AVATARS.map((avatar) => (
                  <button
                    key={avatar.id}
                    onClick={() => handleAvatarSelect(avatar.id)}
                    className={`group relative flex flex-col items-center gap-2 p-2 rounded-xl transition-all duration-200 ${currentUser.profilePicture === avatar.id
                      ? "ring-2 ring-primary bg-primary/5 scale-105"
                      : "hover:bg-slate-100 dark:hover:bg-slate-800 hover:scale-105"
                      }`}
                  >
                    <div className="relative w-14 h-14 rounded-full overflow-hidden shadow-sm bg-white ring-1 ring-slate-100 dark:ring-slate-800">
                      <img
                        src={`/avatars/${avatar.id}.svg`}
                        alt={avatar.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (!target.src.includes('default.svg')) {
                            target.src = '/avatars/default.svg';
                          }
                        }}
                      />
                    </div>
                    <span className="text-[10px] font-medium text-center truncate w-full px-1">
                      {avatar.name}
                    </span>
                    {currentUser.profilePicture === avatar.id && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-sm z-10">
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
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
