import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Clock, ChefHat, CheckCircle2, RefreshCw, AlertCircle } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Recipe {
  id: string;
  title: string;
  description: string;
  prepTime: string;
  cookTime: string;
  difficulty: "Easy" | "Medium" | "Advanced";
  servings: number;
  expiringIngredientsUsed: string[];
  additionalPantryItems: string[];
  instructions: string[];
  nutritionalHighlight?: string;
}

interface AIRecipeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: string;
  foodItems: Array<{
    name: string;
    category: string;
    daysLeft: number;
    quantity?: string | null;
  }>;
}

export function AIRecipeModal({
  open,
  onOpenChange,
  userId,
  foodItems,
}: AIRecipeModalProps) {
  const { toast } = useToast();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  const expiringCount = foodItems.filter((i) => i.daysLeft <= 3).length;

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/recipes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          items: foodItems,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate recipes");
      }

      const data = await response.json();
      if (data.recipes && Array.isArray(data.recipes)) {
        setRecipes(data.recipes);
        setHasGenerated(true);
      }
    } catch (err: any) {
      toast({
        title: "Recipe Generation",
        description: err?.message || "Could not generate recipes right now.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Auto trigger generation on first open if empty
  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (isOpen && !hasGenerated && recipes.length === 0 && foodItems.length > 0) {
      handleGenerate();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl p-6">
        <DialogHeader className="space-y-2 pb-2 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Sparkles className="h-5 w-5" />
              </div>
              <DialogTitle className="text-xl font-bold tracking-tight">
                AI Zero-Waste Recipes
              </DialogTitle>
            </div>
            {hasGenerated && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerate}
                disabled={loading}
                className="text-xs h-8 gap-1.5"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                Regenerate
              </Button>
            )}
          </div>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
            Smart recipes personalized to your inventory, prioritizing{" "}
            <span className="font-semibold text-amber-600 dark:text-amber-400">
              {expiringCount} expiring item{expiringCount === 1 ? "" : "s"}
            </span>{" "}
            to prevent food waste.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-16 text-center space-y-4">
            <div className="inline-flex p-4 rounded-2xl bg-primary/10 text-primary animate-pulse">
              <ChefHat className="h-10 w-10 animate-bounce" />
            </div>
            <h4 className="font-semibold text-base">Chef Remi is crafting your menu...</h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Analyzing ingredients, expiry timelines, and complementary pantry staples.
            </p>
          </div>
        ) : foodItems.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto" />
            <h4 className="font-semibold text-base">Your inventory is empty</h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Add a few food items to your inventory to unlock personalized zero-waste recipe recommendations.
            </p>
          </div>
        ) : recipes.length === 0 ? (
          <div className="py-12 text-center space-y-4">
            <ChefHat className="h-12 w-12 text-primary/70 mx-auto" />
            <div>
              <h4 className="font-semibold text-base">Ready to transform your ingredients?</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Click generate to create tailored recipes from your {foodItems.length} stored food items.
              </p>
            </div>
            <Button onClick={handleGenerate} className="gap-2">
              <Sparkles className="h-4 w-4" />
              Generate My Recipes
            </Button>
          </div>
        ) : (
          <div className="space-y-6 pt-2">
            {recipes.map((recipe, idx) => (
              <div
                key={recipe.id || idx}
                className="border rounded-xl p-5 bg-card/80 shadow-xs hover:border-primary/40 transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{recipe.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{recipe.description}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className="text-xs font-normal gap-1">
                      <Clock className="h-3 w-3" />
                      {recipe.prepTime} prep • {recipe.cookTime} cook
                    </Badge>
                    <Badge variant="outline" className="text-xs font-normal">
                      {recipe.difficulty}
                    </Badge>
                    <Badge variant="outline" className="text-xs font-normal">
                      {recipe.servings} Servings
                    </Badge>
                  </div>
                </div>

                {/* Ingredients Used */}
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1.5 items-center">
                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 mr-1">
                      From your inventory:
                    </span>
                    {recipe.expiringIngredientsUsed.map((ing, i) => (
                      <Badge
                        key={i}
                        className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-xs font-medium"
                      >
                        ✓ {ing}
                      </Badge>
                    ))}
                  </div>

                  {recipe.additionalPantryItems?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 items-center">
                      <span className="text-xs font-medium text-muted-foreground mr-1">
                        Pantry staples needed:
                      </span>
                      {recipe.additionalPantryItems.map((ing, i) => (
                        <span
                          key={i}
                          className="text-xs bg-muted/60 px-2 py-0.5 rounded text-muted-foreground"
                        >
                          {ing}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Instructions */}
                <div className="space-y-2 pt-1">
                  <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Preparation Steps
                  </h5>
                  <ol className="space-y-2 text-xs sm:text-sm text-foreground/90 pl-1">
                    {recipe.instructions.map((step, stepIdx) => (
                      <li key={stepIdx} className="flex items-start gap-2.5">
                        <span className="h-5 w-5 rounded-full bg-primary/10 text-primary font-bold text-[11px] flex items-center justify-center flex-shrink-0 mt-0.5">
                          {stepIdx + 1}
                        </span>
                        <span className="leading-relaxed">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                {recipe.nutritionalHighlight && (
                  <div className="text-xs bg-primary/5 text-primary border border-primary/20 px-3 py-2 rounded-lg flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                    <span>{recipe.nutritionalHighlight}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

