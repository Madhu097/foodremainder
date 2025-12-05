# Deployment Guide

This application uses a split deployment architecture:
- **Frontend**: Deployed on Vercel (static React app)
- **Backend**: Deployed on Render (Node.js Express API)

## Setup Instructions

### 1. Backend Deployment (Render)

1. Push your code to GitHub
2. Connect your GitHub repository to Render
3. Create a new Web Service
4. Set environment variables in Render dashboard:
   - `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASSWORD`, `EMAIL_FROM`
   - `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM` (optional)
   - `FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL` (optional, for persistent storage)
   - `NODE_ENV=production`
5. Deploy and note your Render URL (e.g., `https://foodremainder.onrender.com`)

### 2. Frontend Deployment (Vercel)

1. Update `vercel.json` with your Render backend URL:
   ```json
   {
     "env": {
       "VITE_API_URL": "https://your-app.onrender.com"
     }
   }
   ```

2. Or set in Vercel dashboard:
   - Go to your project settings
   - Add Environment Variable: `VITE_API_URL` = your Render URL

3. Push to GitHub - Vercel will auto-deploy

### 3. Update API URL

The frontend will automatically use:
- **Production (Vercel)**: The `VITE_API_URL` environment variable
- **Development (Local)**: Relative URLs to `localhost:5000`

### Environment Files

- `client/.env.development` - Local development (empty, uses relative URLs)
- `client/.env.production` - Production settings (set VITE_API_URL)
- Both files are tracked in git

### Testing

1. **Local Development**:
   ```bash
   npm run dev
   ```
   Uses local backend at `http://localhost:5000`

2. **Production**:
   - Frontend: Your Vercel URL
   - Backend: Your Render URL
   - They communicate via the `VITE_API_URL` setting

## Important Notes

- Make sure CORS is properly configured on your Render backend
- Ensure your Render service is running before testing the frontend
- Check Render logs if API calls fail
