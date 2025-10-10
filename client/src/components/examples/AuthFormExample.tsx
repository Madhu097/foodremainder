import { ThemeProvider } from "../ThemeProvider";
import { AuthForm } from "../AuthForm";
import { useState } from "react";

export default function AuthFormExample() {
  const [mode, setMode] = useState<"login" | "register">("login");

  return (
    <ThemeProvider>
      <AuthForm
        mode={mode}
        onSubmit={(data) => console.log("Submitted:", data)}
        onToggleMode={() => setMode(mode === "login" ? "register" : "login")}
      />
    </ThemeProvider>
  );
}
