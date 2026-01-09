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
import { Camera, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

export function AddFoodModal({ open, onOpenChange, onSave, editData }: AddFoodModalProps) {
  const { toast } = useToast();
  const [showScanner, setShowScanner] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);

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
    }
  }, [editData]);

  // Lookup product info from barcode using Open Food Facts API
  const lookupBarcode = async (barcode: string) => {
    setIsLookingUp(true);
    try {
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const data = await response.json();

      if (data.status === 1 && data.product) {
        const product = data.product;

        // Auto-fill product name
        if (product.product_name) {
          setFormData(prev => ({ ...prev, name: product.product_name }));
        }

        // Try to determine category
        if (product.categories_tags && product.categories_tags.length > 0) {
          const category = product.categories_tags[0].split(':')[1];
          const categoryMap: { [key: string]: string } = {
            'dairy': 'Dairy',
            'fruits': 'Fruits',
            'vegetables': 'Vegetables',
            'meat': 'Meat',
            'seafood': 'Seafood',
            'grains': 'Grains',
            'beverages': 'Beverages',
            'snacks': 'Snacks',
          };

          const matchedCategory = Object.keys(categoryMap).find(key =>
            category.toLowerCase().includes(key)
          );

          if (matchedCategory) {
            setFormData(prev => ({ ...prev, category: categoryMap[matchedCategory] }));
          }
        }

        toast({
          title: "Product Found!",
          description: `Loaded details for ${product.product_name || 'product'}`,
        });
      } else {
        toast({
          title: "Product Not Found",
          description: "Please enter product details manually",
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
    setFormData(prev => ({ ...prev, barcode }));
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
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" data-testid="modal-add-food">
        <DialogHeader>
          <DialogTitle>{editData ? "Edit Food Item" : "Add Food Item"}</DialogTitle>
          <DialogDescription>
            {editData
              ? "Update the details of your food item."
              : "Add a new food item to track its expiry date."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Barcode Scanner Section */}
          <div className="space-y-2">
            <Label>Barcode Scanner</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Scan or enter barcode"
                value={formData.barcode || ""}
                onChange={(e) => {
                  const barcode = e.target.value;
                  setFormData({ ...formData, barcode });
                  if (barcode.length >= 8) {
                    lookupBarcode(barcode);
                  }
                }}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowScanner(true)}
                disabled={isLookingUp}
                className="gap-2"
              >
                {isLookingUp ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Looking up...
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4" />
                    Scan
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Scan a barcode to auto-fill product details
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Food Name</Label>
            <Input
              id="name"
              placeholder="e.g., Fresh Milk"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              data-testid="input-food-name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
              required
            >
              <SelectTrigger data-testid="select-category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="purchaseDate">Purchase Date</Label>
              <Input
                id="purchaseDate"
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                required
                data-testid="input-purchase-date"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry Date</Label>
              <Input
                id="expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                required
                data-testid="input-expiry-date"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity (Optional)</Label>
            <Input
              id="quantity"
              placeholder="e.g., 1 Liter, 500g, 2 pieces"
              value={formData.quantity || ""}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              data-testid="input-quantity"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Input
              id="notes"
              placeholder="e.g., Organic, Low-fat, Store in fridge"
              value={formData.notes || ""}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              data-testid="input-notes"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" data-testid="button-save">
              {editData ? "Update" : "Add"} Item
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
