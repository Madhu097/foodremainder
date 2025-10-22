# Database Setup Guide

This application uses **Neon** (a free serverless Postgres database) for data storage.

## Quick Setup (5 minutes)

### Step 1: Create a Free Neon Database

1. Go to [https://neon.tech](https://neon.tech)
2. Click **"Sign Up"** (free, no credit card required)
3. Create a new project (e.g., "FoodSaver")
4. Copy the connection string that looks like:
   ```
   postgresql://username:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

### Step 2: Set Up Environment Variable

#### For Local Development:
1. Create a `.env` file in the root directory:
   ```bash
   touch .env
   ```
2. Add your database URL:
   ```
   DATABASE_URL=postgresql://your-connection-string-here
   ```

#### For Replit:
1. Click on **"Secrets"** (🔒 icon) in the left sidebar
2. Add a new secret:
   - Key: `DATABASE_URL`
   - Value: Your Neon connection string
3. Click **"Add Secret"**

### Step 3: Run Database Migration

Run this command to create the tables:

```bash
npm run db:push
```

This will create the `users` table in your database.

### Step 4: Restart the Server

Stop and restart your development server:

```bash
npm run dev
```

You should see: `[Storage] Using database storage (Neon)`

## ✅ Verification

- When you register a new user, the data will be stored in your Neon database
- Data persists across server restarts
- You can view your data in the Neon console

## 🔧 Troubleshooting

**"Using in-memory storage" message:**
- Check that DATABASE_URL is set correctly
- Verify the connection string format
- Make sure you've restarted the server

**Connection errors:**
- Ensure your IP is allowed in Neon (default: all IPs allowed)
- Check that `?sslmode=require` is at the end of your connection string
- Verify the connection string is correct (no extra spaces)

## 📚 Learn More

- [Neon Documentation](https://neon.tech/docs)
- [Drizzle ORM](https://orm.drizzle.team)
