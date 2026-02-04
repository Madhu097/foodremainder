import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { lazy, Suspense } from "react";

import { FoodLoader } from "@/components/FoodLoader";

// Lazy load pages for better performance
const HomePage = lazy(() => import("@/pages/HomePage"));
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const AuthPage = lazy(() => import("@/pages/AuthPage"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));
const ForgotPasswordPage = lazy(() => import("@/pages/ForgotPasswordPage"));
const HelpContactPage = lazy(() => import("@/pages/HelpContactPage"));
const NotFound = lazy(() => import("@/pages/not-found"));

// Loading fallback component with better UX
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-muted">
    <div className="text-center space-y-6">
      <FoodLoader size="lg" />
      <p className="text-sm font-medium text-muted-foreground animate-pulse tracking-wide uppercase">
        Initializing Inventory...
      </p>
    </div>
  </div>
);

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/help-contact" component={HelpContactPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Suspense fallback={<PageLoader />}>
            <Router />
          </Suspense>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
