import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { Navbar } from "@/components/Navbar";
import { StatsCard } from "@/components/StatsCard";
import { FoodItemCard, FoodItem } from "@/components/FoodItemCard";
import { AddFoodModal, FoodFormData } from "@/components/AddFoodModal";
import { AIRecipeModal } from "@/components/AIRecipeModal";
import { AIChefAssistant } from "@/components/AIChefAssistant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Package,
  AlertCircle,
  XCircle,
  CheckCircle,
  Plus,
  LayoutGrid,
  List,
  Search,
  Sparkles,
  ArrowUpDown,
  Filter,
  X,
  Info,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { safeLocalStorage } from "@/lib/storage";
import { API_BASE_URL } from "@/lib/api";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const CATEGORIES = [
  "All",
  "Dairy",
  "Fruits",
  "Vegetables",
  "Meat",
  "Seafood",
  "Grains",
  "Beverages",
  "Snacks",
  "Other",
];

export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize auth state
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const userStr = safeLocalStorage.getItem("user");
    return !!userStr;
  });

  const [currentUser, setCurrentUser] = useState<any>(() => {
    const userStr = safeLocalStorage.getItem("user");
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  });

  // State management
  const [modalOpen, setModalOpen] = useState(false);
  const [recipeModalOpen, setRecipeModalOpen] = useState(false);
  const [chefItemQuery, setChefItemQuery] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterStatus, setFilterStatus] = useState<"all" | "fresh" | "expiring" | "expired">("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"expiryAsc" | "expiryDesc" | "name" | "recent">("expiryAsc");
  const [showFreeNotification, setShowFreeNotification] = useState(true);

  // Auth guard
  useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      setLocation("/auth?mode=login");
    }
  }, []);

  // Fetch food items
  const { data: foodItemsData, isLoading, error } = useQuery({
    queryKey: ["foodItems", currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return { items: [] };

      try {
        const response = await fetch(`${API_BASE_URL}/api/dashboard/${currentUser.id}`, {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          return { items: data.items };
        }
      } catch (err) {
        console.log("Falling back to food-items endpoint");
      }

      const response = await fetch(`${API_BASE_URL}/api/food-items/${currentUser.id}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch food items");
      return response.json();
    },
    enabled: !!currentUser?.id,
    staleTime: 30000,
    gcTime: 300000,
    refetchOnWindowFocus: true,
  });

  const foodItems: FoodItem[] = foodItemsData?.items || [];

  useEffect(() => {
    const dismissed = safeLocalStorage.getItem("freeNotificationDismissed");
    if (dismissed === "true") setShowFreeNotification(false);
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

  // Add food mutation
  const addFoodMutation = useMutation({
    mutationFn: async (data: FoodFormData) => {
      const response = await fetch(`${API_BASE_URL}/api/food-items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser!.id, ...data }),
        credentials: "include",
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
        throw new Error(errorData.message || `Failed to add item (${response.status})`);
      }
      return response.json();
    },
    onMutate: async (newItem) => {
      await queryClient.cancelQueries({ queryKey: ["foodItems", currentUser?.id] });
      const previousData = queryClient.getQueryData(["foodItems", currentUser?.id]);
      queryClient.setQueryData(["foodItems", currentUser?.id], (old: any) => ({
        items: [...(old?.items || []), { ...newItem, id: "temp-" + Date.now(), status: "fresh", daysLeft: 7 }],
      }));
      return { previousData };
    },
    onError: (err, newItem, context) => {
      queryClient.setQueryData(["foodItems", currentUser?.id], context?.previousData);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to add food item.",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["foodItems", currentUser?.id] });
      toast({ title: "Item Added", description: "Food item saved to your inventory." });
    },
  });

  // Update food mutation
  const updateFoodMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: FoodFormData }) => {
      const response = await fetch(`${API_BASE_URL}/api/food-items/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser!.id, ...data }),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to update item");
      return response.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["foodItems", currentUser?.id] });
      await queryClient.refetchQueries({ queryKey: ["foodItems", currentUser?.id] });
      toast({ title: "Updated", description: "Food item updated successfully." });
    },
    onError: (err) => {
      toast({
        title: "Error",
        description: "Failed to update food item.",
        variant: "destructive",
      });
    },
  });

  // Delete food mutation
  const deleteFoodMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const userId = currentUser?.id || "";
      const response = await fetch(`${API_BASE_URL}/api/food-items/${itemId}?userId=${encodeURIComponent(userId)}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify({ userId }),
        credentials: "include",
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to delete item");
      }
      return response.json();
    },
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: ["foodItems", currentUser?.id] });
      const previousData = queryClient.getQueryData(["foodItems", currentUser?.id]);
      queryClient.setQueryData(["foodItems", currentUser?.id], (old: any) => ({
        items: (old?.items || []).filter((item: any) => item.id !== itemId),
      }));
      return { previousData };
    },
    onError: (err: any, itemId, context) => {
      queryClient.setQueryData(["foodItems", currentUser?.id], context?.previousData);
      toast({
        title: "Delete Failed",
        description: err?.message || "Failed to delete food item.",
        variant: "destructive",
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["foodItems", currentUser?.id] });
      await queryClient.refetchQueries({ queryKey: ["foodItems", currentUser?.id] });
      toast({ title: "Deleted", description: "Item removed from inventory." });
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
      console.error("Error saving food:", err);
    }
  };

  // Filter & Search Calculations
  const { stats, filteredItems } = useMemo(() => {
    const total = foodItems.length;
    const fresh = foodItems.filter((i) => i.status === "fresh").length;
    const expiring = foodItems.filter((i) => i.status === "expiring").length;
    const expired = foodItems.filter((i) => i.status === "expired").length;

    let result = [...foodItems];

    // Status filter
    if (filterStatus !== "all") {
      result = result.filter((i) => i.status === filterStatus);
    }

    // Category filter
    if (selectedCategory !== "All") {
      result = result.filter(
        (i) => i.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q) ||
          (i.notes && i.notes.toLowerCase().includes(q))
      );
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "expiryAsc") return a.daysLeft - b.daysLeft;
      if (sortBy === "expiryDesc") return b.daysLeft - a.daysLeft;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "recent") {
        return new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime();
      }
      return 0;
    });

    return {
      stats: { total, fresh, expiring, expired },
      filteredItems: result,
    };
  }, [foodItems, filterStatus, selectedCategory, searchQuery, sortBy]);

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar
        isAuthenticated={isAuthenticated}
        onLogoutClick={handleLogout}
        onOpenRecipes={() => setRecipeModalOpen(true)}
      />

      <main className="flex-1 pb-20">
        {/* Banner */}
        {showFreeNotification && (
          <div className="bg-primary/5 border-b border-primary/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
              <div className="flex items-center justify-between gap-3 text-xs sm:text-sm">
                <div className="flex items-center gap-2 text-muted-foreground min-w-0">
                  <Info className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="truncate">
                    <strong className="text-foreground">Food Reminder AI Active</strong> — Track expiration, get smart notifications, and discover zero-waste recipes.
                  </span>
                </div>
                <button
                  onClick={handleDismissFreeNotification}
                  className="text-muted-foreground hover:text-foreground flex-shrink-0"
                  aria-label="Dismiss banner"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Header & Quick Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Food Inventory
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Organize, track freshness, and cook sustainably.
              </p>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-xs h-9 rounded-xl border-primary/25 hover:bg-primary/10 text-primary flex-1 sm:flex-initial"
                onClick={() => setRecipeModalOpen(true)}
              >
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                AI Recipes
                {stats.expiring > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold">
                    {stats.expiring}
                  </span>
                )}
              </Button>

              <Button
                size="sm"
                onClick={() => {
                  setEditingItem(null);
                  setModalOpen(true);
                }}
                className="gap-1.5 text-xs h-9 rounded-xl flex-1 sm:flex-initial"
                data-testid="button-add-food"
              >
                <Plus className="h-4 w-4" />
                Add Food
              </Button>
            </div>
          </div>

          {/* Expiring Alert Banner */}
          {stats.expiring > 0 && (
            <Alert
              className="border border-amber-500/30 bg-amber-500/5 cursor-pointer hover:bg-amber-500/10 transition-all rounded-xl py-3"
              onClick={() => setFilterStatus("expiring")}
            >
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertDescription className="text-xs sm:text-sm font-medium flex items-center justify-between flex-wrap gap-2">
                <span>
                  <strong>{stats.expiring} item{stats.expiring > 1 ? "s" : ""}</strong> expiring within the next 3 days.
                </span>
                <span className="text-amber-600 dark:text-amber-400 font-semibold hover:underline">
                  Filter expiring items →
                </span>
              </AlertDescription>
            </Alert>
          )}

          {/* Metric Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div onClick={() => setFilterStatus("all")} className="cursor-pointer">
              <StatsCard
                title="Total Stored"
                value={stats.total}
                icon={Package}
                variant="default"
                active={filterStatus === "all"}
              />
            </div>
            <div onClick={() => setFilterStatus("fresh")} className="cursor-pointer">
              <StatsCard
                title="Fresh"
                value={stats.fresh}
                icon={CheckCircle}
                variant="fresh"
                active={filterStatus === "fresh"}
              />
            </div>
            <div onClick={() => setFilterStatus("expiring")} className="cursor-pointer">
              <StatsCard
                title="Expiring Soon"
                value={stats.expiring}
                icon={AlertCircle}
                variant="expiring"
                active={filterStatus === "expiring"}
              />
            </div>
            <div onClick={() => setFilterStatus("expired")} className="cursor-pointer">
              <StatsCard
                title="Expired"
                value={stats.expired}
                icon={XCircle}
                variant="expired"
                active={filterStatus === "expired"}
              />
            </div>
          </div>

          {/* Modern Search, Filter & View Controls */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search food, notes, or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-xs rounded-xl bg-card border-border/60"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Sort & View Mode */}
              <div className="flex items-center gap-2 self-end md:self-auto">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-card border border-border/60 rounded-xl px-2.5 h-9">
                  <ArrowUpDown className="h-3.5 w-3.5" />
                  <select
                    value={sortBy}
                    onChange={(e: any) => setSortBy(e.target.value)}
                    className="bg-transparent text-xs text-foreground focus:outline-hidden cursor-pointer"
                  >
                    <option value="expiryAsc">Expiring Soonest</option>
                    <option value="expiryDesc">Expiring Latest</option>
                    <option value="name">Name (A-Z)</option>
                    <option value="recent">Recently Added</option>
                  </select>
                </div>

                <div className="flex items-center border border-border/60 rounded-xl p-0.5 bg-card">
                  <Button
                    variant={viewMode === "grid" ? "secondary" : "ghost"}
                    size="icon"
                    className="h-8 w-8 rounded-lg"
                    onClick={() => setViewMode("grid")}
                    data-testid="button-view-grid"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "secondary" : "ghost"}
                    size="icon"
                    className="h-8 w-8 rounded-lg"
                    onClick={() => setViewMode("list")}
                    data-testid="button-view-list"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-lg transition-colors whitespace-nowrap font-medium ${
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Filter Indicators */}
          {(filterStatus !== "all" || selectedCategory !== "All" || searchQuery) && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Showing filtered results:</span>
              {filterStatus !== "all" && (
                <span className="font-semibold text-foreground capitalize">
                  {filterStatus}
                </span>
              )}
              {selectedCategory !== "All" && (
                <span className="font-semibold text-foreground">
                  • {selectedCategory}
                </span>
              )}
              {searchQuery && (
                <span className="font-semibold text-foreground">
                  • "{searchQuery}"
                </span>
              )}
              <button
                onClick={() => {
                  setFilterStatus("all");
                  setSelectedCategory("All");
                  setSearchQuery("");
                }}
                className="ml-2 text-primary hover:underline text-xs"
              >
                Reset filters
              </button>
            </div>
          )}

          {error && (
            <Alert variant="destructive" className="rounded-xl">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                {error instanceof Error ? error.message : "Failed to load food inventory."}
              </AlertDescription>
            </Alert>
          )}

          {/* Main Grid / List / Empty View */}
          {isLoading ? (
            <DashboardSkeleton />
          ) : foodItems.length === 0 ? (
            <div className="text-center py-20 border rounded-2xl bg-card/40 border-dashed">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                <Package className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-semibold mb-1">Your inventory is empty</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-6">
                Start tracking your groceries, get expiry alerts on WhatsApp & Telegram, and prevent food waste with AI recipes.
              </p>
              <Button
                onClick={() => {
                  setEditingItem(null);
                  setModalOpen(true);
                }}
                className="gap-2 text-xs h-9 rounded-xl"
                data-testid="button-add-first-food"
              >
                <Plus className="h-4 w-4" />
                Add Your First Item
              </Button>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-16 border rounded-2xl bg-card/40">
              <Search className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-base font-semibold">No matching food items</h3>
              <p className="text-xs text-muted-foreground mt-1 mb-4">
                Try adjusting your search query or category filters.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFilterStatus("all");
                  setSelectedCategory("All");
                  setSearchQuery("");
                }}
                className="text-xs h-8 rounded-lg"
              >
                Clear all filters
              </Button>
            </div>
          ) : (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5"
                  : "space-y-2.5"
              }
            >
              {filteredItems.map((item) => (
                <FoodItemCard
                  key={item.id}
                  item={item}
                  layout={viewMode}
                  onEdit={(it) => {
                    setEditingItem(it);
                    setModalOpen(true);
                  }}
                  onDelete={(it) => deleteFoodMutation.mutate(it.id)}
                  onAskChef={(it) => setChefItemQuery(it.name)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Add / Edit Food Modal */}
      <AddFoodModal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setEditingItem(null);
        }}
        onSave={handleSaveFood}
        editData={
          editingItem
            ? {
                name: editingItem.name,
                category: editingItem.category,
                purchaseDate: editingItem.purchaseDate,
                expiryDate: editingItem.expiryDate,
                quantity: editingItem.quantity || undefined,
                notes: editingItem.notes || undefined,
                barcode: editingItem.barcode || undefined,
              }
            : null
        }
      />

      {/* AI Recipe Modal */}
      <AIRecipeModal
        open={recipeModalOpen}
        onOpenChange={setRecipeModalOpen}
        userId={currentUser?.id}
        foodItems={foodItems.map((i) => ({
          name: i.name,
          category: i.category,
          daysLeft: i.daysLeft,
          quantity: i.quantity,
        }))}
      />

      {/* Interactive AI Chef Floating Assistant */}
      <AIChefAssistant
        userId={currentUser?.id}
        inventory={foodItems.map((i) => ({ name: i.name, daysLeft: i.daysLeft }))}
        initialItemQuery={chefItemQuery}
        onClearInitialQuery={() => setChefItemQuery(null)}
      />
    </div>
  );
}
