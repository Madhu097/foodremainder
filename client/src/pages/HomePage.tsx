import { useState } from "react";
import { useLocation } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { About } from "@/components/About";
import { Footer } from "@/components/Footer";

export default function HomePage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar
        isAuthenticated={false}
        onLoginClick={() => setLocation("/auth?mode=login")}
        onRegisterClick={() => setLocation("/auth?mode=register")}
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
