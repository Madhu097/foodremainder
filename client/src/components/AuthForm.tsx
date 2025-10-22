import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Leaf, Apple, Carrot, Fish, Cookie, Pizza, Coffee, Mail, Phone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface RegisterFormData {
  username: string;
  email: string;
  mobile: string;
  password: string;
}

interface LoginFormData {
  identifier: string;
  password: string;
}

interface AuthFormProps {
  mode: "login" | "register";
  onSubmit?: (data: RegisterFormData | LoginFormData) => void;
  onToggleMode?: () => void;
  error?: string;
  isLoading?: boolean;
}

export function AuthForm({ mode, onSubmit, onToggleMode, error, isLoading }: AuthFormProps) {
  const [formData, setFormData] = useState<RegisterFormData | LoginFormData>(
    mode === "register" 
      ? { username: "", email: "", mobile: "", password: "" }
      : { identifier: "", password: "" }
  );
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Reset form data when mode changes
  useEffect(() => {
    console.log("[AuthForm] Mode changed to:", mode);
    setFormData(
      mode === "register" 
        ? { username: "", email: "", mobile: "", password: "" }
        : { identifier: "", password: "" }
    );
    setValidationErrors({});
  }, [mode]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (mode === "register") {
      const data = formData as RegisterFormData;
      if (!data.username || data.username.length < 3) {
        errors.username = "Username must be at least 3 characters";
      }
      if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.email = "Please enter a valid email address";
      }
      if (!data.mobile || !/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/.test(data.mobile)) {
        errors.mobile = "Please enter a valid mobile number";
      }
      if (!data.password || data.password.length < 6) {
        errors.password = "Password must be at least 6 characters";
      }
    } else {
      const data = formData as LoginFormData;
      if (!data.identifier) {
        errors.identifier = "Email or mobile number is required";
      }
      if (!data.password) {
        errors.password = "Password is required";
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[AuthForm] Submit triggered, mode:", mode);
    console.log("[AuthForm] Form data:", { ...formData, password: "***" });
    console.log("[AuthForm] Has onSubmit handler:", !!onSubmit);
    
    if (validateForm()) {
      console.log("[AuthForm] Validation passed, calling onSubmit");
      onSubmit?.(formData);
    } else {
      console.log("[AuthForm] Validation failed, errors:", validationErrors);
    }
  };

  // Food icons array for background
  const foodIcons = [
    { Icon: Apple, color: "text-red-500/20" },
    { Icon: Carrot, color: "text-orange-500/20" },
    { Icon: Fish, color: "text-blue-500/20" },
    { Icon: Cookie, color: "text-amber-500/20" },
    { Icon: Pizza, color: "text-yellow-500/20" },
    { Icon: Coffee, color: "text-brown-500/20" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
      {/* Subtle gradient orbs - optimized and softer */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -left-20 w-96 h-96 bg-gradient-to-br from-green-400/8 to-emerald-400/5 rounded-full blur-3xl will-change-transform" 
             style={{ animation: 'float 15s ease-in-out infinite' }} />
        <div className="absolute bottom-20 -right-20 w-96 h-96 bg-gradient-to-tl from-lime-400/8 to-green-400/5 rounded-full blur-3xl will-change-transform" 
             style={{ animation: 'float 18s ease-in-out infinite reverse' }} />
      </div>
      
      {/* Floating food icons */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {foodIcons.map((item, i) => (
          <motion.div
            key={i}
            className={`absolute ${item.color}`}
            style={{
              left: `${(i * 16 + 10) % 90}%`,
              top: `${(i * 20 + 15) % 80}%`,
            }}
            animate={{
              y: [0, -20, 0],
              rotate: [0, 10, -10, 0],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 8 + i * 2,
              repeat: Infinity,
              delay: i * 0.5,
              ease: "easeInOut",
            }}
          >
            <item.Icon className="w-12 h-12" />
          </motion.div>
        ))}
      </div>

      <motion.div
        className="w-full max-w-md relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        {/* Subtle glow effect */}
        <div className="absolute -inset-4 bg-gradient-to-r from-green-500/5 to-emerald-500/5 blur-2xl rounded-3xl" />
        
        <Card className="backdrop-blur-md bg-card/98 shadow-xl border border-green-200/50 dark:border-green-800/30 relative">
          <CardHeader className="space-y-4">
            <motion.div
              className="flex justify-center"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <div className="flex items-center gap-2 p-3 bg-gradient-to-br from-green-100 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/20 rounded-2xl shadow-sm">
                <Leaf className="h-8 w-8 text-green-600 dark:text-green-400" />
                <span className="text-2xl font-bold bg-gradient-to-r from-green-700 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">Food Reminder</span>
              </div>
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
                {mode === "register" ? (
                  <>
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
                        placeholder="Choose a username"
                        value={(formData as RegisterFormData).username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        required
                        data-testid="input-username"
                        className={`transition-all focus:scale-[1.02] ${validationErrors.username ? 'border-red-500' : ''}`}
                      />
                      {validationErrors.username && (
                        <p className="text-xs text-red-500">{validationErrors.username}</p>
                      )}
                    </motion.div>

                    <motion.div
                      className="space-y-2"
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.15 }}
                    >
                      <Label htmlFor="email" className="flex items-center gap-2">
                        <Mail className="w-4 h-4" /> Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your.email@example.com"
                        value={(formData as RegisterFormData).email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        data-testid="input-email"
                        className={`transition-all focus:scale-[1.02] ${validationErrors.email ? 'border-red-500' : ''}`}
                      />
                      {validationErrors.email && (
                        <p className="text-xs text-red-500">{validationErrors.email}</p>
                      )}
                    </motion.div>

                    <motion.div
                      className="space-y-2"
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Label htmlFor="mobile" className="flex items-center gap-2">
                        <Phone className="w-4 h-4" /> Mobile Number
                      </Label>
                      <Input
                        id="mobile"
                        type="tel"
                        placeholder="+1234567890"
                        value={(formData as RegisterFormData).mobile}
                        onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                        required
                        data-testid="input-mobile"
                        className={`transition-all focus:scale-[1.02] ${validationErrors.mobile ? 'border-red-500' : ''}`}
                      />
                      {validationErrors.mobile && (
                        <p className="text-xs text-red-500">{validationErrors.mobile}</p>
                      )}
                    </motion.div>

                    <motion.div
                      className="space-y-2"
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.25 }}
                    >
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="At least 6 characters"
                        value={(formData as RegisterFormData).password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                        data-testid="input-password"
                        className={`transition-all focus:scale-[1.02] ${validationErrors.password ? 'border-red-500' : ''}`}
                      />
                      {validationErrors.password && (
                        <p className="text-xs text-red-500">{validationErrors.password}</p>
                      )}
                    </motion.div>
                  </>
                ) : (
                  <>
                    <motion.div
                      className="space-y-2"
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.1 }}
                    >
                      <Label htmlFor="identifier">Email or Mobile Number</Label>
                      <Input
                        id="identifier"
                        type="text"
                        placeholder="Enter your email or mobile number"
                        value={(formData as LoginFormData).identifier}
                        onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                        required
                        data-testid="input-identifier"
                        className={`transition-all focus:scale-[1.02] ${validationErrors.identifier ? 'border-red-500' : ''}`}
                      />
                      {validationErrors.identifier && (
                        <p className="text-xs text-red-500">{validationErrors.identifier}</p>
                      )}
                    </motion.div>

                    <motion.div
                      className="space-y-2"
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                        <Link href="/forgot-password">
                          <button type="button" className="text-xs text-primary hover:underline">
                            Forgot Password?
                          </button>
                        </Link>
                      </div>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        value={(formData as LoginFormData).password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                        data-testid="input-password"
                        className={`transition-all focus:scale-[1.02] ${validationErrors.password ? 'border-red-500' : ''}`}
                      />
                      {validationErrors.password && (
                        <p className="text-xs text-red-500">{validationErrors.password}</p>
                      )}
                    </motion.div>
                  </>
                )}

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400"
                  >
                    {error}
                  </motion.div>
                )}

                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <Button
                    type="submit"
                    className="w-full shadow-md hover:shadow-lg transition-all duration-200 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                    data-testid="button-submit"
                    disabled={isLoading}
                  >
                    {isLoading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
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

        <motion.div
          className="text-center space-y-2 mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <p className="text-sm text-muted-foreground">
            🌱 Reduce food waste, save money, help the planet
          </p>
          <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground/60">
            <span>🔒 Secure</span>
            <span>•</span>
            <span>⚡ Fast</span>
            <span>•</span>
            <span>🍎 Smart</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
