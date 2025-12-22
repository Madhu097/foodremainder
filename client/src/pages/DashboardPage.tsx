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
import { DashboardSkeleton } from "@/components/DashboardSkeleton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // All hooks must be at the top - before any conditional returns
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterStatus, setFilterStatus] = useState<"all" | "fresh" | "expiring" | "expired">("all");
  const [showFreeNotification, setShowFreeNotification] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  // Check authentication
  useEffect(() => {
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

  // Fetch food items using React Query for automatic caching and background refresh
  // Using optimized batch endpoint that fetches everything in one request
  const { data: foodItemsData, isLoading, error, refetch } = useQuery({
    queryKey: ['foodItems', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return { items: [] };
      
      // Try the optimized batch endpoint first
      try {
        const response = await fetch(`${API_BASE_URL}/api/dashboard/${currentUser.id}`, {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          return { items: data.items }; // Return just items for compatibility
        }
      } catch (err) {
        console.log("Batch endpoint not available, falling back to individual endpoint");
      }

      // Fallback to individual endpoint
      const response = await fetch(`${API_BASE_URL}/api/food-items/${currentUser.id}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch food items");
      }

      return response.json();
    },
    enabled: !!currentUser?.id,
    staleTime: 60000, // Cache for 1 minute
    gcTime: 300000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchOnMount: false, // Don't refetch on mount if data is fresh
    refetchOnReconnect: true, // Refetch when reconnecting to internet
  });

  // Server now returns items with status pre-calculated
  const foodItems = foodItemsData?.items || [];

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

  // Show loading or nothing while checking auth
  if (!isAuthenticated) {
    return null;
  }

  // Create mutation for adding food items with optimistic updates
  const addFoodMutation = useMutation({
    mutationFn: async (data: FoodFormData) => {
      const response = await fetch(`${API_BASE_URL}/api/food-items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser!.id,
          ...data,
        }),
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to add item");
      return response.json();
    },
    onMutate: async (newItem) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['foodItems', currentUser?.id] });

      // Optimistically update the cache
      const previousData = queryClient.getQueryData(['foodItems', currentUser?.id]);
      
      queryClient.setQueryData(['foodItems', currentUser?.id], (old: any) => ({
        items: [...(old?.items || []), { ...newItem, id: 'temp-' + Date.now() }]
      }));

      return { previousData };
    },
    onError: (err, newItem, context) => {
      // Rollback on error
      queryClient.setQueryData(['foodItems', currentUser?.id], context?.previousData);
      toast({
        title: "Error",
        description: "Failed to add food item. Please try again.",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foodItems', currentUser?.id] });
      toast({
        title: "Added!",
        description: "Food item added to your inventory.",
      });
    },
  });

  // Create mutation for updating food items
  const updateFoodMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: FoodFormData }) => {
      const response = await fetch(`${API_BASE_URL}/api/food-items/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser!.id,
          ...data,
        }),
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to update item");
      return response.json();
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['foodItems', currentUser?.id] });
      
      const previousData = queryClient.getQueryData(['foodItems', currentUser?.id]);
      
      queryClient.setQueryData(['foodItems', currentUser?.id], (old: any) => ({
        items: (old?.items || []).map((item: any) => 
          item.id === id ? { ...item, ...data } : item
        )
      }));

      return { previousData };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['foodItems', currentUser?.id], context?.previousData);
      toast({
        title: "Error",
        description: "Failed to update food item. Please try again.",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foodItems', currentUser?.id] });
      toast({
        title: "Updated!",
        description: "Food item updated successfully.",
      });
    },
  });

  const handleSaveFood = async (data: FoodFormData) => {
    if (!currentUser) return;

    try {
      if (editingItem) {
        await updateFoodMutation.mutateAsync({ id: editingItem.id, data });
      } else {
        await addFoodMutation.mutateAsync(data);
      }

      setModalOpen(false);
      setEditingItem(null);
    } catch (err) {
      console.error("Error saving food item:", err);
    }
  };

  const handleEditFood = (item: FoodItem) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  // Create mutation for deleting food items
  const deleteFoodMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const response = await fetch(`${API_BASE_URL}/api/food-items/${itemId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser!.id }),
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to delete item");
      return response.json();
    },
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: ['foodItems', currentUser?.id] });
      
      const previousData = queryClient.getQueryData(['foodItems', currentUser?.id]);
      
      queryClient.setQueryData(['foodItems', currentUser?.id], (old: any) => ({
        items: (old?.items || []).filter((item: any) => item.id !== itemId)
      }));

      return { previousData };
    },
    onError: (err, itemId, context) => {
      queryClient.setQueryData(['foodItems', currentUser?.id], context?.previousData);
      toast({
        title: "Error",
        description: "Failed to delete food item. Please try again.",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foodItems', currentUser?.id] });
      toast({
        title: "Deleted!",
        description: "Food item removed from your inventory.",
      });
    },
  });

  const handleDeleteFood = async (item: FoodItem) => {
    if (!currentUser) return;
    try {
      await deleteFoodMutation.mutateAsync(item.id);
    } catch (err) {
      console.error("Error deleting food item:", err);
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

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
              <AlertDescription>
                {error instanceof Error ? error.message : "Failed to load your food items. Please try refreshing the page."}
              </AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <DashboardSkeleton />
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
