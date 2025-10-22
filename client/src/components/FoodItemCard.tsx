import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Apple, Milk, Carrot, Beef, Fish, Wheat, Coffee, Cookie, Salad } from "lucide-react";

export interface FoodItem {
  id: string;
  name: string;
  category: string;
  purchaseDate: string;
  expiryDate: string;
  status: "fresh" | "expiring" | "expired";
  daysLeft: number;
}

interface FoodItemCardProps {
  item: FoodItem;
  onEdit?: (item: FoodItem) => void;
  onDelete?: (item: FoodItem) => void;
}

export function FoodItemCard({ item, onEdit, onDelete }: FoodItemCardProps) {
  const statusConfig = {
    fresh: {
      color: "bg-fresh/10 text-fresh border-fresh",
      borderColor: "border-l-fresh",
      dotColor: "bg-fresh",
    },
    expiring: {
      color: "bg-expiring/10 text-expiring border-expiring",
      borderColor: "border-l-expiring",
      dotColor: "bg-expiring",
    },
    expired: {
      color: "bg-expired/10 text-expired border-expired",
      borderColor: "border-l-expired",
      dotColor: "bg-expired",
    },
  };

  const config = statusConfig[item.status];

  // Get category-specific icon and color
  const getCategoryIcon = () => {
    const category = item.category.toLowerCase();
    
    switch (category) {
      case "dairy":
        return { Icon: Milk, color: "bg-blue-100 dark:bg-blue-900/20", iconColor: "text-blue-600 dark:text-blue-400" };
      case "fruits":
        return { Icon: Apple, color: "bg-red-100 dark:bg-red-900/20", iconColor: "text-red-600 dark:text-red-400" };
      case "vegetables":
        return { Icon: Carrot, color: "bg-orange-100 dark:bg-orange-900/20", iconColor: "text-orange-600 dark:text-orange-400" };
      case "meat":
        return { Icon: Beef, color: "bg-rose-100 dark:bg-rose-900/20", iconColor: "text-rose-600 dark:text-rose-400" };
      case "seafood":
        return { Icon: Fish, color: "bg-cyan-100 dark:bg-cyan-900/20", iconColor: "text-cyan-600 dark:text-cyan-400" };
      case "grains":
        return { Icon: Wheat, color: "bg-amber-100 dark:bg-amber-900/20", iconColor: "text-amber-600 dark:text-amber-400" };
      case "beverages":
        return { Icon: Coffee, color: "bg-brown-100 dark:bg-brown-900/20", iconColor: "text-brown-600 dark:text-brown-400" };
      case "snacks":
        return { Icon: Cookie, color: "bg-yellow-100 dark:bg-yellow-900/20", iconColor: "text-yellow-600 dark:text-yellow-400" };
      default:
        return { Icon: Salad, color: "bg-green-100 dark:bg-green-900/20", iconColor: "text-green-600 dark:text-green-400" };
    }
  };

  const { Icon: CategoryIcon, color: iconBgColor, iconColor } = getCategoryIcon();

  const getDaysLeftText = () => {
    if (item.status === "expired") {
      return `Expired ${Math.abs(item.daysLeft)} day${Math.abs(item.daysLeft) === 1 ? "" : "s"} ago`;
    }
    return `Expires in ${item.daysLeft} day${item.daysLeft === 1 ? "" : "s"}`;
  };

  return (
    <Card className={`border-l-4 ${config.borderColor} hover-elevate group relative`} data-testid={`card-food-item-${item.id}`}>
      <div className={`absolute top-3 right-3 h-3 w-3 rounded-full ${config.dotColor}`}></div>
      
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className={`h-12 w-12 ${iconBgColor} rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110`}>
              <CategoryIcon className={`h-6 w-6 ${iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate" data-testid={`text-food-name-${item.id}`}>
                {item.name}
              </h3>
              <Badge variant="outline" className="mt-1" data-testid={`badge-category-${item.id}`}>
                {item.category}
              </Badge>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Purchase Date:</span>
              <span className="font-medium">{new Date(item.purchaseDate).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Expiry Date:</span>
              <span className="font-medium">{new Date(item.expiryDate).toLocaleDateString()}</span>
            </div>
          </div>

          <div className={`p-3 rounded-lg ${config.color} border text-center font-medium`}>
            {getDaysLeftText()}
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onEdit?.(item)}
              data-testid={`button-edit-${item.id}`}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onDelete?.(item)}
              data-testid={`button-delete-${item.id}`}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
