import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Apple, Milk, Carrot, Beef, Fish, Wheat, Coffee, Cookie, Salad, Calendar, Package as PackageIcon, StickyNote } from "lucide-react";

export interface FoodItem {
  id: string;
  name: string;
  category: string;
  purchaseDate: string;
  expiryDate: string;
  quantity?: string | null;
  notes?: string | null;
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
      color: "bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800",
      borderColor: "border-l-green-500",
      dotColor: "bg-green-500",
    },
    expiring: {
      color: "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
      borderColor: "border-l-amber-500",
      dotColor: "bg-amber-500",
    },
    expired: {
      color: "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800",
      borderColor: "border-l-red-500",
      dotColor: "bg-red-500",
    },
  };

  const config = statusConfig[item.status];

  // Get category-specific icon and color
  const getCategoryIcon = () => {
    const category = item.category.toLowerCase();

    switch (category) {
      case "dairy":
        return { Icon: Milk, color: "bg-blue-100 dark:bg-blue-900/30", iconColor: "text-blue-600 dark:text-blue-400" };
      case "fruits":
        return { Icon: Apple, color: "bg-red-100 dark:bg-red-900/30", iconColor: "text-red-600 dark:text-red-400" };
      case "vegetables":
        return { Icon: Carrot, color: "bg-orange-100 dark:bg-orange-900/30", iconColor: "text-orange-600 dark:text-orange-400" };
      case "meat":
        return { Icon: Beef, color: "bg-rose-100 dark:bg-rose-900/30", iconColor: "text-rose-600 dark:text-rose-400" };
      case "seafood":
        return { Icon: Fish, color: "bg-cyan-100 dark:bg-cyan-900/30", iconColor: "text-cyan-600 dark:text-cyan-400" };
      case "grains":
        return { Icon: Wheat, color: "bg-amber-100 dark:bg-amber-900/30", iconColor: "text-amber-600 dark:text-amber-400" };
      case "beverages":
        return { Icon: Coffee, color: "bg-purple-100 dark:bg-purple-900/30", iconColor: "text-purple-600 dark:text-purple-400" };
      case "snacks":
        return { Icon: Cookie, color: "bg-yellow-100 dark:bg-yellow-900/30", iconColor: "text-yellow-600 dark:text-yellow-400" };
      default:
        return { Icon: Salad, color: "bg-green-100 dark:bg-green-900/30", iconColor: "text-green-600 dark:text-green-400" };
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
    <Card
     className={`border-l-4 ${config.borderColor} hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 h-full group cursor-pointer`}
      data-testid={`card-food-item-${item.id}`}
    >
      {/* Status Dot */}
     <div className={`absolute top-3 right-3 h-2.5 w-2.5 rounded-full ${config.dotColor} animate-pulse`} />
      <CardContent className="p-5">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start gap-3">
           <div className={`h-12 w-12 ${iconBgColor} rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300`}>
              <CategoryIcon className={`h-6 w-6 ${iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate" data-testid={`text-food-name-${item.id}`}>
                {item.name}
              </h3>
              <Badge variant="outline" className="mt-1 text-xs" data-testid={`badge-category-${item.id}`}>
                {item.category}
              </Badge>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-2.5 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="text-xs">Purchase: {new Date(item.purchaseDate).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="text-xs">Expiry: {new Date(item.expiryDate).toLocaleDateString()}</span>
            </div>

            {item.quantity && (
              <div className="flex items-center gap-2 p-2 rounded-md bg-primary/10 border border-primary/20">
                <PackageIcon className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                <span className="text-xs font-medium">Qty: {item.quantity}</span>
              </div>
            )}

            {item.notes && (
              <div className="flex items-start gap-2 p-2 rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                <StickyNote className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700 dark:text-blue-300 italic">{item.notes}</p>
              </div>
            )}
          </div>

          {/* Status Badge */}
          <div className={`p-3 rounded-lg ${config.color} border text-center text-sm font-semibold`}>
            {getDaysLeftText()}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-8 text-xs"
              onClick={() => onEdit?.(item)}
              data-testid={`button-edit-${item.id}`}
            >
              <Edit className="h-3.5 w-3.5 mr-1.5" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-8 text-xs"
              onClick={() => onDelete?.(item)}
              data-testid={`button-delete-${item.id}`}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
