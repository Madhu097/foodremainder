import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { AuthForm } from "@/components/AuthForm";
import { useToast } from "@/hooks/use-toast";
import { safeLocalStorage } from "@/lib/storage";
import { API_BASE_URL } from "@/lib/api";

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
      const fullUrl = `${API_BASE_URL}${endpoint}`;
      console.log("[Auth] Sending request to:", fullUrl);
      console.log("[Auth] API_BASE_URL:", API_BASE_URL);
      console.log("[Auth] Request data:", { ...data, password: "***" });
      
      const response = await fetch(fullUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: "include",
      });

      console.log("[Auth] Response status:", response.status);
      console.log("[Auth] Response ok:", response.ok);
      console.log("[Auth] Response headers:", Object.fromEntries(response.headers.entries()));

      // Get response as text first to see what we're getting
      const responseText = await response.text();
      console.log("[Auth] Response text:", responseText);

      let result;
      try {
        result = JSON.parse(responseText);
        console.log("[Auth] Parsed response data:", result);
      } catch (parseError) {
        console.error("[Auth] Failed to parse JSON response:", parseError);
        console.error("[Auth] Response was:", responseText.substring(0, 500));
        setError(`Server error: ${responseText.substring(0, 100) || 'Invalid response format'}`);
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
      safeLocalStorage.setItem("user", JSON.stringify(result.user));

      // Redirect to dashboard
      setLocation("/dashboard");
    } catch (err) {
      console.error("[Auth] Caught error:", err);
      console.error("[Auth] Error type:", err instanceof Error ? err.constructor.name : typeof err);
      console.error("[Auth] Error message:", err instanceof Error ? err.message : String(err));
      
      // More detailed error message
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError(`Cannot connect to server at ${API_BASE_URL}. Please check if the backend is running.`);
      } else {
        setError(`Network error: ${err instanceof Error ? err.message : 'Please try again'}`);
      }
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
