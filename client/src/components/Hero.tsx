import { Button } from "@/components/ui/button";
import { Calendar, Bell, TrendingDown, Shield } from "lucide-react";

interface HeroProps {
  onGetStartedClick?: () => void;
  onLearnMoreClick?: () => void;
}

export function Hero({ onGetStartedClick, onLearnMoreClick }: HeroProps) {
  return (
    <section className="relative bg-gradient-to-br from-primary/5 via-background to-accent/5 py-20 md:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
                Never Let Food
                <span className="block text-primary">Go to Waste</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl">
                Track expiry dates, get smart alerts, and reduce food waste. Join thousands saving money and helping the planet.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Button size="lg" onClick={onGetStartedClick} data-testid="button-hero-get-started">
                Get Started Free
              </Button>
              <Button size="lg" variant="outline" onClick={onLearnMoreClick} data-testid="button-hero-learn-more">
                Learn More
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
              {[
                { icon: Calendar, label: "Track Expiry" },
                { icon: Bell, label: "Smart Alerts" },
                { icon: TrendingDown, label: "Reduce Waste" },
                { icon: Shield, label: "Food Safety" },
              ].map((feature) => (
                <div key={feature.label} className="flex flex-col items-center gap-2 p-3 rounded-lg hover-elevate">
                  <feature.icon className="h-6 w-6 text-primary" />
                  <span className="text-sm font-medium text-center">{feature.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative hidden md:block">
            <div className="relative aspect-square rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 p-8">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-accent/10 rounded-2xl"></div>
              <div className="relative h-full flex flex-col justify-center items-center gap-6">
                <div className="w-full space-y-4">
                  <div className="bg-card border border-fresh rounded-lg p-4 shadow-sm hover-elevate">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 bg-fresh/20 rounded-lg flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-fresh" />
                      </div>
                      <div>
                        <p className="font-semibold">Fresh Milk</p>
                        <p className="text-sm text-muted-foreground">Expires in 5 days</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-card border border-expiring rounded-lg p-4 shadow-sm hover-elevate">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 bg-expiring/20 rounded-lg flex items-center justify-center">
                        <Bell className="h-6 w-6 text-expiring" />
                      </div>
                      <div>
                        <p className="font-semibold">Strawberries</p>
                        <p className="text-sm text-muted-foreground">Expires in 2 days</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-card border border-expired rounded-lg p-4 shadow-sm hover-elevate opacity-60">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 bg-expired/20 rounded-lg flex items-center justify-center">
                        <Shield className="h-6 w-6 text-expired" />
                      </div>
                      <div>
                        <p className="font-semibold">Yogurt</p>
                        <p className="text-sm text-muted-foreground">Expired yesterday</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
