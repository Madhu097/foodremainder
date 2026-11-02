import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { Camera, Loader2, Sparkles, Check, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL } from "@/lib/api";

interface AddFoodModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (data: FoodFormData) => void;
  editData?: FoodFormData | null;
}

export interface FoodFormData {
  name: string;
  category: string;
  purchaseDate: string;
  expiryDate: string;
  quantity?: string;
  notes?: string;
  barcode?: string;
}

const categories = [
  "Dairy",
  "Fruits",
  "Vegetables",
  "Meat",
  "Seafood",
  "Grains",
  "Beverages",
  "Snacks",
  "Other",
];

interface AIPrediction {
  category: string;
  shelfLifeDays: number;
  storageLocation: "fridge" | "pantry" | "freezer";
  storageTips: string;
}

export function AddFoodModal({ open, onOpenChange, onSave, editData }: AddFoodModalProps) {
  const { toast } = useToast();
  const [showScanner, setShowScanner] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [aiPredicting, setAiPredicting] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<AIPrediction | null>(null);

  const [formData, setFormData] = useState<FoodFormData>({
    name: "",
    category: "",
    purchaseDate: new Date().toISOString().split("T")[0],
    expiryDate: "",
    quantity: "",
    notes: "",
    barcode: "",
  });

  // Update form data when editData changes
  useEffect(() => {
    if (editData) {
      setFormData(editData);
      setAiSuggestion(null);
    } else {
      setFormData({
        name: "",
        category: "",
        purchaseDate: new Date().toISOString().split("T")[0],
        expiryDate: "",
        quantity: "",
        notes: "",
        barcode: "",
      });
      setAiSuggestion(null);
    }
  }, [editData, open]);

  // Debounced AI Shelf-Life prediction when typing food name
  useEffect(() => {
    if (editData || !formData.name || formData.name.trim().length < 2) {
      setAiSuggestion(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setAiPredicting(true);
        const res = await fetch(`${API_BASE_URL}/api/ai/predict-shelf-life`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            foodName: formData.name,
            category: formData.category || undefined,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.prediction) {
            setAiSuggestion(data.prediction);
          }
        }
      } catch (err) {
        // Silently ignore background AI suggestion errors
      } finally {
        setAiPredicting(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [formData.name, editData]);

  const applyAiSuggestion = () => {
    if (!aiSuggestion) return;

    // Calculate expiry date based on purchase date + shelf life days
    const baseDate = formData.purchaseDate ? new Date(formData.purchaseDate) : new Date();
    baseDate.setDate(baseDate.getDate() + aiSuggestion.shelfLifeDays);
    const calculatedExpiry = baseDate.toISOString().split("T")[0];

    setFormData((prev) => ({
      ...prev,
      category: prev.category || aiSuggestion.category,
      expiryDate: calculatedExpiry,
      notes: prev.notes
        ? `${prev.notes} • ${aiSuggestion.storageTips}`
        : aiSuggestion.storageTips,
    }));

    toast({
      title: "AI Suggestion Applied",
      description: `Estimated ${aiSuggestion.shelfLifeDays} days shelf-life (${aiSuggestion.storageLocation}).`,
    });
  };

  // Lookup product info from barcode using Open Food Facts API
  const lookupBarcode = async (barcode: string) => {
    setIsLookingUp(true);
    try {
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const data = await response.json();

      if (data.status === 1 && data.product) {
        const product = data.product;

        let name = product.product_name || "";
        let category = "";

        if (product.categories_tags && product.categories_tags.length > 0) {
          const catTag = product.categories_tags[0].split(":")[1] || "";
          const categoryMap: { [key: string]: string } = {
            dairy: "Dairy",
            fruits: "Fruits",
            vegetables: "Vegetables",
            meat: "Meat",
            seafood: "Seafood",
            grains: "Grains",
            beverages: "Beverages",
            snacks: "Snacks",
          };

          const matched = Object.keys(categoryMap).find((k) =>
            catTag.toLowerCase().includes(k)
          );
          if (matched) category = categoryMap[matched];
        }

        setFormData((prev) => ({
          ...prev,
          name: name || prev.name,
          category: category || prev.category,
        }));

        toast({
          title: "Product Identified",
          description: `Loaded details for ${name || "scanned product"}`,
        });
      } else {
        toast({
          title: "Barcode Not Found",
          description: "Enter product details manually.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Barcode lookup error:", error);
      toast({
        title: "Lookup Failed",
        description: "Could not fetch product details. Please enter manually.",
        variant: "destructive",
      });
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleBarcodeScanned = (barcode: string) => {
    setFormData((prev) => ({ ...prev, barcode }));
    setShowScanner(false);
    lookupBarcode(barcode);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave?.(formData);
    onOpenChange(false);
    setFormData({
      name: "",
      category: "",
      purchaseDate: new Date().toISOString().split("T")[0],
      expiryDate: "",
      quantity: "",
      notes: "",
    });
    setAiSuggestion(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-2xl p-6" data-testid="modal-add-food">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-xl font-bold tracking-tight">
            {editData ? "Edit Food Item" : "Add Food Item"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {editData
              ? "Update the details and expiry schedule for your item."
              : "Track freshness and receive timely alerts across your channels."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Quick Barcode Scan Section */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Quick Barcode Auto-Fill
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="Scan or enter barcode"
                value={formData.barcode || ""}
                onChange={(e) => {
                  const barcode = e.target.value;
                  setFormData({ ...formData, barcode });
                  if (barcode.length >= 8) lookupBarcode(barcode);
                }}
                className="flex-1 text-xs h-9 rounded-xl"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowScanner(true)}
                disabled={isLookingUp}
                className="gap-1.5 text-xs h-9 rounded-xl"
              >
                {isLookingUp ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <Camera className="h-3.5 w-3.5" />
                    Scan
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Food Name & AI Shelf-Life Suggestion */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="name" className="text-xs font-semibold">
                Food Name <span className="text-rose-500">*</span>
              </Label>
              {aiPredicting && (
                <span className="text-[11px] text-muted-foreground flex items-center gap-1 animate-pulse">
                  <Sparkles className="h-3 w-3 text-primary" /> Estimating shelf-life...
                </span>
              )}
            </div>
            <Input
              id="name"
              placeholder="e.g., Organic Blueberries, Greek Yogurt"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="text-xs h-9 rounded-xl"
              data-testid="input-food-name"
            />

            {/* AI Shelf-Life Suggestion Box */}
            {aiSuggestion && !formData.expiryDate && (
              <div className="p-2.5 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between gap-2 transition-all">
                <div className="flex items-start gap-2 min-w-0">
                  <Sparkles className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground">
                      AI Estimated: ~{aiSuggestion.shelfLifeDays} days ({aiSuggestion.storageLocation})
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {aiSuggestion.storageTips}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="h-7 text-xs px-2.5 rounded-lg flex-shrink-0 gap-1 bg-primary/10 hover:bg-primary/20 text-primary"
                  onClick={applyAiSuggestion}
                >
                  <Check className="h-3 w-3" />
                  Apply
                </Button>
              </div>
            )}
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label htmlFor="category" className="text-xs font-semibold">
              Category <span className="text-rose-500">*</span>
            </Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
              required
            >
              <SelectTrigger className="text-xs h-9 rounded-xl" data-testid="select-category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat} className="text-xs">
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="purchaseDate" className="text-xs font-semibold">
                Purchase Date
              </Label>
              <Input
                id="purchaseDate"
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                required
                className="text-xs h-9 rounded-xl"
                data-testid="input-purchase-date"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="expiryDate" className="text-xs font-semibold">
                Expiry Date <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                required
                className="text-xs h-9 rounded-xl"
                data-testid="input-expiry-date"
              />
            </div>
          </div>

          {/* Quantity & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="quantity" className="text-xs font-semibold">
                Quantity (Optional)
              </Label>
              <Input
                id="quantity"
                placeholder="e.g., 500g, 1 bottle"
                value={formData.quantity || ""}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="text-xs h-9 rounded-xl"
                data-testid="input-quantity"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes" className="text-xs font-semibold">
                Storage Notes (Optional)
              </Label>
              <Input
                id="notes"
                placeholder="e.g., Crisper drawer, Freeze"
                value={formData.notes || ""}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="text-xs h-9 rounded-xl"
                data-testid="input-notes"
              />
            </div>
          </div>

          <div className="flex gap-2.5 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 text-xs h-9 rounded-xl"
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 text-xs h-9 rounded-xl font-medium"
              data-testid="button-save"
            >
              {editData ? "Update Item" : "Save Item"}
            </Button>
          </div>
        </form>
      </DialogContent>

      {/* Barcode Scanner Modal */}
      {showScanner && (
        <BarcodeScanner
          onScan={handleBarcodeScanned}
          onClose={() => setShowScanner(false)}
        />
      )}
    </Dialog>
  );
}
