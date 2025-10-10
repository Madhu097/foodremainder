import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Bell, TrendingDown, Shield } from "lucide-react";

export function About() {
  const features = [
    {
      icon: Calendar,
      title: "Smart Expiry Tracking",
      description: "Add food items with purchase and expiry dates. Our system automatically tracks everything for you.",
    },
    {
      icon: Bell,
      title: "Timely Alerts",
      description: "Get notifications when food is about to expire, so you can use it before it's too late.",
    },
    {
      icon: TrendingDown,
      title: "Reduce Food Waste",
      description: "Save money and help the environment by minimizing the food you throw away.",
    },
    {
      icon: Shield,
      title: "Food Safety First",
      description: "Never accidentally consume expired food. Stay safe with clear visual indicators.",
    },
  ];

  return (
    <section id="about" className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl md:text-5xl font-bold">
            Why Choose FoodSaver?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            The average household wastes over $1,500 worth of food each year. FoodSaver helps you take control.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {features.map((feature) => (
            <Card key={feature.title} className="hover-elevate">
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-8 p-6 bg-card rounded-xl border">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">10,000+</div>
              <div className="text-sm text-muted-foreground">Active Users</div>
            </div>
            <div className="h-12 w-px bg-border"></div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">$2M+</div>
              <div className="text-sm text-muted-foreground">Food Saved</div>
            </div>
            <div className="h-12 w-px bg-border"></div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">50K+</div>
              <div className="text-sm text-muted-foreground">Items Tracked</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
