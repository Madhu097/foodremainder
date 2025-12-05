# Firebase Setup Guide

This guide will help you set up Firebase Firestore as your database for the Food Reminder application.

## Prerequisites

- A Google account
- Node.js installed on your system

## Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** (or select an existing project)
3. Enter a project name (e.g., "Food Reminder")
4. Follow the setup wizard:
   - Enable/disable Google Analytics (optional)
   - Click **"Create project"**
5. Wait for the project to be created

## Step 2: Enable Firestore Database

1. In your Firebase project dashboard, click **"Firestore Database"** in the left sidebar
2. Click **"Create database"**
3. Choose a security mode:
   - **Production mode** (recommended) - Secure by default
   - **Test mode** - Open for development (you can change this later)
4. Select a Firestore location (choose the one closest to your users)
5. Click **"Enable"**

## Step 3: Generate Service Account Credentials

1. In Firebase Console, click the **gear icon** ⚙️ next to "Project Overview"
2. Select **"Project settings"**
3. Go to the **"Service accounts"** tab
4. Click **"Generate new private key"**
5. Click **"Generate key"** in the confirmation dialog
6. A JSON file will be downloaded - **Keep this file secure!**

## Step 4: Configure Your Application

1. Open the downloaded JSON file
2. Find these three values:
   - `project_id`
   - `client_email`
   - `private_key`

3. Open your `.env` file in the Food Reminder project
4. Uncomment and update the Firebase configuration:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----\n"
```

### Important Notes:

- **FIREBASE_PROJECT_ID**: Copy the `project_id` value from the JSON file
- **FIREBASE_CLIENT_EMAIL**: Copy the `client_email` value from the JSON file
- **FIREBASE_PRIVATE_KEY**: Copy the `private_key` value from the JSON file
  - **Keep the quotes around the private key**
  - The `\n` characters represent line breaks - keep them as-is

### Example Configuration:

```env
FIREBASE_PROJECT_ID=food-reminder-12345
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-abc@food-reminder-12345.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
```

## Step 5: Set Up Firestore Security Rules (Optional)

For production, you should secure your Firestore database:

1. In Firebase Console, go to **Firestore Database**
2. Click the **"Rules"** tab
3. Replace the rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Food items collection
    match /foodItems/{itemId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
  }
}
```

4. Click **"Publish"**

**Note**: The above rules require Firebase Authentication. For server-side access using Admin SDK (as we're doing), these rules won't affect your application since Admin SDK has full access.

## Step 6: Test Your Configuration

1. Save your `.env` file
2. Rebuild and restart your application:

```bash
npm run build
npm run start
```

3. Check the console output:
   - You should see: `[Firebase] ✅ Connected to Firebase Firestore`
   - You should see: `[Storage] ✅ Using Firebase Firestore`

## Troubleshooting

### Error: "Firebase not initialized"

- Make sure all three environment variables are set correctly in `.env`
- Verify there are no extra spaces or quotes (except around the private key)
- Restart the application after updating `.env`

### Error: "Invalid private key"

- Make sure the private key includes `\n` for line breaks
- Keep the entire key wrapped in quotes
- Don't modify the key format from the JSON file

### Error: "Permission denied"

- Check your Firestore security rules
- Admin SDK should have full access regardless of rules
- Verify the service account has proper permissions in Firebase Console

### Data Not Persisting

- Confirm Firebase connection message in console
- Check Firestore Console to verify collections are being created
- Look for error messages in the application logs

## Collections Structure

The application will create two collections:

### `users`
- Fields: id, username, email, mobile, password, emailNotifications, whatsappNotifications, notificationDays, createdAt

### `foodItems`
- Fields: id, userId, name, category, purchaseDate, expiryDate, quantity, notes, createdAt

## Security Best Practices

1. **Never commit your `.env` file** to version control
2. **Store service account JSON file securely** - don't share it
3. **Use environment variables** for production deployment
4. **Enable Firestore security rules** for production
5. **Regularly rotate** your service account keys
6. **Monitor Firebase usage** to avoid unexpected costs

## Cost Considerations

Firebase Firestore has a free tier that includes:
- 50,000 document reads/day
- 20,000 document writes/day
- 20,000 document deletes/day
- 1 GB stored data

For most personal projects, this should be sufficient. Monitor your usage in the Firebase Console.

## Next Steps

- Set up Firebase Authentication for user management (optional)
- Configure email notifications
- Configure WhatsApp notifications via Twilio
- Deploy your application to production

## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Admin SDK Documentation](https://firebase.google.com/docs/admin/setup)
