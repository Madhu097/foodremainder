/**
 * AI Service for Food Reminder
 * Provides:
 * 1. Smart Shelf-Life & Expiration Prediction
 * 2. Zero-Waste Recipe Generation from expiring items
 * 3. AI Kitchen & Preservation Assistant (Chef Bot)
 * 
 * Supports Google Gemini API (GEMINI_API_KEY / GOOGLE_API_KEY) with
 * an intelligent offline culinary knowledge engine fallback for 100% uptime.
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

// Built-in intelligent food shelf-life & storage knowledge base (offline fallback)
const FOOD_KNOWLEDGE_BASE: Record<string, { category: string; shelfLifeDays: number; storage: "fridge" | "pantry" | "freezer"; tips: string }> = {
  // Dairy
  milk: { category: "Dairy", shelfLifeDays: 7, storage: "fridge", tips: "Keep in the main fridge body, not the door where temperature fluctuates." },
  cheese: { category: "Dairy", shelfLifeDays: 21, storage: "fridge", tips: "Wrap in parchment paper rather than plastic wrap to let it breathe." },
  yogurt: { category: "Dairy", shelfLifeDays: 14, storage: "fridge", tips: "Keep tightly sealed; watery whey separation is natural—just stir it in." },
  butter: { category: "Dairy", shelfLifeDays: 60, storage: "fridge", tips: "Can be frozen for up to 9 months if unopened." },
  cream: { category: "Dairy", shelfLifeDays: 10, storage: "fridge", tips: "Use within 7-10 days after opening." },
  paneer: { category: "Dairy", shelfLifeDays: 5, storage: "fridge", tips: "Submerge in fresh water in an airtight container to keep moist." },

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
  mushroom: { category: "Vegetables", shelfLifeDays: 6, storage: "fridge", tips: "Keep in original brown paper bag to let moisture escape." },

  // Meat & Seafood
  chicken: { category: "Meat", shelfLifeDays: 2, storage: "fridge", tips: "Keep on lowest fridge shelf to avoid drips. Freeze if not cooking within 48h." },
  beef: { category: "Meat", shelfLifeDays: 3, storage: "fridge", tips: "Ground beef lasts 1-2 days; whole cuts last 3-5 days refrigerated." },
  fish: { category: "Seafood", shelfLifeDays: 2, storage: "fridge", tips: "Cook within 24-48 hours or freeze immediately." },
  salmon: { category: "Seafood", shelfLifeDays: 2, storage: "fridge", tips: "Keep on a bed of ice or in the coldest corner of the fridge." },
  prawns: { category: "Seafood", shelfLifeDays: 2, storage: "fridge", tips: "Thaw slowly in fridge, cook promptly." },
  egg: { category: "Dairy", shelfLifeDays: 28, storage: "fridge", tips: "Keep in carton in main fridge shelf, not on door rack." },

  // Grains & Bakery
  bread: { category: "Grains", shelfLifeDays: 6, storage: "pantry", tips: "Avoid fridge (causes staling). Slice and freeze for long-term storage." },
  rice: { category: "Grains", shelfLifeDays: 180, storage: "pantry", tips: "Store in airtight jar in dry pantry. Cooked rice lasts 3-4 days in fridge." },
  pasta: { category: "Grains", shelfLifeDays: 365, storage: "pantry", tips: "Dry pasta lasts 1-2 years. Cooked pasta lasts 4-5 days." },
  flour: { category: "Grains", shelfLifeDays: 240, storage: "pantry", tips: "Seal tightly in container to prevent pantry bugs." },
  oats: { category: "Grains", shelfLifeDays: 180, storage: "pantry", tips: "Keep cool and dry. Ideal container prevents humidity absorption." },
};

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

    // 1. If Gemini API is configured, ask Gemini for nuanced prediction
    if (this.hasGeminiKey()) {
      try {
        const prompt = `As a professional culinary preservation expert, return JSON only for this food item: "${foodName}".
Format:
{
  "category": "Dairy" | "Fruits" | "Vegetables" | "Meat" | "Seafood" | "Grains" | "Beverages" | "Snacks" | "Other",
  "shelfLifeDays": number (standard fresh refrigerated or pantry shelf-life from purchase date),
  "storageLocation": "fridge" | "pantry" | "freezer",
  "storageTips": "One short, practical sentence on best storage method to maximize freshness."
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

    // 2. Intelligent Knowledge Base lookup & matching
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

    // 3. Category-based heuristic estimation
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

    // General default
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
   * Generate creative, delicious zero-waste recipes prioritizing expiring foods
   */
  async generateRecipes(
    items: FoodInventoryContext[],
    preferences?: { mealType?: string; dietaryRestrictions?: string }
  ): Promise<GeneratedRecipe[]> {
    const expiringItems = items
      .filter((i) => (i.daysLeft !== undefined ? i.daysLeft <= 4 : true))
      .slice(0, 8);
    const availableNames = items.map((i) => i.name).slice(0, 15);

    // 1. Try Gemini generation if configured
    if (this.hasGeminiKey() && items.length > 0) {
      try {
        const prompt = `You are an expert zero-waste chef and nutritionist.
The user has the following food items in their kitchen:
All Items: ${availableNames.join(", ")}
Expiring Soon: ${expiringItems.map((i) => `${i.name} (${i.daysLeft ?? "unknown"} days left)`).join(", ")}
Preferences: Meal type: ${preferences?.mealType || "any"}, Dietary: ${preferences?.dietaryRestrictions || "none"}

Generate 2-3 delicious, creative recipes that MAXIMIZE the use of the expiring ingredients.
Return ONLY valid JSON matching this exact structure:
[
  {
    "id": "recipe-1",
    "title": "Recipe Name",
    "description": "Short mouthwatering 1-2 sentence description",
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "difficulty": "Easy" | "Medium" | "Advanced",
    "servings": 2,
    "expiringIngredientsUsed": ["Item 1", "Item 2"],
    "additionalPantryItems": ["Salt", "Olive oil", "Garlic"],
    "instructions": [
      "Step 1...",
      "Step 2...",
      "Step 3..."
    ],
    "nutritionalHighlight": "Rich in antioxidants and lean protein"
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

    // 2. Intelligent Culinary Template fallback
    return this.generateHeuristicRecipes(items, preferences?.mealType);
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
        const prompt = `You are "Chef Remi", a warm, professional, and knowledgeable AI culinary assistant for the Food Reminder app.
Your goals:
1. Help users prevent food waste.
2. Provide safe storage and preservation advice.
3. Suggest quick recipes using their current items.
4. Keep replies concise, helpful, and formatted in clean markdown with bullet points.

Current Inventory:
${inventorySummary}

User question: "${userMessage}"`;

        const answer = await this.callGemini(prompt);
        if (answer) return answer;
      } catch (err) {
        console.warn("[AIService] Chat fallback triggered:", err);
      }
    }

    // Smart heuristic responses for common questions
    const msg = userMessage.toLowerCase();
    if (msg.includes("what should i cook") || msg.includes("recipe") || msg.includes("cook tonight")) {
      const expiring = inventory.filter((i) => i.daysLeft !== undefined && i.daysLeft <= 3);
      if (expiring.length > 0) {
        return `### 🍳 Quick Zero-Waste Recommendation\n\nYour most urgent items are **${expiring.map(i => i.name).join(", ")}**.\n\n- **Frittata or Stir-fry**: A fantastic way to use up dairy, vegetables, and leftover meats in under 15 minutes.\n- **Smoothie Bowl**: Blend softening fruits with milk or yogurt.\n- **Hearty Soup**: Sauté all remaining vegetables with olive oil, broth, and herbs.`;
      }
      return `### 🥗 Chef Suggestion\n\nTake a look at your dashboard items! You can generate tailored recipes anytime using the **AI Recipes** button in the dashboard, or stir-fry your fresh produce with olive oil, garlic, and your favorite grains!`;
    }

    if (msg.includes("safe") || msg.includes("eat") || msg.includes("expired")) {
      return `### 🛡️ Food Safety Rule of Thumb\n\n- **"Use By" dates** relate to food safety—do not consume meat, fish, or soft cheeses past this date.\n- **"Best Before" dates** relate to food quality and texture—dry goods, canned foods, and hard cheeses are often safe past this date if they look, smell, and taste fine.\n- **Safety Check**: Look for discoloration, off-putting odors, mold, or slimy texture. When in doubt, compost or discard.`;
    }

    if (msg.includes("freeze") || msg.includes("freezer")) {
      return `### ❄️ Smart Freezing Tips\n\n- **Bread & Pastries**: Slice first, store in airtight bags. Toast directly from frozen.\n- **Hard Cheeses**: Grate before freezing for easy sprinkling on pastas and bakes.\n- **Berries & Fruits**: Flash freeze on a tray for 2 hours, then bag together to prevent clumping.\n- **Cooked Meals**: Label with today's date; use within 3 months for peak flavor.`;
    }

    return `### 🌿 Hello from Chef Remi!\n\nI can help you reduce food waste, verify freshness, estimate shelf life, or craft delicious recipes from whatever is in your fridge.\n\nTry asking:\n- *"What can I cook with what's expiring soon?"*\n- *"How do I keep fresh herbs from wilting?"*\n- *"Can I freeze opened cheese or milk?"*`;
  }

  /**
   * Calls Google Gemini API using native fetch
   */
  private async callGemini(prompt: string): Promise<string | null> {
    if (!this.apiKey) return null;

    // Use Gemini 1.5 Flash (fast and cost-effective)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(this.apiKey)}`;

    const payload = {
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 1200,
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

  /**
   * Generates dynamic, realistic zero-waste recipes when Gemini is offline
   */
  private generateHeuristicRecipes(items: FoodInventoryContext[], mealType?: string): GeneratedRecipe[] {
    const mainNames = items.slice(0, 4).map((i) => i.name);
    const expiring = items.filter((i) => (i.daysLeft ?? 10) <= 4).map((i) => i.name);
    const highlightedItems = expiring.length > 0 ? expiring : mainNames;

    return [
      {
        id: "recipe-zero-waste-skillet",
        title: "Golden Farmhouse Sauté & Scramble",
        description: `A quick, vibrant skillet dish specifically crafted to utilize your ${highlightedItems.slice(0, 2).join(" and ")} before they spoil.`,
        prepTime: "10 mins",
        cookTime: "12 mins",
        difficulty: "Easy",
        servings: 2,
        expiringIngredientsUsed: highlightedItems.slice(0, 3),
        additionalPantryItems: ["2 Eggs or Tofu", "Olive Oil", "Black Pepper", "Minced Garlic"],
        instructions: [
          `Chop your ${highlightedItems.slice(0, 2).join(" and ")} into bite-sized, even pieces.`,
          "Heat 1 tablespoon of olive oil in a non-stick skillet over medium-high heat with minced garlic until fragrant.",
          `Add the ${highlightedItems[0] || "vegetables"} and sauté for 4-5 minutes until tender and golden.`,
          "Whisk 2 eggs or add crumbled tofu, pour evenly across the skillet, season with salt and pepper, and stir gently until fluffy and cooked through.",
          "Serve warm with toasted bread or your favorite grain."
        ],
        nutritionalHighlight: "High protein, rich in dietary fiber and essential micronutrients."
      },
      {
        id: "recipe-zero-waste-bowl",
        title: "Chef's Garden Grain & Power Bowl",
        description: "A nourishing, customizable bowl combining sautéed ingredients over rice, quinoa, or noodles.",
        prepTime: "12 mins",
        cookTime: "15 mins",
        difficulty: "Easy",
        servings: 2,
        expiringIngredientsUsed: highlightedItems.slice(0, 2),
        additionalPantryItems: ["Cooked Rice or Grains", "Soy Sauce or Dressing", "Sesame Seeds", "Chili Flakes"],
        instructions: [
          "Warm pre-cooked rice or grains in a serving bowl.",
          `Quickly sear ${highlightedItems.join(", ")} in a hot pan with a splash of soy sauce or olive oil.`,
          "Layer the cooked ingredients over the warm grains.",
          "Drizzle with sesame oil or vinaigrette and garnish with toasted sesame seeds and chili flakes."
        ],
        nutritionalHighlight: "Sustained clean energy with complex carbohydrates."
      }
    ];
  }
}

export const aiService = new AIService();

