import { useState } from "react";
import { useLocation } from "wouter";
import { Navbar } from "@/components/Navbar";
import { StatsCard } from "@/components/StatsCard";
import { FoodItemCard, FoodItem } from "@/components/FoodItemCard";
import { AddFoodModal, FoodFormData } from "@/components/AddFoodModal";
import { Button } from "@/components/ui/button";
import { Package, AlertCircle, XCircle, CheckCircle, Plus, LayoutGrid, List } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  
  //todo: remove mock functionality
  const [foodItems, setFoodItems] = useState<FoodItem[]>([
    {
      id: "1",
      name: "Fresh Milk",
      category: "Dairy",
      purchaseDate: "2025-10-05",
      expiryDate: "2025-10-15",
      status: "fresh",
      daysLeft: 5,
    },
    {
      id: "2",
      name: "Strawberries",
      category: "Fruits",
      purchaseDate: "2025-10-08",
      expiryDate: "2025-10-12",
      status: "expiring",
      daysLeft: 2,
    },
    {
      id: "3",
      name: "Chicken Breast",
      category: "Meat",
      purchaseDate: "2025-10-07",
      expiryDate: "2025-10-13",
      status: "expiring",
      daysLeft: 3,
    },
    {
      id: "4",
      name: "Greek Yogurt",
      category: "Dairy",
      purchaseDate: "2025-10-01",
      expiryDate: "2025-10-09",
      status: "expired",
      daysLeft: -1,
    },
    {
      id: "5",
      name: "Cheddar Cheese",
      category: "Dairy",
      purchaseDate: "2025-10-03",
      expiryDate: "2025-10-20",
      status: "fresh",
      daysLeft: 10,
    },
    {
      id: "6",
      name: "Bread",
      category: "Grains",
      purchaseDate: "2025-10-09",
      expiryDate: "2025-10-14",
      status: "fresh",
      daysLeft: 4,
    },
  ]);

  const handleSaveFood = (data: FoodFormData) => {
    const purchaseDate = new Date(data.purchaseDate);
    const expiryDate = new Date(data.expiryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const daysLeft = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    let status: "fresh" | "expiring" | "expired" = "fresh";
    if (daysLeft < 0) {
      status = "expired";
    } else if (daysLeft <= 3) {
      status = "expiring";
    }

    if (editingItem) {
      // Update existing item
      const updatedItem: FoodItem = {
        ...editingItem,
        ...data,
        status,
        daysLeft,
      };
      setFoodItems(foodItems.map((item) => 
        item.id === editingItem.id ? updatedItem : item
      ));
      console.log("Updated food item:", updatedItem);
      setEditingItem(null);
    } else {
      // Add new item
      const newItem: FoodItem = {
        id: Date.now().toString(),
        ...data,
        status,
        daysLeft,
      };
      setFoodItems([...foodItems, newItem]);
      console.log("Added new food item:", newItem);
    }
  };

  const handleEditFood = (item: FoodItem) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleDeleteFood = (item: FoodItem) => {
    setFoodItems(foodItems.filter((i) => i.id !== item.id));
    console.log("Deleted food item:", item);
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
        isAuthenticated={true}
        onLogoutClick={() => {
          console.log("Logout clicked");
          setLocation("/");
        }}
      />

      <main className="flex-1">
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
            <Alert className="border-l-4 border-l-expiring bg-expiring/5">
              <AlertCircle className="h-5 w-5 text-expiring" />
              <AlertDescription className="text-sm font-medium">
                <span className="font-bold">{stats.expiring}</span> item{stats.expiring > 1 ? "s" : ""} expiring within the next 3 days. Review now to avoid waste!
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard title="Total Items" value={stats.total} icon={Package} variant="default" />
            <StatsCard title="Fresh" value={stats.fresh} icon={CheckCircle} variant="fresh" />
            <StatsCard title="Expiring Soon" value={stats.expiring} icon={AlertCircle} variant="expiring" />
            <StatsCard title="Expired" value={stats.expired} icon={XCircle} variant="expired" />
          </div>

          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Your Food Items</h2>
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

          {foodItems.length === 0 ? (
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
              {foodItems.map((item) => (
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
