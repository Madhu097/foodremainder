import admin from 'firebase-admin';

// Initialize Firebase Admin
let firebaseApp: admin.app.App | undefined;
let db: admin.firestore.Firestore | undefined;

try {
    // Check if Firebase credentials are provided
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
        // Initialize with service account credentials
        firebaseApp = admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID!,
                privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
            }),
        });

        db = firebaseApp.firestore();
        console.log('[Firebase] ✅ Connected to Firebase Firestore');
    } else {
        console.log('[Firebase] ⚠️  Firebase credentials not configured');
        console.log('[Firebase] 💡 Set FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, and FIREBASE_CLIENT_EMAIL in .env');
    }
} catch (error) {
    console.error('[Firebase] ❌ Failed to initialize Firebase:', error);
}

export { db, firebaseApp };
