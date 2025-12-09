import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Navbar } from "@/components/Navbar";
import { StatsCard } from "@/components/StatsCard";
import { FoodItemCard, FoodItem } from "@/components/FoodItemCard";
import { AddFoodModal, FoodFormData } from "@/components/AddFoodModal";
import { Button } from "@/components/ui/button";
import { Package, AlertCircle, XCircle, CheckCircle, Plus, LayoutGrid, List, Loader2, Info, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { safeLocalStorage } from "@/lib/storage";
import { API_BASE_URL } from "@/lib/api";

export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // All hooks must be at the top - before any conditional returns
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [filterStatus, setFilterStatus] = useState<"all" | "fresh" | "expiring" | "expired">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [showFreeNotification, setShowFreeNotification] = useState(true);
  const { toast } = useToast();

  // Helper function to calculate item status and days left
  const calculateItemStatus = (item: any): FoodItem => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiryDate = new Date(item.expiryDate);
    expiryDate.setHours(0, 0, 0, 0);

    const daysLeft = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    let status: "fresh" | "expiring" | "expired" = "fresh";
    if (daysLeft < 0) {
      status = "expired";
    } else if (daysLeft <= 3) {
      status = "expiring";
    }

    return {
      ...item,
      status,
      daysLeft,
    };
  };

  // Check authentication and load user's food items
  useEffect(() => {
    const loadUserData = async () => {
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

        // Fetch user's food items
        await fetchFoodItems(user.id);
      } catch (err) {
        safeLocalStorage.removeItem("user");
        setLocation("/auth?mode=login");
      }
    };

    loadUserData();
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

  // Fetch food items for the current user
  const fetchFoodItems = async (userId: string) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/food-items/${userId}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch food items");
      }

      const data = await response.json();
      const itemsWithStatus = data.items.map(calculateItemStatus);
      setFoodItems(itemsWithStatus);
    } catch (err) {
      console.error("Error fetching food items:", err);
      setError("Failed to load your food items. Please try refreshing the page.");
      setFoodItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    safeLocalStorage.removeItem("user");
    setIsAuthenticated(false);
    setCurrentUser(null);
    setLocation("/");
  };

  // Show loading or nothing while checking auth
  if (!isAuthenticated) {
    return null;
  }

  const handleSaveFood = async (data: FoodFormData) => {
    if (!currentUser) return;

    try {
      if (editingItem) {
        // Update existing item
        const response = await fetch(`${API_BASE_URL}/api/food-items/${editingItem.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: currentUser.id,
            ...data,
          }),
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to update item");
        }

        const result = await response.json();
        const updatedItem = calculateItemStatus(result.item);

        setFoodItems(foodItems.map((item) =>
          item.id === editingItem.id ? updatedItem : item
        ));

        toast({
          title: "Updated!",
          description: "Food item updated successfully.",
        });

        setEditingItem(null);
      } else {
        // Add new item
        const response = await fetch(`${API_BASE_URL}/api/food-items`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: currentUser.id,
            ...data,
          }),
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to create item");
        }

        const result = await response.json();
        const newItem = calculateItemStatus(result.item);

        setFoodItems([...foodItems, newItem]);

        toast({
          title: "Added!",
          description: "Food item added to your inventory.",
        });
      }

      setModalOpen(false);
    } catch (err) {
      console.error("Error saving food item:", err);
      toast({
        title: "Error",
        description: "Failed to save food item. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditFood = (item: FoodItem) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleDeleteFood = async (item: FoodItem) => {
    if (!currentUser) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/food-items/${item.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to delete item");
      }

      setFoodItems(foodItems.filter((i) => i.id !== item.id));

      toast({
        title: "Deleted!",
        description: "Food item removed from your inventory.",
      });
    } catch (err) {
      console.error("Error deleting food item:", err);
      toast({
        title: "Error",
        description: "Failed to delete food item. Please try again.",
        variant: "destructive",
      });
    }
  };

  const stats = {
    total: foodItems.length,
    fresh: foodItems.filter((i) => i.status === "fresh").length,
    expiring: foodItems.filter((i) => i.status === "expiring").length,
    expired: foodItems.filter((i) => i.status === "expired").length,
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold">Food Inventory</h1>
              <p className="text-muted-foreground mt-1">Track and manage your food items</p>
            </div>
            <Button onClick={() => setModalOpen(true)} data-testid="button-add-food">
              <Plus className="h-5 w-5 mr-2" />
              Add Food Item
            </Button>
          </div>

         {stats.expiring > 0 && (
         <Alert 
          className="border-l-4 border-l-expiring bg-expiring/5 cursor-pointer hover:bg-expiring/10 transition-all duration-200"
          onClick={() => setFilterStatus("expiring")}
           >
           <AlertCircle className="h-5 w-5 text-expiring" />
      <AlertDescription className="text-sm font-medium">
      {(() => {
        const expiringItems = foodItems.filter(i => i.status === "expiring");
        if (expiringItems.length === 0) return null;
        
        const minDays = Math.min(...expiringItems.map(i => i.daysLeft));
        const maxDays = Math.max(...expiringItems.map(i => i.daysLeft));
        
        if (minDays === maxDays) {
          return (
            <>
              <span className="font-bold">{stats.expiring}</span> item{stats.expiring > 1 ? "s" : ""} expiring in{" "}
              <span className="font-bold text-expiring">{minDays}</span> day{minDays !== 1 ? "s" : ""}. 
              <span className="ml-1 underline">Click to view →</span>
            </>
          );
        } else {
          return (
            <>
              <span className="font-bold">{stats.expiring}</span> item{stats.expiring > 1 ? "s" : ""} expiring within{" "}
              <span className="font-bold text-expiring">{minDays}-{maxDays}</span> days. 
              <span className="ml-1 underline">Click to view →</span>
            </>
          );
          }
          })()}
          </AlertDescription>
          </Alert>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div onClick={() => setFilterStatus("all")} className="cursor-pointer hover:scale-105 transition-transform">
              <StatsCard title="Total Items" value={stats.total} icon={Package} variant="default" />
            </div>
            <div onClick={() => setFilterStatus("fresh")} className="cursor-pointer hover:scale-105 transition-transform">
              <StatsCard title="Fresh" value={stats.fresh} icon={CheckCircle} variant="fresh" />
            </div>
            <div onClick={() => setFilterStatus("expiring")} className="cursor-pointer hover:scale-105 transition-transform">
              <StatsCard title="Expiring Soon" value={stats.expiring} icon={AlertCircle} variant="expiring" />
            </div>
            <div onClick={() => setFilterStatus("expired")} className="cursor-pointer hover:scale-105 transition-transform">
              <StatsCard title="Expired" value={stats.expired} icon={XCircle} variant="expired" />
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Your Food Items</h2>
              {filterStatus !== "all" && (
                <p className="text-sm text-muted-foreground mt-1">
                  Showing <span className="font-bold capitalize text-primary">{filterStatus}</span> items
                  {" • "}
                  <button
                    onClick={() => setFilterStatus("all")}
                    className="text-primary hover:underline"
                  >
                    Clear filter
                  </button>
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("grid")}
                data-testid="button-view-grid"
              >
                <LayoutGrid className="h-5 w-5" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("list")}
                data-testid="button-view-list"
              >
                <List className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading your food inventory...</p>
            </div>
          ) : foodItems.length === 0 ? (
            <div className="text-center py-16">
              <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No food items yet</h3>
              <p className="text-muted-foreground mb-6">Add your first item to start tracking expiry dates</p>
              <Button onClick={() => setModalOpen(true)} data-testid="button-add-first-food">
                <Plus className="h-5 w-5 mr-2" />
                Add Food Item
              </Button>
            </div>
          ) : (
            <div className={viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "space-y-4"
            }>
              {foodItems
                .filter(item => filterStatus === "all" || item.status === filterStatus)
                .map((item) => (
                  <FoodItemCard
                    key={item.id}
                    item={item}
                    onEdit={handleEditFood}
                    onDelete={handleDeleteFood}
                  />
                ))}
            </div>
          )}
        </div>
      </main>

      <AddFoodModal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) {
            setEditingItem(null);
          }
        }}
        onSave={handleSaveFood}
        editData={editingItem ? {
          name: editingItem.name,
          category: editingItem.category,
          purchaseDate: editingItem.purchaseDate,
          expiryDate: editingItem.expiryDate,
        } : null}
      />
    </div>
  );
}
