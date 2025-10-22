# Debugging Network Error - Step by Step

## Current Status
✅ API routes are working (server shows 200 responses)
⚠️ Client shows "Network error. Please try again."

## Debug Steps

### Step 1: Open Browser Console
1. Open your app in the browser
2. Press **F12** to open DevTools
3. Go to **Console** tab
4. Keep it open while testing

### Step 2: Try to Sign In/Register
When you click the submit button, you should see these logs:

```
[AuthForm] Submit triggered, mode: login
[AuthForm] Form data: { identifier: "...", password: "***" }
[AuthForm] Has onSubmit handler: true
[AuthForm] Validation passed, calling onSubmit
[Auth] Sending request to: /api/auth/login
[Auth] Request data: { identifier: "...", password: "***" }
[Auth] Response status: 200
[Auth] Response ok: true
[Auth] Response data: { message: "...", user: {...} }
[Auth] Success! User: {...}
```

### Step 3: Identify the Issue

**If you see:**
- `[AuthForm] Validation failed` → Form validation is blocking submission
- `[Auth] Failed to parse JSON response` → Server returned non-JSON (HTML)
- `[Auth] Caught error: TypeError` → Network/CORS issue
- No logs at all → Form submit not triggering

## Quick Test - Direct API Test

1. Open this URL in your browser:
   ```
   http://localhost:5000/test-api.html
   ```

2. Click **"Test Register"** button
3. If successful, click **"Test Login"** button

This will show exactly where the issue is:
- ✅ If both work → Problem is in React app
- ❌ If API test fails → Problem is in server/routes

## Common Solutions

### Solution 1: Clear Browser Cache
```
Ctrl+Shift+Delete → Clear cached images and files → Clear
```
Then reload the page (Ctrl+R)

### Solution 2: Check Server Logs
Look at your terminal running the server:
```
[Auth] Registration request received
[Auth] Login request received
POST /api/auth/login 200 in Xms
```

If you DON'T see these → Routes not registered properly

### Solution 3: Verify Form Data
In console, check the form data being sent:
- For Register: Must have `username`, `email`, `mobile`, `password`
- For Login: Must have `identifier` (email or mobile), `password`

### Solution 4: Check Response Format
The console will show:
```
[Auth] Response data: {...}
```

It MUST be JSON with this structure:
```json
{
  "message": "...",
  "user": { "id": "...", "username": "...", ... }
}
```

If you see HTML like `<!DOCTYPE html>` → API route not working

## Still Not Working?

### Test with curl (Command Line)
```bash
# Test login
curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d "{\"identifier\":\"test@example.com\",\"password\":\"password123\"}"
```

### Check Network Tab
1. F12 → Network tab
2. Try to sign in
3. Look for `/api/auth/login` request
4. Click on it
5. Check:
   - **Headers** → Request URL should be `http://localhost:5000/api/auth/login`
   - **Payload** → Should show your form data as JSON
   - **Response** → Should be JSON, not HTML
   - **Status** → Should be 200 or 400/401 (not 404)

## Expected Flow

### Successful Flow:
1. User fills form → Form validation passes
2. AuthForm calls onSubmit → AuthPage receives data
3. AuthPage sends fetch request → Server receives at `/api/auth/login`
4. Server validates → Returns JSON response
5. AuthPage parses JSON → Success! Redirect to dashboard

### Where It's Breaking:
The detailed console logs will show EXACTLY where it breaks.

## Contact Points for Debugging

Check console for these key markers:
- `[AuthForm]` - Form submission
- `[Auth]` - API request/response
- `[express]` - Server receiving request (in terminal)

One of these will show the error!
