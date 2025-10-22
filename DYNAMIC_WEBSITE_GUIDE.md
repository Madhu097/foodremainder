# Dynamic Website with User-Specific Data

## ✅ What's Been Implemented

### 🎯 Key Features

1. **User-Specific Data Storage**
   - Each user has their own separate food inventory
   - Food items are linked to user accounts via userId
   - Users can only see and manage their own items

2. **Profile Page**
   - View user information (username, email, mobile, member since)
   - Clean, modern UI with color-coded sections
   - Easy access from navigation bar
   - Sign out functionality

3. **API Endpoints Created**
   ```
   GET    /api/food-items/:userId     - Get all items for a user
   POST   /api/food-items              - Create new food item
   PUT    /api/food-items/:id          - Update food item
   DELETE /api/food-items/:id          - Delete food item
   ```

4. **Database Schema**
   - `users` table: id, username, email, mobile, password, createdAt
   - `food_items` table: id, userId, name, category, purchaseDate, expiryDate, quantity, notes, createdAt
   - Automatic user-item relationship via foreign key

## 📱 Using the Dynamic Features

### Register Your Account
1. Go to Sign Up
2. Enter:
   - Username (min 3 characters)
   - Email (valid email format)
   - Mobile number
   - Password (min 6 characters)
3. Click "Create Account"

### Access Your Profile
1. After logging in, click **Profile** in the navigation bar
2. View your account information:
   - Username
   - Email address
   - Mobile number
   - Member since date
   - User ID
3. Use **Sign Out** button to logout

### Dashboard - Your Food Inventory
- Each user sees only their own food items
- Add new items - saved to your account
- Edit items - updates your data
- Delete items - removes from your inventory

## 🔄 How Data Separation Works

### When You Register
```
User → Creates Account → Gets Unique User ID → Stored in System
```

### When You Add Food Items
```
User → Adds Item → Item Tagged with Your User ID → Only You Can See It
```

### When You Login
```
User → Enters Credentials → System Verifies → Loads Your Data Only
```

## 🏗️ Technical Implementation

### Backend (Server)

**Storage Layer** (`server/storage.ts`)
- `MemStorage` class with Maps for users and food items
- Methods: `createFoodItem`, `getFoodItemsByUserId`, `updateFoodItem`, `deleteFoodItem`
- Each method enforces userId checks for security

**API Routes** (`server/routes.ts`)
- User authentication routes with password hashing
- Food items CRUD operations with user validation
- Error handling and validation with Zod

**Database Schema** (`shared/schema.ts`)
- Foreign key relationship: `food_items.userId → users.id`
- Cascade delete: When user deleted, their items auto-delete
- Validation schemas for data integrity

### Frontend (Client)

**Pages**
- `ProfilePage.tsx` - Display user information
- `DashboardPage.tsx` - Manage food inventory (needs API integration)
- `AuthPage.tsx` - Login/Register with validation

**Routing** (`App.tsx`)
- `/` - Home page
- `/auth` - Login/Register
- `/dashboard` - User's food inventory
- `/profile` - User profile
- Protected routes redirect to login

**Navigation** (`Navbar.tsx`)
- Shows Profile link when authenticated
- Desktop and mobile menu support
- Dynamic links based on auth status

## 📊 Data Flow Example

### Adding a Food Item:

1. **User fills form** on Dashboard
   ```typescript
   {
     name: "Fresh Milk",
     category: "Dairy",
     purchaseDate: "2025-10-18",
     expiryDate: "2025-10-25",
     quantity: "1 Liter",
     notes: "Organic"
   }
   ```

2. **Frontend sends to API**
   ```typescript
   POST /api/food-items
   {
     userId: "abc-123-def",  // Current user's ID
     name: "Fresh Milk",
     category: "Dairy",
     ...
   }
   ```

3. **Backend validates and saves**
   ```typescript
   storage.createFoodItem(userId, validatedData)
   // Returns saved item with id
   ```

4. **Frontend updates display**
   ```typescript
   // Item appears in user's list immediately
   ```

## 🔐 Security Features

### User Authentication
- Passwords hashed with SHA-256
- Credentials validated before access
- Session stored in localStorage

### Data Isolation
- Each API request requires userId
- Backend validates user owns the data
- Unauthorized access returns 404/401

### Input Validation
- Zod schemas validate all input
- Email format checking
- Mobile number format validation
- Required fields enforced

## 🚀 Next Steps (To Complete Integration)

1. **Update Dashboard to Use API**
   - Fetch food items from `/api/food-items/:userId`
   - Send new items to POST endpoint
   - Update/delete via PUT/DELETE endpoints

2. **Add Loading States**
   - Show spinners while fetching data
   - Handle empty states gracefully
   - Error messages for failed requests

3. **Enable Database (Optional)**
   - Set up Neon database (see DATABASE_SETUP.md)
   - Data persists across server restarts
   - Production-ready storage

## 📝 Current Status

✅ **Completed:**
- User registration and authentication
- Profile page with user information
- API endpoints for food items CRUD
- User-specific data model
- Navigation with profile link
- Backend storage implementation

🔄 **Next:**
- Connect Dashboard to API endpoints
- Replace mock data with real API calls
- Add loading and error states

## 🎉 Benefits

**For Users:**
- Personal food inventory
- Secure, private data
- Access from anywhere
- Track your own items

**For Development:**
- Scalable architecture
- Easy to add features
- Clean separation of concerns
- Type-safe with TypeScript

## 📖 Related Documentation

- `HOW_TO_RUN.md` - Running the application
- `DATABASE_SETUP.md` - Setting up persistent storage
- `TROUBLESHOOTING.md` - Common issues and fixes
- `DEBUGGING_NETWORK_ERROR.md` - Authentication debugging

---

**Note:** The application currently uses in-memory storage. Set up a database (see DATABASE_SETUP.md) for permanent data storage across server restarts.
