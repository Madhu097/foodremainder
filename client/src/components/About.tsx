import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Bell, TrendingDown, Shield } from "lucide-react";
import { motion } from "framer-motion";

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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  return (
    <section id="about" className="py-20 bg-muted/30 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          className="text-center space-y-4 mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold">
            Why Choose FoodSaver?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            The average household wastes over $1,500 worth of food each year. FoodSaver helps you take control.
          </p>
        </motion.div>

        <motion.div
          className="grid md:grid-cols-2 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {features.map((feature, index) => (
            <motion.div key={feature.title} variants={itemVariants}>
              <Card className="hover-elevate h-full">
                <CardContent className="p-6">
                  <motion.div
                    className="flex gap-4"
                    whileHover={{ x: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <div className="flex-shrink-0">
                      <motion.div
                        className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center"
                        whileHover={{ rotate: 360, scale: 1.1 }}
                        transition={{ duration: 0.6 }}
                      >
                        <feature.icon className="h-6 w-6 text-primary" />
                      </motion.div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold">{feature.title}</h3>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </div>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          className="mt-16 text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="inline-flex flex-wrap items-center justify-center gap-8 p-8 bg-card/80 backdrop-blur-sm rounded-2xl border shadow-lg">
            {[
              { value: "10,000+", label: "Active Users" },
              { value: "$2M+", label: "Food Saved" },
              { value: "50K+", label: "Items Tracked" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 + i * 0.1 }}
              >
                <motion.div
                  className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent"
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {stat.value}
                </motion.div>
                <div className="text-sm text-muted-foreground mt-2">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
