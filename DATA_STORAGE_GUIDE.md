# 📊 Data Storage Guide - Where Is My Data?

This guide explains how to check where your data is stored and how to view it.

---

## 🔍 How to Check Current Storage Mode

### Method 1: Check Console Output (Easiest)

When you start the application with `npm run start`, look at the console output:

#### **In-Memory Storage** (Current Mode):
```
[Storage] Using in-memory storage
[Storage] 💾 Data will persist during this session only
[Storage] 💡 Tip: Configure Firebase credentials in .env to enable persistent storage
```
**What this means:**
- ✅ Data is stored in RAM (computer memory)
- ⚠️ Data is **temporary** - lost when server restarts
- 💡 Perfect for testing
- 📍 Location: Memory only (no files or database)

#### **Firebase Storage** (After Configuration):
```
[Firebase] ✅ Connected to Firebase Firestore
[Storage] ✅ Using Firebase Firestore
[Storage] 💾 Data will persist in Firebase
```
**What this means:**
- ✅ Data is stored in Firebase Cloud
- ✅ Data is **permanent** - survives server restarts
- ✅ Accessible from anywhere
- 📍 Location: Firebase Firestore (cloud database)

---

## 📍 Where Is My Data Stored?

### Current Mode: In-Memory Storage

```
Storage Location: RAM (Computer Memory)
Persistence: ❌ Temporary (lost on restart)
View Data: ⚠️ Cannot view directly (see testing methods below)
Backup: ❌ No automatic backup
```

### After Firebase Configuration: Cloud Storage

```
Storage Location: Firebase Firestore (Google Cloud)
Persistence: ✅ Permanent
View Data: ✅ Firebase Console
Backup: ✅ Automatic by Firebase
```

---

## 👀 How to View Your Data

### Option 1: In-Memory Storage (Current)

Since data is in memory only, you can't view it directly. But you can:

#### A. **Use the Application Interface**
1. Start the server: `npm run start`
2. Open browser: http://localhost:5000
3. Register/Login
4. Add food items
5. View your items in the app

#### B. **Check via API (For Developers)**

You can make API calls to see data:

```bash
# Login first (save the session cookie)
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"your-email","password":"your-password"}'

# Get your food items
curl http://localhost:5000/api/food-items \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"
```

#### C. **Add Console Logging (For Debugging)**

Temporarily add logging to see data:

Edit `server/storage.ts` and add console logging:
```typescript
async getFoodItemsByUserId(userId: string): Promise<FoodItem[]> {
  const items = Array.from(this.foodItems.values()).filter(
    (item) => item.userId === userId,
  );
  console.log(`[DEBUG] Food items for user ${userId}:`, items); // Add this line
  return items;
}
```

### Option 2: Firebase Firestore (After Configuration)

Once you configure Firebase, viewing data is MUCH easier!

#### A. **Firebase Console (Recommended)**

1. Go to https://console.firebase.google.com/
2. Select your project
3. Click **"Firestore Database"** in the left sidebar
4. You'll see your collections:

```
📁 users
   └─ [user-id]
       ├─ username: "john"
       ├─ email: "john@example.com"
       ├─ mobile: "+1234567890"
       └─ ...

📁 foodItems
   └─ [item-id]
       ├─ name: "Milk"
       ├─ category: "Dairy"
       ├─ expiryDate: "2025-12-10"
       ├─ userId: "user-id"
       └─ ...
```

5. Click on any collection to view its documents
6. Click on any document to see all fields
7. You can even edit data directly!

#### B. **Firebase Console Features**

- ✅ **Browse all data** - Visual interface
- ✅ **Search and filter** - Find specific items
- ✅ **Edit in real-time** - Modify data directly
- ✅ **Delete records** - Remove items
- ✅ **Export data** - Download as JSON
- ✅ **Monitor usage** - See read/write stats

---

## 🔄 How to Switch Storage Modes

### Currently Using: In-Memory Storage
**To Switch to Firebase:**

1. **Complete Firebase Setup** (see `FIREBASE_SETUP.md`)
2. **Add credentials to `.env`:**
   ```env
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_CLIENT_EMAIL=your-firebase-service-account@...
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   ```
3. **Rebuild and restart:**
   ```bash
   npm run build
   npm run start
   ```
4. **Verify in console:**
   Look for: `[Storage] ✅ Using Firebase Firestore`

---

## 📊 Data Storage Comparison

| Feature | In-Memory | Firebase |
|---------|-----------|----------|
| **Persistence** | ❌ Temporary | ✅ Permanent |
| **Survives Restart** | ❌ No | ✅ Yes |
| **View in Browser** | ❌ No | ✅ Yes |
| **Backup** | ❌ None | ✅ Automatic |
| **Setup Required** | ✅ None | ⚠️ Configuration needed |
| **Cost** | ✅ Free | ✅ Free tier available |
| **Best For** | Testing | Production |
| **View Data** | Via API/App | Firebase Console |

---

## 🛠️ Quick Data Inspection Tools

### 1. **Check Storage Mode**
```bash
npm run start
# Look for [Storage] message in console
```

### 2. **Test with Postman/Thunder Client**

Create a user and add items via API:

**Register:**
```http
POST http://localhost:5000/api/register
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com",
  "mobile": "+1234567890",
  "password": "password123"
}
```

**Login:**
```http
POST http://localhost:5000/api/login
Content-Type: application/json

{
  "identifier": "test@example.com",
  "password": "password123"
}
```

**Add Food Item:**
```http
POST http://localhost:5000/api/food-items
Content-Type: application/json
Cookie: connect.sid=YOUR_SESSION_COOKIE

{
  "name": "Milk",
  "category": "Dairy",
  "purchaseDate": "2025-12-05",
  "expiryDate": "2025-12-12",
  "quantity": "1L",
  "notes": "Fresh milk"
}
```

**Get All Items:**
```http
GET http://localhost:5000/api/food-items
Cookie: connect.sid=YOUR_SESSION_COOKIE
```

### 3. **Browser Developer Tools**

1. Open http://localhost:5000
2. Press `F12` to open DevTools
3. Go to **Network** tab
4. Perform actions in the app
5. Click on API requests to see responses

---

## 🎯 Quick Reference

### Current Storage Status Check:
```bash
# Start the server and look for this line:
[Storage] Using in-memory storage  # ← Current mode
```

### Where to View Data:

| Storage Mode | How to View |
|-------------|-------------|
| **In-Memory** | • Use the app interface<br>• API testing tools<br>• Browser DevTools |
| **Firebase** | • Firebase Console (easiest)<br>• Use the app interface<br>• API testing tools |

---

## 💡 Recommendations

### For Testing/Development:
✅ **In-Memory Storage** is fine
- No setup needed
- Fast and simple
- Just remember: data is temporary

### For Production/Long-term Use:
✅ **Firebase Storage** is recommended
- Data persists forever
- Easy to view and manage
- Professional-grade infrastructure
- Free tier is generous

---

## 🚀 Next Steps

1. **Try the app** with in-memory storage to test features
2. **Set up Firebase** when ready for persistent storage (see `FIREBASE_SETUP.md`)
3. **Use Firebase Console** to easily view and manage data

---

## 🆘 Common Questions

**Q: My data disappeared!**
A: If using in-memory storage, data is lost when the server restarts. Configure Firebase for permanent storage.

**Q: How do I export my data?**
A: With Firebase, use the Firebase Console to export as JSON. With in-memory storage, data can't be exported (it's temporary).

**Q: Can I see data in real-time?**
A: With Firebase Console, yes! It updates in real-time as your app modifies data.

**Q: Is my data secure?**
A: Firebase provides enterprise-grade security. In-memory data is secure but temporary.

---

**Need help setting up Firebase? See [`FIREBASE_SETUP.md`](./FIREBASE_SETUP.md)**
