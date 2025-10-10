import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Leaf, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AuthFormProps {
  mode: "login" | "register";
  onSubmit?: (data: { username: string; password: string }) => void;
  onToggleMode?: () => void;
}

export function AuthForm({ mode, onSubmit, onToggleMode }: AuthFormProps) {
  const [formData, setFormData] = useState({ username: "", password: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(formData);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-accent/5 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-1/4 -left-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-1/4 -right-20 w-96 h-96 bg-accent/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            x: [0, -50, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <motion.div
        className="w-full max-w-md relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="backdrop-blur-sm bg-card/95 shadow-2xl border-2">
          <CardHeader className="space-y-4">
            <motion.div
              className="flex justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            >
              <motion.div
                className="flex items-center gap-2 p-3 bg-primary/10 rounded-2xl"
                whileHover={{ scale: 1.05 }}
              >
                <Leaf className="h-8 w-8 text-primary" />
                <span className="text-2xl font-bold">FoodSaver</span>
              </motion.div>
            </motion.div>

            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                className="text-center"
                initial={{ opacity: 0, x: mode === "login" ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: mode === "login" ? 20 : -20 }}
                transition={{ duration: 0.3 }}
              >
                <CardTitle className="text-2xl md:text-3xl">
                  {mode === "login" ? "Welcome Back" : "Get Started"}
                </CardTitle>
                <CardDescription className="mt-2">
                  {mode === "login"
                    ? "Sign in to manage your food inventory"
                    : "Create an account to start tracking food"}
                </CardDescription>
              </motion.div>
            </AnimatePresence>

            <motion.div
              className="flex items-center justify-center gap-2 p-2 bg-primary/5 rounded-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-primary">AI-Powered Food Management</span>
            </motion.div>
          </CardHeader>

          <CardContent>
            <AnimatePresence mode="wait">
              <motion.form
                key={mode}
                onSubmit={handleSubmit}
                className="space-y-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <motion.div
                  className="space-y-2"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                    data-testid="input-username"
                    className="transition-all focus:scale-[1.02]"
                  />
                </motion.div>

                <motion.div
                  className="space-y-2"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    data-testid="input-password"
                    className="transition-all focus:scale-[1.02]"
                  />
                </motion.div>

                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <Button
                    type="submit"
                    className="w-full shadow-lg hover:shadow-xl transition-all"
                    data-testid="button-submit"
                  >
                    {mode === "login" ? "Sign In" : "Create Account"}
                  </Button>
                </motion.div>

                <motion.div
                  className="text-center text-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <span className="text-muted-foreground">
                    {mode === "login" ? "Don't have an account? " : "Already have an account? "}
                  </span>
                  <button
                    type="button"
                    onClick={onToggleMode}
                    className="text-primary font-medium hover:underline transition-all"
                    data-testid="button-toggle-mode"
                  >
                    {mode === "login" ? "Sign Up" : "Sign In"}
                  </button>
                </motion.div>
              </motion.form>
            </AnimatePresence>
          </CardContent>
        </Card>

        <motion.p
          className="text-center text-sm text-muted-foreground mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          Powered by cutting-edge AI technology
        </motion.p>
      </motion.div>
    </div>
  );
}
