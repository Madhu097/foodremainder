import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { AuthForm } from "@/components/AuthForm";
import { useToast } from "@/hooks/use-toast";

interface RegisterFormData {
  username: string;
  email: string;
  mobile: string;
  password: string;
}

interface LoginFormData {
  identifier: string;
  password: string;
}

export default function AuthPage() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const searchParams = new URLSearchParams(window.location.search);
  const initialMode = searchParams.get("mode") === "register" ? "register" : "login";
  
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const modeParam = params.get("mode");
    if (modeParam === "register" || modeParam === "login") {
      setMode(modeParam);
      setError(""); // Clear error when switching modes
    }
  }, [location]);

  const handleSubmit = async (data: RegisterFormData | LoginFormData) => {
    setError("");
    setIsLoading(true);

    try {
      const endpoint = mode === "register" ? "/api/auth/register" : "/api/auth/login";
      console.log("[Auth] Sending request to:", endpoint);
      console.log("[Auth] Request data:", { ...data, password: "***" });
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      console.log("[Auth] Response status:", response.status);
      console.log("[Auth] Response ok:", response.ok);

      let result;
      try {
        result = await response.json();
        console.log("[Auth] Response data:", result);
      } catch (parseError) {
        console.error("[Auth] Failed to parse JSON response:", parseError);
        setError("Invalid response from server. Please try again.");
        return;
      }

      if (!response.ok) {
        // Handle validation errors
        if (result.errors) {
          const errorMessage = result.errors.map((err: any) => err.message).join(", ");
          setError(errorMessage);
        } else {
          setError(result.message || "An error occurred");
        }
        return;
      }

      // Success!
      console.log("[Auth] Success! User:", result.user);
      toast({
        title: mode === "register" ? "Account created!" : "Welcome back!",
        description: result.message,
      });

      // Store user data in localStorage (in production, use proper session management)
      localStorage.setItem("user", JSON.stringify(result.user));

      // Redirect to dashboard
      setLocation("/dashboard");
    } catch (err) {
      console.error("[Auth] Caught error:", err);
      console.error("[Auth] Error type:", err instanceof Error ? err.constructor.name : typeof err);
      console.error("[Auth] Error message:", err instanceof Error ? err.message : String(err));
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleMode = () => {
    const newMode = mode === "login" ? "register" : "login";
    setMode(newMode);
    setError("");
    setLocation(`/auth?mode=${newMode}`);
  };

  return (
    <AuthForm
      mode={mode}
      onSubmit={handleSubmit}
      onToggleMode={handleToggleMode}
      error={error}
      isLoading={isLoading}
    />
  );
}
