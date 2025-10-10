import { ThemeProvider } from "../ThemeProvider";
import { StatsCard } from "../StatsCard";
import { Package, AlertCircle, XCircle, CheckCircle } from "lucide-react";

export default function StatsCardExample() {
  return (
    <ThemeProvider>
      <div className="p-6 bg-background space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatsCard title="Total Items" value={24} icon={Package} variant="default" />
          <StatsCard title="Fresh" value={18} icon={CheckCircle} variant="fresh" />
          <StatsCard title="Expiring Soon" value={4} icon={AlertCircle} variant="expiring" />
          <StatsCard title="Expired" value={2} icon={XCircle} variant="expired" />
        </div>
      </div>
    </ThemeProvider>
  );
}
