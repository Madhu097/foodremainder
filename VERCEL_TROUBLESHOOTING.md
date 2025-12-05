# Vercel Deployment Troubleshooting Guide

## What I Fixed

### 1. **Enhanced CORS Configuration** ✅
- Improved CORS handling for Vercel domains
- Added support for all `.vercel.app` subdomains
- Better localhost support for development
- Increased preflight cache to 24 hours

### 2. **API Configuration with Fallback** ✅
- Added production fallback to Render URL
- Added comprehensive logging for debugging
- Ensures API URL is always set in production

### 3. **Debug Tools** ✅
- Added `ApiConnectionTest` component that shows API status
- Shows connection status, API URL, and any errors
- Displays in bottom-right corner on your site

### 4. **Enhanced Health Endpoints** ✅
- `/api/health` - Shows full server status
- `/api/test-cors` - Tests CORS configuration
- Both provide detailed debugging information

## How to Verify

### On Vercel (After Deployment)

1. **Check API Connection Indicator**
   - Look at bottom-right corner of your website
   - Green badge = Connected ✅
   - Red badge = Error ❌

2. **Test Health Endpoint**
   - Open: `https://foodremainder.onrender.com/api/health`
   - Should return JSON with `status: "ok"`

3. **Test CORS**
   - Open: `https://foodremainder.onrender.com/api/test-cors`
   - Should return `success: true`

4. **Check Browser Console**
   - Press F12 → Console tab
   - Look for `[API Config]` logs
   - Should show: `Final API_BASE_URL: https://foodremainder.onrender.com`

### Common Issues & Solutions

#### Issue 1: "Invalid response from server"
**Cause**: API URL not configured
**Solution**: 
- Vercel Dashboard → Your Project → Settings → Environment Variables
- Add: `VITE_API_URL` = `https://foodremainder.onrender.com`
- Redeploy

#### Issue 2: CORS errors in console
**Cause**: Backend not allowing Vercel origin
**Solution**: Already fixed! Backend now auto-allows all `.vercel.app` domains

#### Issue 3: Connection indicator shows red
**Cause**: Render backend might be sleeping (free tier)
**Solution**: 
- Open `https://foodremainder.onrender.com/api/health` directly
- Wait 30-60 seconds for Render to wake up
- Refresh your Vercel site

#### Issue 4: Environment variable not working
**Cause**: Vercel needs rebuild after env var changes
**Solution**:
- Vercel Dashboard → Deployments → Latest → ⋯ (three dots) → Redeploy

## Environment Variable Setup

### In Vercel Dashboard:
1. Go to your project
2. Settings → Environment Variables
3. Add: 
   - **Name**: `VITE_API_URL`
   - **Value**: `https://foodremainder.onrender.com`
   - **Environments**: Select "Production"
4. Click "Save"
5. Trigger a new deployment (push to GitHub or click Redeploy)

### Alternative: Using vercel.json (Already Done)
The `vercel.json` file already has this configured:
```json
{
  "env": {
    "VITE_API_URL": "https://foodremainder.onrender.com"
  }
}
```

## Verify Backend is Running

1. **Check Render Dashboard**
   - Go to https://dashboard.render.com
   - Check your service status (should be "Live")

2. **Test Backend Directly**
   ```bash
   curl https://foodremainder.onrender.com/api/health
   ```
   Should return: `{"status":"ok","message":"API is working",...}`

3. **Check Render Logs**
   - Render Dashboard → Your Service → Logs
   - Look for: `serving on port 5000`
   - Should NOT see crash errors

## Next Steps

1. **Wait for Deployments**
   - Vercel: Usually 1-3 minutes
   - Render: Usually 2-5 minutes

2. **Check Connection Indicator**
   - Visit your Vercel site
   - Look for green badge in bottom-right

3. **Test Login**
   - Try logging in
   - Check browser console for errors
   - Connection indicator should be green

4. **If Still Not Working**
   - Share the browser console logs (F12 → Console)
   - Share the Render logs
   - Share your Vercel URL

## Remove Debug Badge (Production)

Once everything works, remove the debug indicator:

In `client/src/App.tsx`, remove this line:
```tsx
<ApiConnectionTest />
```

This will hide the connection badge in production while keeping it in development.

## Testing Checklist

- [ ] Vercel deployment successful
- [ ] Render backend running
- [ ] Green connection badge visible
- [ ] Browser console shows correct API URL
- [ ] `/api/health` endpoint works
- [ ] Login/Register works
- [ ] Dashboard loads food items
- [ ] Can add/edit/delete items
