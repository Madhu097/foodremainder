import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Apple } from "lucide-react";

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
            <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Apple className="h-6 w-6 text-primary" />
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
