import admin from 'firebase-admin';

// Initialize Firebase Admin
let firebaseApp: admin.app.App | undefined;
let db: admin.firestore.Firestore | undefined;

try {
    // Check if Firebase credentials are provided
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
        // Parse the private key - handle both formats
        let privateKey = process.env.FIREBASE_PRIVATE_KEY;
        
        // Remove any quotes that might have been added
        privateKey = privateKey.replace(/^["']|["']$/g, '');
        
        // Replace literal \n with actual newlines
        privateKey = privateKey.replace(/\\n/g, '\n');
        
        // Validate the key format
        if (!privateKey.includes('BEGIN PRIVATE KEY') || !privateKey.includes('END PRIVATE KEY')) {
            throw new Error('FIREBASE_PRIVATE_KEY appears to be malformed. It should start with "-----BEGIN PRIVATE KEY-----" and end with "-----END PRIVATE KEY-----"');
        }
        
        console.log('[Firebase] 🔑 Private key format validated');
        
        // Initialize with service account credentials
        firebaseApp = admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID!,
                privateKey: privateKey,
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
    console.error('[Firebase] ❌ Failed to initialize Firebase:', error instanceof Error ? error.message : error);
    if (error instanceof Error && error.message.includes('DECODER')) {
        console.error('[Firebase] 💡 This error usually means FIREBASE_PRIVATE_KEY is incorrectly formatted');
        console.error('[Firebase] 📖 In Render, the value should be: "-----BEGIN PRIVATE KEY-----\\nYourKey...\\n-----END PRIVATE KEY-----\\n"');
        console.error('[Firebase] ⚠️  Make sure to include the double quotes and use \\n (not actual newlines)');
    }
}

export { db, firebaseApp };
