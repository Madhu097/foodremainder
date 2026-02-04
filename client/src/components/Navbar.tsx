import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { Menu, X, User, HelpCircle } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { API_BASE_URL } from "@/lib/api";
import { safeLocalStorage } from "@/lib/storage";

interface NavbarProps {
  isAuthenticated?: boolean;
  onLoginClick?: () => void;
  onRegisterClick?: () => void;
  onLogoutClick?: () => void;
}

export function Navbar({
  isAuthenticated = false,
  onLoginClick,
  onRegisterClick,
  onLogoutClick,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const queryClient = useQueryClient();

  // Prefetch dashboard data on hover for instant loading
  const handleDashboardHover = () => {
    if (isAuthenticated) {
      const userStr = safeLocalStorage.getItem("user");
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          queryClient.prefetchQuery({
            queryKey: ['foodItems', user.id],
            queryFn: async () => {
              // Use optimized batch endpoint
              const response = await fetch(`${API_BASE_URL}/api/dashboard/${user.id}`, {
                credentials: "include",
              });
              if (!response.ok) throw new Error("Failed to prefetch");
              const data = await response.json();
              return { items: data.items };
            },
            staleTime: 60000,
          });
        } catch (err) {
          console.error("Prefetch error:", err);
        }
      }
    }
  };

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-lg bg-background/90 border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex justify-between items-center h-16 gap-4">
          <Link href="/" className="flex items-center gap-0 hover-elevate active-elevate-2 px-2 py-1 rounded-md" data-testid="link-home">
            <motion.div
              whileHover={{ rotate: 10, scale: 1.1 }}
              className="mr-2"
            >
              <svg
                width="40"
                height="40"
                viewBox="0 0 40 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="drop-shadow-sm"
              >
                <circle cx="20" cy="20" r="18" fill="url(#logo-grad)" />
                <path
                  d="M20 10C14.48 10 10 14.48 10 20C10 25.52 14.48 30 20 30C25.52 30 30 25.52 30 20"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <path
                  d="M20 15V20L23 23"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="24" cy="12" r="4" fill="#ef4444" />
                <path d="M24 8C24.5 9.5 25.5 10 27 10" stroke="white" strokeWidth="1" />
                <defs>
                  <linearGradient id="logo-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#16a34a" />
                    <stop offset="1" stopColor="#15803d" />
                  </linearGradient>
                </defs>
              </svg>
            </motion.div>
            <span className="text-xl font-bold">Food Reminder</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {isAuthenticated && (
              <>
                <Link
                  href="/dashboard"
                  className="text-sm font-medium hover-elevate active-elevate-2 px-3 py-2 rounded-md"
                  data-testid="link-dashboard"
                  onMouseEnter={handleDashboardHover}
                >
                  Dashboard
                </Link>
                <Link href="/profile" className="text-sm font-medium hover-elevate active-elevate-2 px-3 py-2 rounded-md flex items-center gap-2" data-testid="link-profile">
                  <User className="w-4 h-4" />
                  Profile
                </Link>
              </>
            )}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {!isAuthenticated && (
              <>
                <Link
                  href="/"
                  onClick={(e) => {
                    e.preventDefault();
                    window.location.href = "/";
                    setTimeout(() => {
                      document.getElementById("about")?.scrollIntoView({ behavior: "smooth" });
                    }, 100);
                  }}
                  className="text-sm font-medium hover-elevate active-elevate-2 px-3 py-2 rounded-md"
                  data-testid="link-about"
                >
                  About
                </Link>
                <Link href="/help-contact" className="text-sm font-medium hover-elevate active-elevate-2 px-3 py-2 rounded-md flex items-center gap-2" data-testid="link-help">
                  <HelpCircle className="w-4 h-4" />
                  Help
                </Link>
              </>
            )}
            <ThemeToggle />
            {!isAuthenticated ? (
              <>
                <Button variant="ghost" onClick={onLoginClick} data-testid="button-login">
                  Login
                </Button>
                <Button onClick={onRegisterClick} data-testid="button-register">
                  Get Started
                </Button>
              </>
            ) : (
              <Button variant="ghost" onClick={onLogoutClick} data-testid="button-logout">
                Logout
              </Button>
            )}
          </div>

          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              className="md:hidden border-t py-4 space-y-2"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              {isAuthenticated && (
                <>
                  <Link href="/dashboard" className="block px-3 py-2 rounded-md hover-elevate active-elevate-2" data-testid="link-dashboard-mobile">
                    Dashboard
                  </Link>
                  <Link href="/profile" className="block px-3 py-2 rounded-md hover-elevate active-elevate-2 flex items-center gap-2" data-testid="link-profile-mobile">
                    <User className="w-4 h-4" />
                    Profile
                  </Link>
                </>
              )}
              {!isAuthenticated && (
                <>
                  <Link
                    href="/"
                    onClick={(e) => {
                      e.preventDefault();
                      setMobileMenuOpen(false);
                      window.location.href = "/";
                      setTimeout(() => {
                        document.getElementById("about")?.scrollIntoView({ behavior: "smooth" });
                      }, 100);
                    }}
                    className="block px-3 py-2 rounded-md hover-elevate active-elevate-2"
                    data-testid="link-about-mobile"
                  >
                    About
                  </Link>
                  <Link href="/help-contact" className="block px-3 py-2 rounded-md hover-elevate active-elevate-2 flex items-center gap-2" data-testid="link-help-mobile">
                    <HelpCircle className="w-4 h-4" />
                    Help & Contact
                  </Link>
                </>
              )}
              <div className="pt-2 space-y-2">
                {!isAuthenticated ? (
                  <>
                    <Button variant="ghost" className="w-full" onClick={onLoginClick} data-testid="button-login-mobile">
                      Login
                    </Button>
                    <Button className="w-full" onClick={onRegisterClick} data-testid="button-register-mobile">
                      Get Started
                    </Button>
                  </>
                ) : (
                  <Button variant="ghost" className="w-full" onClick={onLogoutClick} data-testid="button-logout-mobile">
                    Logout
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}
