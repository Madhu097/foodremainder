import { ThemeProvider } from "../ThemeProvider";
import { FoodItemCard, FoodItem } from "../FoodItemCard";

export default function FoodItemCardExample() {
  const sampleItems: FoodItem[] = [
    {
      id: "1",
      name: "Fresh Milk",
      category: "Dairy",
      purchaseDate: "2025-10-05",
      expiryDate: "2025-10-15",
      status: "fresh",
      daysLeft: 5,
    },
    {
      id: "2",
      name: "Strawberries",
      category: "Fruits",
      purchaseDate: "2025-10-08",
      expiryDate: "2025-10-12",
      status: "expiring",
      daysLeft: 2,
    },
    {
      id: "3",
      name: "Greek Yogurt",
      category: "Dairy",
      purchaseDate: "2025-10-01",
      expiryDate: "2025-10-09",
      status: "expired",
      daysLeft: -1,
    },
  ];

  return (
    <ThemeProvider>
      <div className="p-6 bg-background">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {sampleItems.map((item) => (
            <FoodItemCard
              key={item.id}
              item={item}
              onEdit={(item) => console.log("Edit:", item)}
              onDelete={(item) => console.log("Delete:", item)}
            />
          ))}
        </div>
      </div>
    </ThemeProvider>
  );
}
