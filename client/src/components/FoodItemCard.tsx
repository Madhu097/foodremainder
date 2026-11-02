import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Edit,
  Trash2,
  Apple,
  Milk,
  Carrot,
  Beef,
  Fish,
  Wheat,
  Coffee,
  Cookie,
  Salad,
  Calendar,
  Sparkles,
} from "lucide-react";

export interface FoodItem {
  id: string;
  name: string;
  category: string;
  purchaseDate: string;
  expiryDate: string;
  quantity?: string | null;
  notes?: string | null;
  barcode?: string | null;
  status: "fresh" | "expiring" | "expired";
  daysLeft: number;
}

interface FoodItemCardProps {
  item: FoodItem;
  onEdit?: (item: FoodItem) => void;
  onDelete?: (item: FoodItem) => void;
  onAskChef?: (item: FoodItem) => void;
  layout?: "grid" | "list";
}

export function FoodItemCard({
  item,
  onEdit,
  onDelete,
  onAskChef,
  layout = "grid",
}: FoodItemCardProps) {
  const statusConfig = {
    fresh: {
      badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
      bar: "bg-emerald-500",
      accent: "text-emerald-600 dark:text-emerald-400",
      border: "border-border/60 hover:border-emerald-500/30",
    },
    expiring: {
      badge: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
      bar: "bg-amber-500",
      accent: "text-amber-600 dark:text-amber-400",
      border: "border-amber-500/30 hover:border-amber-500/60",
    },
    expired: {
      badge: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20",
      bar: "bg-rose-500",
      accent: "text-rose-600 dark:text-rose-400",
      border: "border-rose-500/30 hover:border-rose-500/60",
    },
  };

  const config = statusConfig[item.status] || statusConfig.fresh;

  const getCategoryIcon = () => {
    const category = item.category.toLowerCase();
    switch (category) {
      case "dairy":
        return { Icon: Milk, bg: "bg-blue-500/10", color: "text-blue-600 dark:text-blue-400" };
      case "fruits":
        return { Icon: Apple, bg: "bg-rose-500/10", color: "text-rose-600 dark:text-rose-400" };
      case "vegetables":
        return { Icon: Carrot, bg: "bg-emerald-500/10", color: "text-emerald-600 dark:text-emerald-400" };
      case "meat":
        return { Icon: Beef, bg: "bg-orange-500/10", color: "text-orange-600 dark:text-orange-400" };
      case "seafood":
        return { Icon: Fish, bg: "bg-cyan-500/10", color: "text-cyan-600 dark:text-cyan-400" };
      case "grains":
        return { Icon: Wheat, bg: "bg-amber-500/10", color: "text-amber-600 dark:text-amber-400" };
      case "beverages":
        return { Icon: Coffee, bg: "bg-purple-500/10", color: "text-purple-600 dark:text-purple-400" };
      case "snacks":
        return { Icon: Cookie, bg: "bg-yellow-500/10", color: "text-yellow-600 dark:text-yellow-400" };
      default:
        return { Icon: Salad, bg: "bg-primary/10", color: "text-primary" };
    }
  };

  const { Icon: CategoryIcon, bg: iconBg, color: iconColor } = getCategoryIcon();

  const getDaysLeftText = () => {
    if (item.status === "expired") {
      const days = Math.abs(item.daysLeft);
      return `Expired ${days} day${days === 1 ? "" : "s"} ago`;
    }
    if (item.daysLeft === 0) {
      return "Expires today";
    }
    return `${item.daysLeft} day${item.daysLeft === 1 ? "" : "s"} remaining`;
  };

  // Calculate approximate shelf life progress percentage
  const totalDays = Math.max(
    1,
    Math.ceil(
      (new Date(item.expiryDate).getTime() - new Date(item.purchaseDate).getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );
  const remainingProgress = item.status === "expired"
    ? 0
    : Math.min(100, Math.max(8, Math.round((item.daysLeft / totalDays) * 100)));

  if (layout === "list") {
    return (
      <Card
        className={`transition-all duration-200 border rounded-xl shadow-xs hover:shadow-sm ${config.border} bg-card`}
        data-testid={`card-food-item-${item.id}`}
      >
        <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}>
              <CategoryIcon className={`h-5 w-5 ${iconColor}`} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm sm:text-base truncate" data-testid={`text-food-name-${item.id}`}>
                  {item.name}
                </h3>
                <Badge variant="outline" className="text-[10px] font-normal py-0 h-5">
                  {item.category}
                </Badge>
                {item.quantity && (
                  <span className="text-xs text-muted-foreground font-mono">
                    ({item.quantity})
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                <span>Expires: {new Date(item.expiryDate).toLocaleDateString()}</span>
                {item.notes && <span className="truncate italic max-w-xs">• {item.notes}</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${config.badge}`}>
              {getDaysLeftText()}
            </span>
            <div className="flex items-center gap-1">
              {onAskChef && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-primary hover:bg-primary/10"
                  onClick={() => onAskChef(item)}
                  title="Ask AI Chef about this item"
                >
                  <Sparkles className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => onEdit?.(item)}
                data-testid={`button-edit-${item.id}`}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                onClick={() => onDelete?.(item)}
                data-testid={`button-delete-${item.id}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={`group relative overflow-hidden transition-all duration-200 border rounded-xl shadow-xs hover:shadow-md ${config.border} bg-card flex flex-col justify-between`}
      data-testid={`card-food-item-${item.id}`}
    >
      {/* Top progress indicator bar */}
      <div className="h-1.5 w-full bg-muted/60 overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${config.bar}`}
          style={{ width: `${remainingProgress}%` }}
        />
      </div>

      <CardContent className="p-5 space-y-4 flex-1 flex flex-col justify-between">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 ${iconBg}`}>
                <CategoryIcon className={`h-5 w-5 ${iconColor}`} />
              </div>
              <div className="min-w-0">
                <h3
                  className="font-semibold text-base tracking-tight truncate text-foreground group-hover:text-primary transition-colors"
                  data-testid={`text-food-name-${item.id}`}
                >
                  {item.name}
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Badge variant="outline" className="text-[11px] font-normal py-0 h-5" data-testid={`badge-category-${item.id}`}>
                    {item.category}
                  </Badge>
                  {item.quantity && (
                    <span className="text-xs text-muted-foreground font-medium">
                      • {item.quantity}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* AI Chef button */}
            {onAskChef && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-primary/70 hover:text-primary hover:bg-primary/10 rounded-lg flex-shrink-0"
                onClick={() => onAskChef(item)}
                title="AI Tips & Recipe Ideas"
              >
                <Sparkles className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Date Information */}
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground bg-muted/40 p-2.5 rounded-lg">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground/80">Purchased</span>
              <p className="font-medium text-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                {new Date(item.purchaseDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </p>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground/80">Expires</span>
              <p className="font-medium text-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                {new Date(item.expiryDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </p>
            </div>
          </div>

          {item.notes && (
            <p className="text-xs text-muted-foreground line-clamp-2 italic px-1">
              "{item.notes}"
            </p>
          )}
        </div>

        {/* Footer with status pill & actions */}
        <div className="space-y-3 pt-2">
          <div className={`py-1.5 px-3 rounded-lg border text-center text-xs font-semibold ${config.badge}`}>
            {getDaysLeftText()}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-8 text-xs rounded-lg hover:bg-muted"
              onClick={() => onEdit?.(item)}
              data-testid={`button-edit-${item.id}`}
            >
              <Edit className="h-3.5 w-3.5 mr-1.5" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg"
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
