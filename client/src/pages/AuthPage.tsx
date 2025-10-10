import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { AuthForm } from "@/components/AuthForm";

export default function AuthPage() {
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const initialMode = searchParams.get("mode") === "register" ? "register" : "login";
  
  const [mode, setMode] = useState<"login" | "register">(initialMode);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const modeParam = params.get("mode");
    if (modeParam === "register" || modeParam === "login") {
      setMode(modeParam);
    }
  }, [location]);

  const handleSubmit = (data: { username: string; password: string }) => {
    console.log("Auth submitted:", mode, data);
    //todo: remove mock functionality - integrate with real auth
    setLocation("/dashboard");
  };

  const handleToggleMode = () => {
    const newMode = mode === "login" ? "register" : "login";
    setMode(newMode);
    setLocation(`/auth?mode=${newMode}`);
  };

  return (
    <AuthForm
      mode={mode}
      onSubmit={handleSubmit}
      onToggleMode={handleToggleMode}
    />
  );
}
