import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  variant?: "default" | "fresh" | "expiring" | "expired";
  subtitle?: string;
  active?: boolean;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  variant = "default",
  subtitle,
  active = false,
}: StatsCardProps) {
  const styles = {
    default: {
      card: "border-border/60 hover:border-primary/40 bg-card",
      activeRing: "ring-2 ring-primary border-primary/50 shadow-md",
      iconBg: "bg-primary/10 text-primary",
    },
    fresh: {
      card: "border-border/60 hover:border-emerald-500/40 bg-card",
      activeRing: "ring-2 ring-emerald-500 border-emerald-500/50 shadow-md",
      iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
    expiring: {
      card: "border-border/60 hover:border-amber-500/40 bg-card",
      activeRing: "ring-2 ring-amber-500 border-amber-500/50 shadow-md",
      iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    },
    expired: {
      card: "border-border/60 hover:border-rose-500/40 bg-card",
      activeRing: "ring-2 ring-rose-500 border-rose-500/50 shadow-md",
      iconBg: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    },
  };

  const current = styles[variant] || styles.default;

  return (
    <Card
      className={`relative overflow-hidden transition-all duration-200 border rounded-xl shadow-xs hover:shadow-sm select-none ${
        current.card
      } ${active ? current.activeRing : ""}`}
    >
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {title}
            </span>
            <div className="flex items-baseline gap-2">
              <span
                className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground"
                data-testid={`text-stats-${title.toLowerCase().replace(/\s+/g, "-")}`}
              >
                {value}
              </span>
            </div>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>

          <div
            className={`h-10 w-10 sm:h-11 sm:w-11 rounded-xl flex items-center justify-center transition-transform ${current.iconBg}`}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
