import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { Menu, X, User, HelpCircle, Sparkles, LayoutDashboard } from "lucide-react";
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
  onOpenRecipes?: () => void;
}

export function Navbar({
  isAuthenticated = false,
  onLoginClick,
  onRegisterClick,
  onLogoutClick,
  onOpenRecipes,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const queryClient = useQueryClient();

  // Prefetch dashboard data on hover for instant navigation
  const handleDashboardHover = () => {
    if (isAuthenticated) {
      const userStr = safeLocalStorage.getItem("user");
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          queryClient.prefetchQuery({
            queryKey: ["foodItems", user.id],
            queryFn: async () => {
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
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-background/85 border-b border-border/50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-4">
          {/* Brand Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group cursor-pointer"
            data-testid="link-home"
          >
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2v8" />
                <path d="m4.93 10.93 4.24-4.24" />
                <path d="M2 18h20" />
                <path d="M20 18a8 8 0 0 0-16 0" />
              </svg>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base tracking-tight text-foreground">
                Food Reminder
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                AI
              </span>
            </div>
          </Link>

          {/* Desktop Center Links */}
          <div className="hidden md:flex items-center gap-1">
            {isAuthenticated ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-xs font-medium px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors flex items-center gap-1.5"
                  data-testid="link-dashboard"
                  onMouseEnter={handleDashboardHover}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  Dashboard
                </Link>
                {onOpenRecipes && (
                  <button
                    onClick={onOpenRecipes}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    AI Recipes
                  </button>
                )}
                <Link
                  href="/profile"
                  className="text-xs font-medium px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors flex items-center gap-1.5"
                  data-testid="link-profile"
                >
                  <User className="w-3.5 h-3.5" />
                  Profile
                </Link>
              </>
            ) : (
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
                  className="text-xs font-medium px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                  data-testid="link-about"
                >
                  Features
                </Link>
                <Link
                  href="/help-contact"
                  className="text-xs font-medium px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors flex items-center gap-1.5"
                  data-testid="link-help"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  Support
                </Link>
              </>
            )}
          </div>

          {/* Desktop Right Actions */}
          <div className="hidden md:flex items-center gap-2.5">
            <ThemeToggle />
            {!isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onLoginClick}
                  className="text-xs h-8 rounded-lg"
                  data-testid="button-login"
                >
                  Sign In
                </Button>
                <Button
                  size="sm"
                  onClick={onRegisterClick}
                  className="text-xs h-8 rounded-lg"
                  data-testid="button-register"
                >
                  Get Started
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={onLogoutClick}
                className="text-xs h-8 rounded-lg"
                data-testid="button-logout"
              >
                Sign Out
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              className="md:hidden border-t py-3 space-y-1.5"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              {isAuthenticated ? (
                <>
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium hover:bg-muted"
                    data-testid="link-dashboard-mobile"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Link>
                  {onOpenRecipes && (
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onOpenRecipes();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-primary hover:bg-primary/10"
                    >
                      <Sparkles className="w-4 h-4 text-primary" />
                      AI Recipes
                    </button>
                  )}
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium hover:bg-muted"
                    data-testid="link-profile-mobile"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User className="w-4 h-4" />
                    Profile
                  </Link>
                  <div className="pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs h-8"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onLogoutClick?.();
                      }}
                      data-testid="button-logout-mobile"
                    >
                      Sign Out
                    </Button>
                  </div>
                </>
              ) : (
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
                    className="block px-3 py-2 rounded-lg text-xs font-medium hover:bg-muted"
                    data-testid="link-about-mobile"
                  >
                    Features
                  </Link>
                  <Link
                    href="/help-contact"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium hover:bg-muted"
                    data-testid="link-help-mobile"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <HelpCircle className="w-4 h-4" />
                    Support
                  </Link>
                  <div className="pt-2 space-y-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs h-8"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onLoginClick?.();
                      }}
                      data-testid="button-login-mobile"
                    >
                      Sign In
                    </Button>
                    <Button
                      size="sm"
                      className="w-full text-xs h-8"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onRegisterClick?.();
                      }}
                      data-testid="button-register-mobile"
                    >
                      Get Started
                    </Button>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}
