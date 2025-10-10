import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  variant?: "default" | "fresh" | "expiring" | "expired";
}

export function StatsCard({ title, value, icon: Icon, variant = "default" }: StatsCardProps) {
  const variantStyles = {
    default: "border-l-primary bg-primary/5",
    fresh: "border-l-fresh bg-fresh/5",
    expiring: "border-l-expiring bg-expiring/5",
    expired: "border-l-expired bg-expired/5",
  };

  const iconStyles = {
    default: "text-primary bg-primary/10",
    fresh: "text-fresh bg-fresh/10",
    expiring: "text-expiring bg-expiring/10",
    expired: "text-expired bg-expired/10",
  };

  return (
    <Card className={`border-l-4 ${variantStyles[variant]} hover-elevate`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold" data-testid={`text-stats-${title.toLowerCase().replace(/\s+/g, '-')}`}>
              {value}
            </p>
          </div>
          <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${iconStyles[variant]}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
