# 🔐 Firebase Authentication Integration Guide

## Overview

This guide explains how to integrate Firebase Authentication into the Food Reminder application to replace the current simple hash-based authentication system.

---

## Current Authentication System

Currently, the app uses:
- **SHA-256 hashing** for passwords (stored in Firestore/Memory)
- **Local storage** for session management
- **Manual user creation** with username/email/mobile

---

## Firebase Authentication Benefits

✅ **Enhanced Security**: Industry-standard authentication  
✅ **Email Verification**: Built-in email verification  
✅ **Password Reset**: Secure password reset flow  
✅ **Social Login**: Easy integration with Google, Facebook, etc.  
✅ **Session Management**: Automatic token refresh  
✅ **Multi-factor Authentication**: Optional 2FA support

---

## Integration Steps

### Step 1: Enable Firebase Authentication

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Authentication** → **Get Started**
4. Enable **Email/Password** sign-in method
5. (Optional) Enable other providers (Google, Facebook, etc.)

### Step 2: Install Firebase Auth SDK

```bash
npm install firebase
```

### Step 3: Initialize Firebase in Client

Create `client/src/lib/firebase.ts`:

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
```

### Step 4: Add Environment Variables

Add to `.env`:

```env
# Firebase Client Configuration (for Authentication)
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

Get these from: Firebase Console → Project Settings → General → Your apps

### Step 5: Create Authentication Hook

Create `client/src/hooks/useAuth.ts`:

```typescript
import { useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

export function useAuth() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signup = async (email: string, password: string, displayName: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName });
    return userCredential.user;
  };

  const login = async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  };

  const logout = async () => {
    await signOut(auth);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  return {
    user,
    loading,
    signup,
    login,
    logout,
    resetPassword,
  };
}
```

### Step 6: Update Authentication Pages

Modify `client/src/pages/AuthPage.tsx`:

```typescript
import { useAuth } from '@/hooks/useAuth';

export default function AuthPage() {
  const { signup, login } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');

  const handleRegister = async (data: any) => {
    try {
      // Create Firebase user
      const firebaseUser = await signup(data.email, data.password, data.username);
      
      // Create user document in Firestore with additional data
      await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: firebaseUser.uid,
          username: data.username,
          email: data.email,
          mobile: data.mobile,
          // No password needed - managed by Firebase Auth
        }),
      });

      toast({ title: 'Success!', description: 'Account created successfully' });
      navigate('/dashboard');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleLogin = async (data: any) => {
    try {
      await login(data.email, data.password);
      toast({ title: 'Welcome back!' });
      navigate('/dashboard');
    } catch (error: any) {
      toast({ title: 'Error', description: 'Invalid credentials', variant: 'destructive' });
    }
  };

  // ... rest of component
}
```

### Step 7: Protect Routes

Create `client/src/components/ProtectedRoute.tsx`:

```typescript
import { Navigate } from 'wouter';
import { useAuth } from '@/hooks/useAuth';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/auth?mode=login" />;
  }

  return <>{children}</>;
}
```

Use in routes:

```typescript
<Route path="/dashboard">
  <ProtectedRoute>
    <DashboardPage />
  </ProtectedRoute>
</Route>
```

### Step 8: Update Server-Side Authentication

Modify `server/routes.ts` to verify Firebase tokens:

```typescript
import admin from 'firebase-admin';

// Middleware to verify Firebase token
async function authenticateFirebaseToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

// Protected routes
app.get('/api/food-items/:userId', authenticateFirebaseToken, async (req, res) => {
  // Only allow users to access their own data
  if (req.params.userId !== req.user.uid) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  // ... rest of handler
});
```

### Step 9: Update User Schema

Modify `shared/schema.ts`:

```typescript
export interface User {
  id: string; // This will be Firebase UID
  username: string;
  email: string;
  mobile: string;
  profilePicture: string;
  // Remove password field - managed by Firebase Auth
  emailNotifications: string;
  // ... rest of fields
}
```

### Step 10: Migration Strategy

For existing users:

1. **Import Users**: Use Firebase Admin SDK to import existing users
2. **Password Migration**: Trigger password reset for all users
3. **Dual Auth**: Temporarily support both systems during migration

Example migration script:

```typescript
import admin from 'firebase-admin';
import { storage } from './server/storage';

async function migrateUsers() {
  const users = await storage.getAllUsers();
  
  for (const user of users) {
    try {
      // Create Firebase Auth user
      await admin.auth().createUser({
        uid: user.id,
        email: user.email,
        displayName: user.username,
        phoneNumber: user.mobile,
      });
      
      // Send password reset email
      await admin.auth().generatePasswordResetLink(user.email);
      
      console.log(`Migrated user: ${user.email}`);
    } catch (error) {
      console.error(`Failed to migrate ${user.email}:`, error);
    }
  }
}
```

---

## Social Login Integration

### Google Sign-In

1. Enable Google provider in Firebase Console
2. Add to AuthPage:

```typescript
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  // Create/update user document in Firestore
};
```

3. Add button:

```tsx
<Button onClick={signInWithGoogle}>
  <GoogleIcon /> Sign in with Google
</Button>
```

---

## Email Verification

```typescript
import { sendEmailVerification } from 'firebase/auth';

// After signup
await sendEmailVerification(user);

// Check verification status
if (!user.emailVerified) {
  // Show warning or restrict access
}
```

---

## Security Rules

Update Firestore Security Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Food items
    match /foodItems/{itemId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
  }
}
```

---

## Testing

1. **Local Development**: Use Firebase Emulator Suite
2. **Test Accounts**: Create test accounts in Firebase Console
3. **Token Verification**: Test with Postman/curl

```bash
# Get ID token from browser console
firebase.auth().currentUser.getIdToken()

# Use in API requests
curl -H "Authorization: Bearer <token>" http://localhost:5000/api/food-items/user-id
```

---

## Advantages of Firebase Auth

✨ **Security**: Industry-standard authentication  
✨ **Scalability**: Handles millions of users  
✨ **Features**: Email verification, password reset, 2FA  
✨ **Maintenance**: Managed service, no security patches needed  
✨ **Integration**: Works seamlessly with Firestore  
✨ **Analytics**: Built-in user analytics

---

## Migration Checklist

- [ ] Enable Firebase Authentication in console
- [ ] Install Firebase SDK in client
- [ ] Create Firebase config and auth hook
- [ ] Update AuthPage with Firebase methods
- [ ] Add token verification middleware
- [ ] Update user schema (remove password)
- [ ] Implement protected routes
- [ ] Migrate existing users
- [ ] Update Firestore security rules
- [ ] Test all auth flows
- [ ] Deploy changes

---

## Resources

- [Firebase Authentication Docs](https://firebase.google.com/docs/auth)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [React Firebase Hooks](https://github.com/CSFrequency/react-firebase-hooks)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)

---

**Note**: The current implementation works fine for a simple app. Firebase Auth is recommended for production apps that need enterprise-grade security, social login, or will scale to many users.
