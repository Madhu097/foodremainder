/**
 * Migration Script: Add +91 prefix to existing mobile numbers
 * Run this script once to update all existing user mobile numbers
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Firebase Admin
const app = initializeApp({
    credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
});

const db = getFirestore(app);

async function migrateMobileNumbers() {
    console.log('🔄 Starting mobile number migration...');
    console.log('========================================\n');

    try {
        // Get all users
        const usersSnapshot = await db.collection('users').get();
        const totalUsers = usersSnapshot.size;
        
        console.log(`📊 Found ${totalUsers} users to check\n`);

        let updatedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        for (const doc of usersSnapshot.docs) {
            const user = doc.data();
            const userId = doc.id;
            const mobile = user.mobile;

            console.log(`\n👤 Checking user: ${user.username}`);
            console.log(`   Current mobile: ${mobile}`);

            // Skip if mobile already has country code
            if (mobile && mobile.startsWith('+')) {
                console.log(`   ✅ Already has country code - skipping`);
                skippedCount++;
                continue;
            }

            // Skip if mobile is empty or invalid
            if (!mobile || mobile.trim() === '') {
                console.log(`   ⚠️  Empty mobile number - skipping`);
                skippedCount++;
                continue;
            }

            // Add +91 prefix
            const newMobile = '+91' + mobile.trim();
            
            try {
                await db.collection('users').doc(userId).update({
                    mobile: newMobile
                });
                
                console.log(`   ✅ Updated to: ${newMobile}`);
                updatedCount++;
            } catch (error) {
                console.error(`   ❌ Failed to update:`, error);
                errorCount++;
            }
        }

        console.log('\n========================================');
        console.log('📈 Migration Summary:');
        console.log(`   Total users: ${totalUsers}`);
        console.log(`   ✅ Updated: ${updatedCount}`);
        console.log(`   ⏭️  Skipped: ${skippedCount}`);
        console.log(`   ❌ Errors: ${errorCount}`);
        console.log('========================================');
        
        if (errorCount === 0) {
            console.log('\n✨ Migration completed successfully!');
        } else {
            console.log('\n⚠️  Migration completed with some errors');
        }

    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    }
}

// Run migration
migrateMobileNumbers()
    .then(() => {
        console.log('\n👋 Exiting...');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Fatal error:', error);
        process.exit(1);
    });
