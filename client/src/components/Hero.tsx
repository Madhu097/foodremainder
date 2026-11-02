import { Button } from "@/components/ui/button";
import { Calendar, Bell, TrendingDown, Sparkles, ChefHat, ShieldCheck, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

interface HeroProps {
  onGetStartedClick?: () => void;
  onLearnMoreClick?: () => void;
}

export function Hero({ onGetStartedClick, onLearnMoreClick }: HeroProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  return (
    <section className="relative py-16 md:py-24 overflow-hidden border-b border-border/40 bg-gradient-to-b from-background via-muted/20 to-background">
      {/* Subtle ambient gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Headlines & Call to Actions */}
          <motion.div
            className="lg:col-span-7 space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Pill Badge */}
            <motion.div variants={itemVariants} className="inline-flex">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                AI-Powered Smart Kitchen & Zero Waste
              </span>
            </motion.div>

            {/* Main Headline */}
            <motion.div className="space-y-3" variants={itemVariants}>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-tight">
                Save food, cut costs,{" "}
                <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                  cook with AI.
                </span>
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed">
                Smart expiry tracking with automated WhatsApp, Telegram, and Email alerts. Turn expiring groceries into delicious zero-waste meals in seconds.
              </p>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div className="flex flex-wrap gap-3 pt-2" variants={itemVariants}>
              <Button
                size="lg"
                onClick={onGetStartedClick}
                data-testid="button-hero-get-started"
                className="text-xs sm:text-sm h-11 px-6 rounded-xl font-medium shadow-sm hover:shadow gap-2"
              >
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={onLearnMoreClick}
                data-testid="button-hero-learn-more"
                className="text-xs sm:text-sm h-11 px-6 rounded-xl font-medium"
              >
                Explore Features
              </Button>
            </motion.div>

            {/* Micro Feature Highlights */}
            <motion.div
              className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-border/50 text-xs"
              variants={containerVariants}
            >
              {[
                { icon: Sparkles, title: "AI Recipe Engine", desc: "Use up expiring foods" },
                { icon: Bell, title: "5-Channel Alerts", desc: "WhatsApp, Telegram, Mail" },
                { icon: Calendar, title: "Smart Shelf Life", desc: "Auto-calculated dates" },
                { icon: ShieldCheck, title: "Zero Waste", desc: "Save up to $1,500/year" },
              ].map((feat, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-foreground">
                    <feat.icon className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                    <span>{feat.title}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{feat.desc}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right Column: Interactive Minimal Preview Card */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md bg-card border rounded-2xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-rose-500/80" />
                  <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                  <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                </div>
                <span className="text-[11px] font-mono text-muted-foreground">kitchen-pulse.ai</span>
              </div>

              {/* Sample Expiry Items */}
              <div className="space-y-2.5">
                <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                    <div>
                      <p className="text-xs font-semibold">Fresh Strawberries</p>
                      <p className="text-[10px] text-muted-foreground">Expires in 1 day</p>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-semibold">
                    Expiring
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-border/60 bg-card flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <div>
                      <p className="text-xs font-semibold">Organic Greek Yogurt</p>
                      <p className="text-[10px] text-muted-foreground">Expires in 6 days</p>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold">
                    Fresh
                  </span>
                </div>
              </div>

              {/* AI Recipe Card Preview */}
              <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-primary flex items-center gap-1.5">
                    <ChefHat className="h-3.5 w-3.5" />
                    AI Chef Suggestion
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground">10m prep</span>
                </div>
                <p className="text-xs font-medium text-foreground">
                  Rustic Berry Parfait & Oatmeal Bowl
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Uses your strawberries and Greek yogurt before expiry.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
