import { ThemeProvider } from "@/components/ThemeProvider";
import HomePage from "../HomePage";

export default function HomePageExample() {
  return (
    <ThemeProvider>
      <HomePage />
    </ThemeProvider>
  );
}
