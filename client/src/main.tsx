import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initPerformanceOptimizations } from "./lib/performance";

// Initialize performance optimizations
initPerformanceOptimizations();

// Render app
createRoot(document.getElementById("root")!).render(<App />);
