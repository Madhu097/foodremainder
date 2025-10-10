import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { Leaf, Menu, X } from "lucide-react";
import { useState } from "react";

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

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-lg bg-background/90 border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-4">
          <Link href="/" className="flex items-center gap-2 hover-elevate active-elevate-2 px-2 py-1 rounded-md" data-testid="link-home">
            <Leaf className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">FoodSaver</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link href="#about" className="text-sm font-medium hover-elevate active-elevate-2 px-3 py-2 rounded-md" data-testid="link-about">
              About
            </Link>
            {isAuthenticated && (
              <Link href="/dashboard" className="text-sm font-medium hover-elevate active-elevate-2 px-3 py-2 rounded-md" data-testid="link-dashboard">
                Dashboard
              </Link>
            )}
          </div>

          <div className="hidden md:flex items-center gap-3">
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

        {mobileMenuOpen && (
          <div className="md:hidden border-t py-4 space-y-2">
            <Link href="#about" className="block px-3 py-2 rounded-md hover-elevate active-elevate-2" data-testid="link-about-mobile">
              About
            </Link>
            {isAuthenticated && (
              <Link href="/dashboard" className="block px-3 py-2 rounded-md hover-elevate active-elevate-2" data-testid="link-dashboard-mobile">
                Dashboard
              </Link>
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
          </div>
        )}
      </div>
    </nav>
  );
}
