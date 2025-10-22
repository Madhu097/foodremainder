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
            Why Choose Food Reminder?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            The average household wastes over $1,500 worth of food each year. Food Reminder helps you take control.
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

      </div>
    </section>
  );
}
