# FoodSaver Website - Design Guidelines

## Design Approach

**Selected Approach:** Design System-Inspired with Health/Lifestyle App References

Drawing inspiration from **Notion** (clean data organization), **MyFitnessPal** (food-centric UI), and **Material Design** principles to create a trustworthy, efficient food management experience. The design emphasizes clarity, quick scanning of expiry status, and effortless food item management.

**Core Principles:**
- Status-First Design: Expiry status immediately visible through color and iconography
- Scan-Friendly Layouts: Grid and list views optimized for quick inventory checks
- Trust & Reliability: Clean, professional aesthetic that inspires confidence in food safety
- Efficient Workflows: Minimal clicks from login to adding/viewing items

---

## Color Palette

**Light Mode:**
- Primary: 142 76% 36% (Fresh green - represents freshness and food safety)
- Background: 0 0% 100% (Clean white)
- Surface: 0 0% 98% (Light gray for cards)
- Text Primary: 0 0% 13%
- Text Secondary: 0 0% 45%

**Dark Mode:**
- Primary: 142 76% 45% (Brighter green for dark bg)
- Background: 0 0% 7%
- Surface: 0 0% 12%
- Text Primary: 0 0% 98%
- Text Secondary: 0 0% 65%

**Status Colors (Both Modes):**
- Fresh: 142 76% 36% (Green)
- Expiring Soon: 38 92% 50% (Amber warning)
- Expired: 0 72% 51% (Red alert)
- Consumed/Removed: 0 0% 60% (Gray)

---

## Typography

**Font Families:**
- Primary: Inter (body text, UI elements) - via Google Fonts
- Display: Inter (headings, same family for consistency)

**Type Scale:**
- Hero/H1: text-5xl md:text-6xl font-bold
- H2 Sections: text-3xl md:text-4xl font-bold
- H3 Cards: text-xl font-semibold
- Body: text-base font-normal
- Small/Meta: text-sm font-medium
- Buttons: text-sm md:text-base font-semibold

---

## Layout System

**Spacing Primitives:** Use Tailwind units of **4, 6, 8, 12, 16, 20** for consistent rhythm
- Component padding: p-4 to p-6
- Section spacing: py-12 md:py-20
- Card gaps: gap-6 or gap-8
- Form field spacing: space-y-4

**Container Widths:**
- Homepage: max-w-7xl
- Dashboard: max-w-6xl
- Forms: max-w-md
- Food item cards: Responsive grid

---

## Component Library

### Navigation
- Fixed top navbar with backdrop blur (backdrop-blur-lg bg-white/90 dark:bg-gray-900/90)
- Logo left, nav links center, auth buttons right
- Mobile: Hamburger menu with slide-in drawer
- Active state: Underline indicator with primary color

### Homepage Hero
- Full-width hero section (h-[600px] md:h-[700px])
- Left-aligned content (60% width), right-aligned hero image (40% width) showing fresh produce/organized fridge
- Headline: "Never Let Food Go to Waste" (text-5xl)
- Subheadline explaining value proposition
- Dual CTA: Primary "Get Started Free" + outline "Learn More" with backdrop blur on image

### Authentication Forms
- Centered card layout (max-w-md mx-auto)
- Glass-morphism effect (bg-white/95 dark:bg-gray-900/95 backdrop-blur)
- Input fields: Rounded-lg borders, focus ring with primary color
- Social login options with Replit Auth (icons + text)
- Toggle between login/register with smooth transition

### Dashboard Layout
- Sidebar navigation (hidden on mobile, drawer on tap)
- Top action bar: Search, Filter by status, Add Item button (primary, fixed position on mobile)
- View toggle: Grid view (default) / List view
- Stats cards row: Total Items, Expiring Soon (amber), Expired (red), Saved This Month

### Food Item Cards (Grid View)
- Card: rounded-xl shadow-sm border with status color accent (left border-l-4)
- Top: Food image placeholder or category icon
- Food name (font-semibold text-lg)
- Category badge (small, rounded-full, subtle bg)
- Expiry date with countdown (e.g., "Expires in 3 days")
- Status indicator dot (absolute top-right corner)
- Quick actions on hover: Edit, Delete, Mark as Consumed

### Food Item Rows (List View)
- Table-like rows with consistent padding
- Columns: Status dot, Image/Icon, Name, Category, Purchase Date, Expiry Date, Days Left, Actions
- Sticky header on scroll
- Zebra striping for better scanning

### Add/Edit Food Item Modal
- Overlay with centered modal (max-w-lg)
- Form fields: Name (text), Category (dropdown with common options), Purchase Date (date picker), Expiry Date (date picker)
- Smart defaults: Purchase date = today, Expiry date suggestions based on category
- Image upload option (future enhancement placeholder)
- Action buttons: Cancel (outline) + Save (primary)

### Alert/Notification System
- Toast notifications (top-right corner, slide-in animation)
- Dashboard alert banner for items expiring within 48 hours
- Color-coded: Amber background for warnings, red for expired
- Dismiss button with X icon
- Expiry countdown: "3 items expiring in next 2 days - Review Now"

### About Section (Homepage)
- Two-column layout: Problem statement (left) + Solution features (right)
- Feature cards: Icon (from Heroicons), title, brief description
- Icons: Calendar (expiry tracking), Bell (alerts), Chart (waste reduction), Shield (food safety)

### Footer
- Three-column layout: Brand + tagline, Quick Links (About, FAQ, Contact), Social links
- Newsletter signup: Email input + Subscribe button
- Trust indicators: "Join 10,000+ users reducing food waste"
- Copyright and legal links

---

## Visual Enhancements

**Status Indicators:**
- Dot indicator (absolute positioning, top-right of cards): w-3 h-3 rounded-full
- Border accent: border-l-4 on cards matching status color
- Background tint: Subtle status color at 10% opacity for expired items

**Micro-interactions:**
- Card hover: transform scale-105 transition-all duration-200
- Button hover: Built-in Tailwind/Shadcn states
- Status change: Fade transition when marking items consumed
- Loading states: Skeleton loaders for food item cards

**Empty States:**
- Illustration: Simple icon graphic (refrigerator with sparkles)
- Encouraging message: "Your fridge is empty! Add your first item to start tracking."
- Primary CTA: "Add Food Item" button

---

## Images

**Hero Section:**
- Large hero image: Professional photo of organized refrigerator with fresh produce, containers labeled with dates
- Placement: Right 40% of hero section
- Style: Bright, clean, aspirational aesthetic
- Alt text: "Organized refrigerator with fresh food and labeled containers"

**Dashboard (Optional Enhancements):**
- Category placeholder images for common food types
- Empty state illustration: Minimalist fridge icon
- Success illustrations: Celebratory graphic when waste reduction milestones hit

**About Section:**
- Problem illustration: Before/after comparison (wasted food vs. organized system)
- Feature icons: Use Heroicons for consistency

---

## Responsive Behavior

**Mobile (<768px):**
- Single column layouts
- Stack hero content vertically
- Bottom navigation with FAB for "Add Item"
- Swipe actions on food item cards (swipe left to delete)
- Collapsible filters

**Tablet (768px-1024px):**
- Two-column grid for food items
- Sidebar collapses to icons only
- Full card interactions maintained

**Desktop (>1024px):**
- Three-column grid for food items
- Full sidebar navigation
- Hover states for all interactive elements
- Keyboard shortcuts support (future enhancement)