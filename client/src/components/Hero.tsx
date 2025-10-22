import { Button } from "@/components/ui/button";
import { Calendar, Bell, TrendingDown, Shield, Sparkles } from "lucide-react";
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
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: i * 0.15,
        duration: 0.5,
        ease: "easeOut",
      },
    }),
  };

  return (
    <section className="relative bg-gradient-to-br from-primary/5 via-background to-accent/5 py-20 md:py-32 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-20 right-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-20 left-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            className="space-y-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div className="space-y-4" variants={itemVariants}>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
                Never Let Food
                <span className="block bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Go to Waste
                </span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed">
                Track expiry dates, get smart alerts, and reduce food waste. Join thousands saving money and helping the planet.
              </p>
            </motion.div>

            <motion.div className="flex flex-wrap gap-4" variants={itemVariants}>
              <Button 
                size="lg" 
                onClick={onGetStartedClick} 
                data-testid="button-hero-get-started"
                className="text-base px-8 shadow-lg hover:shadow-xl transition-shadow"
              >
                Get Started Free
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                onClick={onLearnMoreClick} 
                data-testid="button-hero-learn-more"
                className="text-base px-8"
              >
                Learn More
              </Button>
            </motion.div>

            <motion.div 
              className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4"
              variants={containerVariants}
            >
              {[
                { icon: Calendar, label: "Track Expiry" },
                { icon: Bell, label: "Smart Alerts" },
                { icon: TrendingDown, label: "Reduce Waste" },
                { icon: Shield, label: "Food Safety" },
              ].map((feature, i) => (
                <motion.div
                  key={feature.label}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card/50 backdrop-blur-sm border hover-elevate"
                  variants={itemVariants}
                  whileHover={{ scale: 1.05, y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <feature.icon className="h-6 w-6 text-primary" />
                  <span className="text-sm font-medium text-center">{feature.label}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          <div className="relative hidden md:block">
            <motion.div
              className="relative aspect-square rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 p-8 backdrop-blur-sm"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-accent/10 rounded-2xl"></div>
              <div className="relative h-full flex flex-col justify-center items-center gap-6">
                <div className="w-full space-y-4">
                  {[
                    { icon: Calendar, label: "Fresh Milk", days: "5 days", color: "fresh", delay: 0 },
                    { icon: Bell, label: "Strawberries", days: "2 days", color: "expiring", delay: 0.2 },
                    { icon: Shield, label: "Yogurt", days: "yesterday", color: "expired", delay: 0.4, opacity: 0.6 },
                  ].map((item, i) => (
                    <motion.div
                      key={item.label}
                      className={`bg-card/80 backdrop-blur-sm border ${
                        item.color === 'fresh' ? 'border-fresh' :
                        item.color === 'expiring' ? 'border-expiring' :
                        'border-expired'
                      } rounded-lg p-4 shadow-sm hover-elevate`}
                      custom={i}
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      style={{ opacity: item.opacity || 1 }}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                          item.color === 'fresh' ? 'bg-fresh/20' :
                          item.color === 'expiring' ? 'bg-expiring/20' :
                          'bg-expired/20'
                        }`}>
                          <item.icon className={`h-6 w-6 ${
                            item.color === 'fresh' ? 'text-fresh' :
                            item.color === 'expiring' ? 'text-expiring' :
                            'text-expired'
                          }`} />
                        </div>
                        <div>
                          <p className="font-semibold">{item.label}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.color === 'expired' ? 'Expired' : 'Expires in'} {item.days}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
