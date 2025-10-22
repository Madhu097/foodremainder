import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { About } from "@/components/About";
import { Footer } from "@/components/Footer";

export default function HomePage() {
  const [, setLocation] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const user = localStorage.getItem("user");
    if (user) {
      setIsAuthenticated(true);
      // Redirect to dashboard if already logged in
      setLocation("/dashboard");
    }
  }, [setLocation]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setIsAuthenticated(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar
        isAuthenticated={isAuthenticated}
        onLoginClick={() => setLocation("/auth?mode=login")}
        onRegisterClick={() => setLocation("/auth?mode=register")}
        onLogoutClick={handleLogout}
      />
      <main className="flex-1">
        <Hero
          onGetStartedClick={() => setLocation("/auth?mode=register")}
          onLearnMoreClick={() => {
            document.getElementById("about")?.scrollIntoView({ behavior: "smooth" });
          }}
        />
        <About />
      </main>
      <Footer />
    </div>
  );
}
