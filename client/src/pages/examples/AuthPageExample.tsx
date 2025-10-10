import { ThemeProvider } from "@/components/ThemeProvider";
import AuthPage from "../AuthPage";

export default function AuthPageExample() {
  return (
    <ThemeProvider>
      <AuthPage />
    </ThemeProvider>
  );
}
