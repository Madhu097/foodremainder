import { ThemeProvider } from "@/components/ThemeProvider";
import DashboardPage from "../DashboardPage";

export default function DashboardPageExample() {
  return (
    <ThemeProvider>
      <DashboardPage />
    </ThemeProvider>
  );
}
