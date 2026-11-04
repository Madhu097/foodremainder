/**
 * AI Service for Food Reminder
 * Provides:
 * 1. Smart Shelf-Life & Expiration Prediction
 * 2. High-Accuracy Zero-Waste Recipe Generation strictly matching inventory products
 * 3. AI Kitchen & Preservation Assistant (Chef Remi)
 * 
 * Supports Google Gemini API (GEMINI_API_KEY / GOOGLE_API_KEY) with
 * an intelligent, culinary-accurate knowledge engine fallback for 100% uptime.
 */

export interface ShelfLifePrediction {
  foodName: string;
  category: string;
  shelfLifeDays: number;
  storageLocation: "fridge" | "pantry" | "freezer";
  storageTips: string;
  confidence: number;
}

export interface GeneratedRecipe {
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

export interface FoodInventoryContext {
  name: string;
  category?: string;
  daysLeft?: number;
  quantity?: string | null;
}

// Built-in intelligent food shelf-life & storage knowledge base
const FOOD_KNOWLEDGE_BASE: Record<string, { category: string; shelfLifeDays: number; storage: "fridge" | "pantry" | "freezer"; tips: string }> = {
  // Dairy
  milk: { category: "Dairy", shelfLifeDays: 7, storage: "fridge", tips: "Keep in the main fridge body, not the door where temperature fluctuates." },
  cheese: { category: "Dairy", shelfLifeDays: 21, storage: "fridge", tips: "Wrap in parchment paper rather than plastic wrap to let it breathe." },
  yogurt: { category: "Dairy", shelfLifeDays: 14, storage: "fridge", tips: "Keep tightly sealed; watery whey separation is natural—just stir it in." },
  butter: { category: "Dairy", shelfLifeDays: 60, storage: "fridge", tips: "Can be frozen for up to 9 months if unopened." },
  cream: { category: "Dairy", shelfLifeDays: 10, storage: "fridge", tips: "Use within 7-10 days after opening." },
  paneer: { category: "Dairy", shelfLifeDays: 5, storage: "fridge", tips: "Submerge in fresh water in an airtight container to keep moist." },
  egg: { category: "Dairy", shelfLifeDays: 28, storage: "fridge", tips: "Keep in carton in main fridge shelf, not on door rack." },

  // Fruits
  banana: { category: "Fruits", shelfLifeDays: 5, storage: "pantry", tips: "Store away from other fruits to prevent rapid ripening from ethylene gas." },
  apple: { category: "Fruits", shelfLifeDays: 28, storage: "fridge", tips: "Apples last 3-4x longer in the crisper drawer than at room temperature." },
  strawberry: { category: "Fruits", shelfLifeDays: 4, storage: "fridge", tips: "Do not wash until right before eating to prevent mold." },
  berries: { category: "Fruits", shelfLifeDays: 5, storage: "fridge", tips: "Store in a single layer lined with paper towel in a breathable container." },
  orange: { category: "Fruits", shelfLifeDays: 21, storage: "fridge", tips: "Can stay at room temp for 1 week, or crisper drawer for 3-4 weeks." },
  lemon: { category: "Fruits", shelfLifeDays: 21, storage: "fridge", tips: "Store in a sealed bag in the fridge to keep juicy." },
  avocado: { category: "Fruits", shelfLifeDays: 4, storage: "pantry", tips: "Ripen on counter, then move to fridge to prolong freshness by 3-5 days." },
  tomato: { category: "Fruits", shelfLifeDays: 7, storage: "pantry", tips: "Store stem-side down at room temp. Refrigeration ruins texture and flavor." },
  mango: { category: "Fruits", shelfLifeDays: 6, storage: "pantry", tips: "Keep at room temp until soft and fragrant, then refrigerate." },
  watermelon: { category: "Fruits", shelfLifeDays: 7, storage: "fridge", tips: "Cover cut surfaces tightly with cling film and keep chilled." },
  grapes: { category: "Fruits", shelfLifeDays: 10, storage: "fridge", tips: "Keep in original perforated bag in produce drawer; wash before eating." },

  // Vegetables
  spinach: { category: "Vegetables", shelfLifeDays: 5, storage: "fridge", tips: "Place a dry paper towel in the box to absorb excess moisture." },
  lettuce: { category: "Vegetables", shelfLifeDays: 7, storage: "fridge", tips: "Keep leaves dry. Wrap in a cloth or paper towel inside crisper." },
  carrot: { category: "Vegetables", shelfLifeDays: 21, storage: "fridge", tips: "Remove green tops before storing; they pull moisture from roots." },
  potato: { category: "Vegetables", shelfLifeDays: 30, storage: "pantry", tips: "Store in a cool, dark, ventilated spot. Never next to onions." },
  onion: { category: "Vegetables", shelfLifeDays: 30, storage: "pantry", tips: "Keep dry and ventilated. Do not store in plastic bags." },
  garlic: { category: "Vegetables", shelfLifeDays: 60, storage: "pantry", tips: "Keep whole heads in an open container at room temp." },
  broccoli: { category: "Vegetables", shelfLifeDays: 7, storage: "fridge", tips: "Mist heads loosely or wrap in damp paper towel." },
  cucumber: { category: "Vegetables", shelfLifeDays: 7, storage: "fridge", tips: "Sensitive to cold; keep near front of fridge or warm zone." },
  bell_pepper: { category: "Vegetables", shelfLifeDays: 10, storage: "fridge", tips: "Keep whole and dry in crisper drawer." },
  capsicum: { category: "Vegetables", shelfLifeDays: 10, storage: "fridge", tips: "Store whole in produce drawer with low humidity." },
  mushroom: { category: "Vegetables", shelfLifeDays: 6, storage: "fridge", tips: "Keep in original brown paper bag to let moisture escape." },
  cabbage: { category: "Vegetables", shelfLifeDays: 21, storage: "fridge", tips: "Keep whole head unwashed in crisper drawer." },
  cauliflower: { category: "Vegetables", shelfLifeDays: 10, storage: "fridge", tips: "Store stem-side up in a perforated bag to prevent condensation." },

  // Meat & Seafood
  chicken: { category: "Meat", shelfLifeDays: 2, storage: "fridge", tips: "Keep on lowest fridge shelf to avoid drips. Freeze if not cooking within 48h." },
  beef: { category: "Meat", shelfLifeDays: 3, storage: "fridge", tips: "Ground beef lasts 1-2 days; whole cuts last 3-5 days refrigerated." },
  fish: { category: "Seafood", shelfLifeDays: 2, storage: "fridge", tips: "Cook within 24-48 hours or freeze immediately." },
  salmon: { category: "Seafood", shelfLifeDays: 2, storage: "fridge", tips: "Keep on a bed of ice or in the coldest corner of the fridge." },
  prawns: { category: "Seafood", shelfLifeDays: 2, storage: "fridge", tips: "Thaw slowly in fridge, cook promptly." },

  // Grains & Bakery
  bread: { category: "Grains", shelfLifeDays: 6, storage: "pantry", tips: "Avoid fridge (causes staling). Slice and freeze for long-term storage." },
  rice: { category: "Grains", shelfLifeDays: 180, storage: "pantry", tips: "Store in airtight jar in dry pantry. Cooked rice lasts 3-4 days in fridge." },
  pasta: { category: "Grains", shelfLifeDays: 365, storage: "pantry", tips: "Dry pasta lasts 1-2 years. Cooked pasta lasts 4-5 days." },
  flour: { category: "Grains", shelfLifeDays: 240, storage: "pantry", tips: "Seal tightly in container to prevent pantry bugs." },
  oats: { category: "Grains", shelfLifeDays: 180, storage: "pantry", tips: "Keep cool and dry. Ideal container prevents humidity absorption." },
};

type FoodCategoryType = "fruit" | "vegetable" | "dairy" | "meat" | "grain" | "other";

function classifyIngredient(name: string, category?: string): FoodCategoryType {
  const n = name.toLowerCase();
  const c = (category || "").toLowerCase();

  if (c.includes("fruit") || /banana|apple|strawberry|berry|berries|blueberry|raspberry|orange|mango|pineapple|watermelon|melon|grape|peach|pear|plum|kiwi|papaya|lemon|lime|avocado|cherry|dates|figs/.test(n)) {
    return "fruit";
  }
  if (c.includes("dairy") || /milk|cheese|yogurt|curd|paneer|butter|cream|cottage cheese|mozzarella|cheddar|parmesan|ghee/.test(n)) {
    return "dairy";
  }
  if (c.includes("meat") || c.includes("seafood") || /chicken|fish|salmon|tuna|shrimp|prawn|egg|eggs|beef|pork|mutton|lamb|bacon|sausage|turkey|tofu/.test(n)) {
    return "meat";
  }
  if (c.includes("veg") || /tomato|potato|onion|garlic|carrot|broccoli|spinach|lettuce|cabbage|cauliflower|bell pepper|capsicum|mushroom|cucumber|zucchini|ginger|chili|peas|corn|celery|beans|kale|brinjal|eggplant/.test(n)) {
    return "vegetable";
  }
  if (c.includes("grain") || c.includes("bakery") || /bread|rice|pasta|noodle|noodles|oat|oats|oatmeal|flour|tortilla|roti|chapati|bun|toast|cereal/.test(n)) {
    return "grain";
  }
  return "other";
}

class AIService {
  private apiKey: string | null = null;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || null;
  }

  private hasGeminiKey(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 10);
  }

  /**
   * Predict shelf life and storage recommendations for a given food item name
   */
  async predictShelfLife(foodName: string, userCategory?: string): Promise<ShelfLifePrediction> {
    const cleanName = foodName.toLowerCase().trim();

    // 1. If Gemini API is configured, ask Gemini
    if (this.hasGeminiKey()) {
      try {
        const prompt = `As a culinary preservation expert, return JSON only for this food item: "${foodName}".
Format:
{
  "category": "Dairy" | "Fruits" | "Vegetables" | "Meat" | "Seafood" | "Grains" | "Beverages" | "Snacks" | "Other",
  "shelfLifeDays": number,
  "storageLocation": "fridge" | "pantry" | "freezer",
  "storageTips": "Short practical sentence on best storage method."
}`;

        const response = await this.callGemini(prompt);
        if (response) {
          const parsed = this.parseJsonFromMarkdown(response);
          if (parsed && parsed.shelfLifeDays) {
            return {
              foodName,
              category: parsed.category || userCategory || "Other",
              shelfLifeDays: Math.max(1, Number(parsed.shelfLifeDays) || 7),
              storageLocation: parsed.storageLocation || "fridge",
              storageTips: parsed.storageTips || "Keep sealed in a cool environment.",
              confidence: 0.95,
            };
          }
        }
      } catch (err) {
        console.warn("[AIService] Gemini call failed, falling back to knowledge base:", err);
      }
    }

    // 2. Intelligent Knowledge Base lookup
    for (const [key, value] of Object.entries(FOOD_KNOWLEDGE_BASE)) {
      if (cleanName.includes(key) || key.includes(cleanName)) {
        return {
          foodName,
          category: userCategory || value.category,
          shelfLifeDays: value.shelfLifeDays,
          storageLocation: value.storage,
          storageTips: value.tips,
          confidence: 0.9,
        };
      }
    }

    // 3. Category heuristic
    const cat = (userCategory || "").toLowerCase();
    if (cat.includes("dairy")) {
      return { foodName, category: "Dairy", shelfLifeDays: 7, storageLocation: "fridge", storageTips: "Store in coldest section of the refrigerator.", confidence: 0.75 };
    }
    if (cat.includes("fruit")) {
      return { foodName, category: "Fruits", shelfLifeDays: 6, storageLocation: "fridge", storageTips: "Keep unwashed in the produce drawer.", confidence: 0.75 };
    }
    if (cat.includes("veg")) {
      return { foodName, category: "Vegetables", shelfLifeDays: 7, storageLocation: "fridge", storageTips: "Wrap in a dry cloth or paper towel to control moisture.", confidence: 0.75 };
    }
    if (cat.includes("meat")) {
      return { foodName, category: "Meat", shelfLifeDays: 3, storageLocation: "fridge", storageTips: "Keep chilled on bottom shelf or freeze immediately.", confidence: 0.8 };
    }
    if (cat.includes("seafood") || cat.includes("fish")) {
      return { foodName, category: "Seafood", shelfLifeDays: 2, storageLocation: "fridge", storageTips: "Cook within 48 hours or freeze.", confidence: 0.85 };
    }
    if (cat.includes("grain") || cat.includes("bread")) {
      return { foodName, category: "Grains", shelfLifeDays: 14, storageLocation: "pantry", storageTips: "Store in an airtight container away from moisture.", confidence: 0.7 };
    }

    return {
      foodName,
      category: userCategory || "Other",
      shelfLifeDays: 7,
      storageLocation: "fridge",
      storageTips: "Keep sealed in an airtight container to retain quality.",
      confidence: 0.6,
    };
  }

  /**
   * Generate zero-waste recipes strictly prioritizing the user's available and expiring foods
   */
  async generateRecipes(
    items: FoodInventoryContext[],
    preferences?: { mealType?: string; dietaryRestrictions?: string }
  ): Promise<GeneratedRecipe[]> {
    if (!items || items.length === 0) {
      return [];
    }

    // Sort items so expiring items come first
    const sortedItems = [...items].sort((a, b) => (a.daysLeft ?? 99) - (b.daysLeft ?? 99));
    const availableNames = sortedItems.map((i) => i.name).slice(0, 15);
    const expiringItems = sortedItems.filter((i) => (i.daysLeft !== undefined ? i.daysLeft <= 4 : true));

    // 1. Try Gemini generation if configured
    if (this.hasGeminiKey()) {
      try {
        const prompt = `You are an expert master chef specialized in zero-waste cooking.
The user has these EXACT food items in their kitchen:
All Items: ${availableNames.join(", ")}
Expiring Soonest: ${expiringItems.map((i) => `${i.name} (${i.daysLeft ?? "?"} days left)`).join(", ")}
Preferences: Meal type: ${preferences?.mealType || "any"}, Dietary: ${preferences?.dietaryRestrictions || "none"}

CRITICAL CULINARY RULES:
1. ONLY generate recipes whose flavor combinations make genuine culinary sense. NEVER mix incompatible items (e.g. NEVER put bananas, strawberries, or milk into garlic-egg stir-fries or savory soy-sauce vegetable bowls).
2. If the user has sweet items (fruits, sweet dairy, oats, bread), create delicious sweet/breakfast dishes (smoothies, fruit bowls, baked toast, parfaits).
3. If the user has savory items (vegetables, proteins, grains, garlic, tomatoes), create savory dishes (sauté, stir-fry, curry, soup, pasta, grain bowl).
4. In "expiringIngredientsUsed", ONLY list names that appear in the user's list.
5. In "instructions", explicitly mention the user's exact ingredient names.

Return ONLY valid JSON matching this exact structure:
[
  {
    "id": "recipe-1",
    "title": "Exact Title Mentioning Key Items",
    "description": "Short appetizing description highlighting the zero-waste benefits",
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "difficulty": "Easy" | "Medium" | "Advanced",
    "servings": 2,
    "expiringIngredientsUsed": ["Exact Item 1", "Exact Item 2"],
    "additionalPantryItems": ["Salt", "Cooking Oil", "Garlic"],
    "instructions": [
      "Step 1...",
      "Step 2...",
      "Step 3..."
    ],
    "nutritionalHighlight": "High in vitamins and gut-friendly fiber"
  }
]`;

        const response = await this.callGemini(prompt);
        if (response) {
          const parsed = this.parseJsonFromMarkdown(response);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (err) {
        console.warn("[AIService] Gemini recipe generation fallback triggered:", err);
      }
    }

    // 2. High-Accuracy Culinary Heuristic Engine (100% relevant to actual user products)
    return this.generateSmartCulinaryRecipes(sortedItems, preferences?.mealType);
  }

  /**
   * Dynamic, ingredient-accurate zero-waste recipe generator
   * Matches compatible ingredients together with zero culinary mismatches.
   */
  private generateSmartCulinaryRecipes(items: FoodInventoryContext[], mealType?: string): GeneratedRecipe[] {
    const categorized = items.map(item => ({
      ...item,
      type: classifyIngredient(item.name, item.category),
    }));

    const fruits = categorized.filter(i => i.type === "fruit");
    const veggies = categorized.filter(i => i.type === "vegetable");
    const dairy = categorized.filter(i => i.type === "dairy");
    const meats = categorized.filter(i => i.type === "meat");
    const grains = categorized.filter(i => i.type === "grain");

    const recipes: GeneratedRecipe[] = [];

    // Helper: format names nicely
    const joinNames = (arr: (string | { name: string })[]) => {
      if (arr.length === 0) return "";
      const names = arr.map(x => typeof x === "string" ? x : x.name);
      if (names.length === 1) return names[0];
      if (names.length === 2) return `${names[0]} and ${names[1]}`;
      return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
    };

    // CLUSTER 1: FRUIT & SWEET BREAKFAST / DESSERT
    if (fruits.length > 0) {
      const mainFruits = fruits.slice(0, 3);
      const usedDairy = dairy.find(d => /milk|yogurt|curd|cream/i.test(d.name));
      const usedGrain = grains.find(g => /oat|bread|toast/i.test(g.name));

      const ingredientsUsed = mainFruits.map(f => f.name);
      if (usedDairy) ingredientsUsed.push(usedDairy.name);
      if (usedGrain) ingredientsUsed.push(usedGrain.name);

      const title = `Fresh ${joinNames(mainFruits)} ${usedDairy ? "Smoothie & Parfait Bowl" : "Antioxidant Fruit Bowl"}`;
      const instructions = [
        `Thoroughly wash and prep your ${joinNames(mainFruits)}, peeling or slicing into bite-sized pieces.`,
        usedDairy 
          ? `Combine the ${mainFruits[0].name} with chilled ${usedDairy.name} in a blender (or bowl) and blend until velvety smooth.`
          : `Arrange the freshly cut ${joinNames(mainFruits)} in a clean serving bowl.`,
        usedGrain
          ? `Top with ${usedGrain.name} and a light drizzle of honey or maple syrup for natural sweetness and crunch.`
          : `Garnish with a squeeze of fresh lemon/lime or mint leaves if on hand to brighten the natural flavors.`,
        "Serve chilled immediately to enjoy maximum vitamin and antioxidant retention."
      ];

      recipes.push({
        id: "recipe-fruit-sunshine",
        title,
        description: `A vibrant, zero-waste energizing bowl specifically crafted to consume your ${joinNames(mainFruits)} at peak freshness.`,
        prepTime: "5 mins",
        cookTime: "0 mins",
        difficulty: "Easy",
        servings: 1,
        expiringIngredientsUsed: ingredientsUsed,
        additionalPantryItems: ["Honey or Maple Syrup", "Cold Water or Ice", "Pinch of Cinnamon"],
        instructions,
        nutritionalHighlight: "Rich in natural vitamin C, potassium, and active enzymes."
      });

      // Second sweet recipe if bread/oats or another fruit is present
      if (grains.length > 0 || fruits.length > 1) {
        const topFruit = fruits[0];
        const breadOrGrain = grains[0]?.name || "Toasted Bread or Warm Oats";
        recipes.push({
          id: "recipe-caramelized-fruit",
          title: `Warm Caramelized ${topFruit.name} & Golden Crisp Toast`,
          description: `A comforting, café-style breakfast turning softening ${topFruit.name} into rich, naturally sweet caramelized goodness.`,
          prepTime: "5 mins",
          cookTime: "8 mins",
          difficulty: "Easy",
          servings: 1,
          expiringIngredientsUsed: [topFruit.name, ...(grains[0] ? [grains[0].name] : [])],
          additionalPantryItems: ["1 tbsp Butter or Cooking Oil", "Pinch of Brown Sugar or Honey", "Cinnamon"],
          instructions: [
            `Slice your ${topFruit.name} evenly into 1/4-inch rounds or wedges.`,
            "Melt 1 tbsp butter in a non-stick skillet over medium heat with a pinch of cinnamon.",
            `Add the sliced ${topFruit.name} and gently sear for 3-4 minutes per side until golden brown and tenderly caramelized.`,
            `Serve warm spooned generously over ${breadOrGrain}.`
          ],
          nutritionalHighlight: "Wholesome natural sweetness with zero processed additives."
        });
      }
    }

    // CLUSTER 2: SAVORY VEGETABLES (STIR-FRY, CURRY, SOUP)
    if (veggies.length > 0) {
      const mainVeggies = veggies.slice(0, 4);
      const usedAromatics = veggies.filter(v => /onion|garlic|ginger/i.test(v.name));
      const usedProduce = veggies.filter(v => !/onion|garlic|ginger/i.test(v.name));
      const targetVeggies = usedProduce.length > 0 ? usedProduce : mainVeggies;

      const vegNames = targetVeggies.map(v => v.name);
      if (usedAromatics.length > 0 && !vegNames.includes(usedAromatics[0].name)) {
        vegNames.push(usedAromatics[0].name);
      }

      // 2A: Farmhouse Sauté / Stir-Fry
      recipes.push({
        id: "recipe-veg-saute",
        title: `Farmhouse Sautéed ${joinNames(targetVeggies.slice(0, 2))} with Garlic & Herbs`,
        description: `A fast, vibrant 10-minute skillet dish highlighting the fresh crunch and natural sweetness of your ${joinNames(targetVeggies.slice(0, 2))}.`,
        prepTime: "8 mins",
        cookTime: "10 mins",
        difficulty: "Easy",
        servings: 2,
        expiringIngredientsUsed: vegNames.slice(0, 3),
        additionalPantryItems: ["1 tbsp Olive Oil or Cooking Oil", "2 Cloves Minced Garlic", "Black Pepper", "Salt"],
        instructions: [
          `Wash and slice your ${joinNames(targetVeggies.slice(0, 2))} into even, bite-sized pieces for consistent cooking.`,
          "Heat cooking oil in a wide skillet over medium-high heat. Add minced garlic and cook for 30 seconds until aromatic.",
          `Toss in the ${joinNames(targetVeggies.slice(0, 2))} and sauté vigorously for 5-7 minutes until tender-crisp.`,
          "Season with a pinch of sea salt, freshly ground black pepper, and herbs of choice. Serve immediately as a wholesome side or main."
        ],
        nutritionalHighlight: "Packed with dietary fiber, essential electrolytes, and immune-supporting phytonutrients."
      });

      // 2B: Nourishing Garden Soup or Curry
      recipes.push({
        id: "recipe-veg-soup",
        title: `Simmered Rustic ${joinNames(targetVeggies.slice(0, 2))} Garden Broth`,
        description: `A soothing, warming zero-waste soup extracting rich savory depth from your simmered vegetables.`,
        prepTime: "10 mins",
        cookTime: "18 mins",
        difficulty: "Easy",
        servings: 2,
        expiringIngredientsUsed: vegNames.slice(0, 4),
        additionalPantryItems: ["2 Cups Vegetable Broth or Water", "Salt & Pepper", "1 tbsp Olive Oil", "Dried Herbs"],
        instructions: [
          `Roughly chop the ${joinNames(vegNames.slice(0, 3))}.`,
          "Heat oil in a medium saucepan, add the chopped vegetables and sweat over medium heat for 4 minutes.",
          "Pour in 2 cups of hot water or vegetable broth. Bring to a gentle boil, then reduce heat to low and cover.",
          `Simmer for 12-15 minutes until the ${targetVeggies[0].name} is melt-in-your-mouth tender.`,
          "Taste and adjust salt and pepper. Serve piping hot with toasted bread or rice."
        ],
        nutritionalHighlight: "Deeply hydrating, gut-soothing, and low calorie."
      });
    }

    // CLUSTER 3: PROTEIN & MAIN MEAL (MEAT, FISH, EGGS, PANEER, TOFU)
    if (meats.length > 0) {
      const protein = meats[0];
      const pairedVeg = veggies.slice(0, 2);
      const usedItems = [protein.name, ...pairedVeg.map(v => v.name)];

      recipes.push({
        id: "recipe-protein-skillet",
        title: `Pan-Seared Golden ${protein.name} ${pairedVeg.length > 0 ? "with " + joinNames(pairedVeg) : "Chef Skillet"}`,
        description: `A high-protein, restaurant-grade pan dish ensuring your ${protein.name} is cooked to juicy perfection.`,
        prepTime: "8 mins",
        cookTime: "14 mins",
        difficulty: "Medium",
        servings: 2,
        expiringIngredientsUsed: usedItems,
        additionalPantryItems: ["Cooking Oil or Butter", "Minced Garlic", "Salt & Black Pepper", "Soy Sauce or Lemon"],
        instructions: [
          `Pat the ${protein.name} dry with paper towels and season both sides generously with salt and black pepper.`,
          "Heat 1 tablespoon of oil or butter in a heavy-bottomed skillet over medium-high heat until shimmering.",
          `Place the ${protein.name} into the pan. Sear undisturbed for 4-6 minutes to form a savory golden crust, then flip.`,
          pairedVeg.length > 0
            ? `Add sliced ${joinNames(pairedVeg)} into the perimeter of the pan, cooking alongside the protein until tender and glossy.`
            : "Baste with pan juices until cooked through.",
          "Rest for 3 minutes before slicing and serving hot."
        ],
        nutritionalHighlight: "Complete high-density protein with essential amino acids."
      });
    }

    // CLUSTER 4: GRAINS / PASTA / RICE
    if (grains.length > 0 && recipes.length < 3) {
      const grain = grains[0];
      const companionItems = [...veggies, ...meats, ...dairy].slice(0, 2);
      const usedItems = [grain.name, ...companionItems.map(c => c.name)];

      recipes.push({
        id: "recipe-grain-toss",
        title: `Artisan Tossed ${grain.name} ${companionItems.length > 0 ? "with " + joinNames(companionItems) : "Primavera"}`,
        description: `The ultimate pantry comfort food, maximizing leftover ${grain.name} into a delicious, savory bowl.`,
        prepTime: "5 mins",
        cookTime: "12 mins",
        difficulty: "Easy",
        servings: 2,
        expiringIngredientsUsed: usedItems,
        additionalPantryItems: ["2 tbsp Olive Oil or Butter", "Minced Garlic", "Chili Flakes", "Salt & Pepper"],
        instructions: [
          `Prepare or warm your ${grain.name}.`,
          companionItems.length > 0
            ? `In a hot pan with olive oil and garlic, quickly sauté your ${joinNames(companionItems)} for 3-5 minutes until tender.`
            : "Warm olive oil, minced garlic, and red chili flakes in a pan over medium heat.",
          `Toss the ${grain.name} directly into the flavorful pan, coating every bite thoroughly.`,
          "Finish with a pinch of sea salt, black pepper, and serve warm."
        ],
        nutritionalHighlight: "Balanced sustained energy with wholesome complex carbohydrates."
      });
    }

    // Fallback if single unique item or unrecognized category
    if (recipes.length === 0) {
      const primaryItem = items[0]?.name || "Kitchen Fresh Produce";
      recipes.push({
        id: "recipe-single-item-skillet",
        title: `Chef's Quick Seared ${primaryItem} Medley`,
        description: `A simple, delicious zero-waste preparation tailored specifically to make ${primaryItem} shine.`,
        prepTime: "5 mins",
        cookTime: "10 mins",
        difficulty: "Easy",
        servings: 1,
        expiringIngredientsUsed: [primaryItem],
        additionalPantryItems: ["1 tbsp Olive Oil or Butter", "Salt & Pepper", "Aromatic Herbs or Garlic"],
        instructions: [
          `Gently wash and prep your ${primaryItem}.`,
          "Heat a non-stick pan over medium heat with a drizzle of olive oil or butter.",
          `Add the ${primaryItem} and cook gently for 5-7 minutes, tossing occasionally until tender and fragrant.`,
          "Season to taste with salt and black pepper, and enjoy warm."
        ],
        nutritionalHighlight: "Wholesome, fresh home-cooked goodness with zero waste."
      });
    }

    return recipes.slice(0, 3);
  }

  /**
   * Interactive AI Chef assistant answering kitchen preservation & cooking questions
   */
  async chatWithAssistant(
    userMessage: string,
    inventory: FoodInventoryContext[] = []
  ): Promise<string> {
    const inventorySummary = inventory.length > 0
      ? `User's current inventory: ${inventory.map((i) => `${i.name} (${i.daysLeft ?? "?"} days left)`).join(", ")}.`
      : "User has no food items registered yet.";

    if (this.hasGeminiKey()) {
      try {
        const prompt = `You are "Chef Remi", a warm, professional AI culinary master and food preservation specialist for the Food Reminder app.
Your goals:
1. Prevent food waste by providing realistic, delicious culinary ideas.
2. Provide safe storage, thawing, and preservation advice.
3. Keep replies structured, concise, and formatted in clean markdown with bullet points.
4. Only suggest realistic flavor pairings for the items they actually have.

Current Inventory:
${inventorySummary}

User question: "${userMessage}"`;

        const answer = await this.callGemini(prompt);
        if (answer) return answer;
      } catch (err) {
        console.warn("[AIService] Chat fallback triggered:", err);
      }
    }

    // Smart culinary assistant responses
    const msg = userMessage.toLowerCase();
    if (msg.includes("what should i cook") || msg.includes("recipe") || msg.includes("cook tonight") || msg.includes("what can i make")) {
      const expiring = inventory.filter((i) => i.daysLeft !== undefined && i.daysLeft <= 3);
      if (expiring.length > 0) {
        const names = expiring.map(i => i.name).join(", ");
        return `### 🍳 Chef Remi's Urgent Zero-Waste Advice\n\nYour most urgent items expiring soon are **${names}**.\n\n- **Quick Fresh Prep**: Use softening fruits immediately in smoothies or warm oats; sauté fresh vegetables with garlic and olive oil.\n- **Batch Cooking**: Turn mixed vegetables into a hearty simmering garden broth or vegetable curry.\n- **Check AI Recipes**: Click the **AI Recipes** button in your dashboard for tailored step-by-step recipes built directly from your ingredients!`;
      }
      return `### 🥗 Chef Remi's Recommendation\n\nAll your registered items are currently fresh! You can explore personalized zero-waste dishes anytime using the **AI Recipes** button on your dashboard, or ask me for storage tips on any specific item!`;
    }

    if (msg.includes("safe") || msg.includes("eat") || msg.includes("expired") || msg.includes("spoil")) {
      return `### 🛡️ Food Safety & Expiry Guidelines\n\n- **"Use By" dates**: Relate to food safety. Do not consume meats, seafood, or soft cheeses past this date.\n- **"Best Before" dates**: Relate to food texture and quality. Dry pantry goods, hard cheeses, and canned items are usually safe past this date if properly sealed.\n- **The Senses Test**: Check for sour or pungent odors, discoloration, mold, or slimy film. When in doubt, compost or discard.`;
    }

    if (msg.includes("freeze") || msg.includes("freezer") || msg.includes("preserving")) {
      return `### ❄️ Chef Remi's Freezing & Preservation Tips\n\n- **Bread & Bakery**: Slice first and seal tightly in freezer bags. Toast directly from frozen!\n- **Hard Cheeses**: Grate before freezing for instant sprinkling onto pasta, bakes, or pizzas.\n- **Soft Fruits & Berries**: Flash freeze on a baking sheet for 2 hours, then transfer to a freezer bag to prevent clumping in smoothies.\n- **Fresh Herbs**: Chop finely, place in ice cube trays, cover with olive oil, and freeze into handy cooking cubes.`;
    }

    return `### 🌿 Hello from Chef Remi!\n\nI'm your AI kitchen preservation companion. I can help you reduce food waste, master optimal storage, and craft delicious meals from whatever is currently in your fridge.\n\nTry asking:\n- *"What can I cook with my expiring items?"*\n- *"How do I keep fresh herbs and greens from wilting?"*\n- *"Can I freeze opened cheese or milk?"*`;
  }

  /**
   * Calls Google Gemini API using native fetch
   */
  private async callGemini(prompt: string): Promise<string | null> {
    if (!this.apiKey) return null;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(this.apiKey)}`;

    const payload = {
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1400,
      }
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini API error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const candidate = data.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text;
    return text || null;
  }

  /**
   * Helper to strip markdown code fences and parse JSON
   */
  private parseJsonFromMarkdown(text: string): any {
    try {
      const clean = text
        .replace(/^```json/m, "")
        .replace(/^```/m, "")
        .replace(/```$/m, "")
        .trim();
      return JSON.parse(clean);
    } catch {
      return null;
    }
  }
}

export const aiService = new AIService();
