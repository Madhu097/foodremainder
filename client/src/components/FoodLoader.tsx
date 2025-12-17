import { motion } from "framer-motion";

interface FoodLoaderProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function FoodLoader({ className = "", size = "md" }: FoodLoaderProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      {/* Clock face */}
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-primary/30"
        animate={{ rotate: 360 }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      
      {/* Food items orbiting */}
      <motion.div
        className="absolute inset-0"
        animate={{ rotate: -360 }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        {/* Apple emoji */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 text-xs">
          🍎
        </div>
      </motion.div>

      <motion.div
        className="absolute inset-0"
        animate={{ rotate: -360 }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        {/* Bread emoji */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-xs">
          🍞
        </div>
      </motion.div>

      <motion.div
        className="absolute inset-0"
        animate={{ rotate: -360 }}
        transition={{
          duration: 2.2,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        {/* Milk emoji */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 text-xs">
          🥛
        </div>
      </motion.div>

      <motion.div
        className="absolute inset-0"
        animate={{ rotate: -360 }}
        transition={{
          duration: 2.8,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        {/* Cheese emoji */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 text-xs">
          🧀
        </div>
      </motion.div>

      {/* Clock hands in center */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
      >
        <motion.div
          className="w-0.5 h-[30%] bg-primary origin-bottom"
          style={{ position: "absolute", bottom: "50%" }}
          animate={{ rotate: 360 }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        <motion.div
          className="w-0.5 h-[40%] bg-primary/60 origin-bottom"
          style={{ position: "absolute", bottom: "50%" }}
          animate={{ rotate: 360 }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        <div className="w-1 h-1 rounded-full bg-primary absolute" />
      </motion.div>
    </div>
  );
}

// Alternative: Simpler bouncing food loader
export function BouncingFoodLoader({ className = "", size = "md" }: FoodLoaderProps) {
  const sizeClasses = {
    sm: "text-sm",
    md: "text-2xl",
    lg: "text-4xl",
  };

  const foods = ["🍎", "🍞", "🥛", "🧀"];

  return (
    <div className={`flex gap-2 ${className}`}>
      {foods.map((food, index) => (
        <motion.div
          key={index}
          className={sizeClasses[size]}
          animate={{
            y: [0, -10, 0],
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: index * 0.15,
            ease: "easeInOut",
          }}
        >
          {food}
        </motion.div>
      ))}
    </div>
  );
}

// Hourglass with food
export function FoodHourglassLoader({ className = "", size = "md" }: FoodLoaderProps) {
  const sizeClasses = {
    sm: "w-6 h-8",
    md: "w-8 h-12",
    lg: "w-12 h-16",
  };

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      {/* Hourglass shape */}
      <svg className="w-full h-full text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 2h12M6 22h12M6 2v6l6 6-6 6v6M18 2v6l-6 6 6 6v6" />
      </svg>
      
      {/* Falling food particle */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 text-xs"
        animate={{
          y: ["20%", "60%"],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeIn",
        }}
      >
        🍎
      </motion.div>
      
      {/* Accumulating food at bottom */}
      <motion.div
        className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs opacity-60"
      >
        🍞🥛
      </motion.div>
    </div>
  );
}
