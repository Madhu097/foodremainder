# How to Run the FoodSaver App

## ✅ Quick Start (You're Already Running!)

Your server is now running! Open the app in your browser:
```
http://localhost:5000
```

## 🚀 Running the Code

### Method 1: Using npm (Recommended)
```bash
npm run dev
```
This will start the development server with hot-reload.

### Method 2: Direct Command
```bash
npx tsx server/index.ts
```

## 🛑 Stopping the Server

To stop the server:
- Press **Ctrl+C** in the terminal
- Or close the terminal window

## 📋 Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Run production build |
| `npm run check` | Type check with TypeScript |
| `npm run db:push` | Push database schema changes |

## 🔍 What You Should See

When the server starts successfully, you'll see:
```
[Storage] Using in-memory storage
[express] Running in DEVELOPMENT mode with Vite
[express] serving on port 5000
```

## 🌐 Opening the App

**Option 1: Browser**
- Open your browser
- Go to: `http://localhost:5000`

**Option 2: Browser Preview (in IDE)**
- Click the browser preview button shown above
- Or use the proxy URL provided

## 📱 Features to Test

1. **Home Page** - Landing page with hero section
2. **Sign Up** - Register a new account at `/auth?mode=register`
3. **Sign In** - Login at `/auth?mode=login`
4. **Dashboard** - View your food inventory (after login)

## ⚠️ Troubleshooting

### Port Already in Use Error
```
Error: listen EADDRINUSE: address already in use ::1:5000
```

**Solution:**
1. Close any other terminals running the server
2. Open Task Manager (Ctrl+Shift+Esc)
3. Find and end all "Node.js" processes
4. Run `npm run dev` again

### Module Not Found Errors
```bash
npm install
```
This installs all required dependencies.

### Cannot Run npm Commands
Make sure you're in the project directory:
```bash
cd c:\Users\kuruv\OneDrive\Desktop\DesignSensei
```

## 🔄 After Making Code Changes

The server has **Hot Module Reload (HMR)** enabled:
- ✅ Frontend changes: Auto-reload in browser
- ⚠️ Backend changes: Restart server (Ctrl+C, then `npm run dev`)

## 📊 Checking if Server is Running

Look for these signs:
1. **Console Output**: You see `[express] serving on port 5000`
2. **Browser**: `http://localhost:5000` loads the app
3. **Task Manager**: "Node.js" process is running

## 💾 Data Storage

Currently using **in-memory storage**:
- ✅ Data persists while server is running
- ❌ Data is lost when server restarts

**To enable persistent storage:**
See `DATABASE_SETUP.md` for setting up a free Neon database.

## 🆘 Still Having Issues?

1. Check the terminal for error messages
2. See `TROUBLESHOOTING.md` for common issues
3. See `DEBUGGING_NETWORK_ERROR.md` for auth issues

## 🎉 You're All Set!

Your server is running on port 5000. You can now:
- Browse the app at `http://localhost:5000`
- Test authentication with the sign up/sign in forms
- Access the dashboard after logging in

Happy coding! 🚀
