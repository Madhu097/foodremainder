import { ThemeProvider } from "../ThemeProvider";
import { AddFoodModal } from "../AddFoodModal";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function AddFoodModalExample() {
  const [open, setOpen] = useState(false);

  return (
    <ThemeProvider>
      <div className="p-6 bg-background">
        <Button onClick={() => setOpen(true)}>Open Add Food Modal</Button>
        <AddFoodModal
          open={open}
          onOpenChange={setOpen}
          onSave={(data) => console.log("Saved:", data)}
        />
      </div>
    </ThemeProvider>
  );
}
