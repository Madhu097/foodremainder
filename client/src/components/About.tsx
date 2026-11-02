import { Card, CardContent } from "@/components/ui/card";
import {
  Calendar,
  Bell,
  TrendingDown,
  Shield,
  Sparkles,
  Barcode,
  Send,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";

export function About() {
  const features = [
    {
      icon: Sparkles,
      title: "AI Zero-Waste Recipes",
      description:
        "Chef Remi analyzes your inventory and cooks up tasty, easy recipes using ingredients nearest their expiration.",
      badge: "AI Powered",
    },
    {
      icon: Calendar,
      title: "Predictive Shelf-Life",
      description:
        "Type any grocery item and our AI automatically estimates the ideal expiration date and best storage compartment.",
      badge: "Smart Tracking",
    },
    {
      icon: Bell,
      title: "5-Channel Multi Alerts",
      description:
        "Receive scheduled alerts through WhatsApp, Telegram, Email, SMS, and Web Push notifications before food spoils.",
      badge: "Real-time",
    },
    {
      icon: Barcode,
      title: "Open Food Facts Barcode Scan",
      description:
        "Scan barcodes using your phone or laptop camera to instantly identify packaged groceries and nutrition data.",
      badge: "Instant Scan",
    },
    {
      icon: TrendingDown,
      title: "Save Money & Cut Waste",
      description:
        "The average household saves between $1,200 and $1,800 annually by preventing kitchen spoilage and duplicate purchases.",
      badge: "High Impact",
    },
    {
      icon: Shield,
      title: "Food Safety & Quality",
      description:
        "Clear color-coded shelf indicators ensure you and your family consume fresh, safe produce with confidence.",
      badge: "Health First",
    },
  ];

  return (
    <section id="about" className="py-20 bg-muted/20 relative overflow-hidden border-t border-border/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            Designed for Modern Kitchens
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Smarter food tracking. Zero guesswork.
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            From smart barcode scanning to AI recipe generation and instant WhatsApp notifications, everything you need to keep groceries fresh.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, i) => (
            <Card
              key={feature.title}
              className="border border-border/60 hover:border-primary/40 transition-all duration-200 rounded-xl bg-card shadow-xs hover:shadow-sm"
            >
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <span className="text-[11px] font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full border border-border/40">
                    {feature.badge}
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="font-semibold text-base text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
