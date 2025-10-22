# Troubleshooting Authentication Issues

## Error: "Unexpected token '<', "<!DOCTYPE "... is not valid JSON"

This error occurs when the client receives HTML instead of JSON from the API. This usually means:

### Cause 1: API Routes Not Loaded
The authentication routes may not be registered before Vite's catch-all route.

**Solution:** The routes are now registered correctly. Make sure the server is running.

### Cause 2: Wrong API Endpoint
The client might be hitting the wrong endpoint or the Vite dev server is catching the request.

**Solution:** 
1. Verify API routes are working by testing: `http://localhost:5000/api/health`
2. You should see: `{"status":"ok","message":"API is working"}`

### Cause 3: Server Not Restarted After Changes
HMR might not apply server-side changes properly.

**Solution:**
1. Stop the current server (Ctrl+C or kill the process)
2. Restart: `npm run dev`

## Quick Test Steps

### 1. Test API Health
Open your browser or use curl:
```bash
curl http://localhost:5000/api/health
```
Expected response:
```json
{"status":"ok","message":"API is working"}
```

### 2. Test Registration
Use curl or Postman:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "mobile": "+1234567890",
    "password": "password123"
  }'
```

Expected response:
```json
{
  "message": "Registration successful",
  "user": {
    "id": "...",
    "username": "testuser",
    "email": "test@example.com",
    "mobile": "+1234567890"
  }
}
```

### 3. Test Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "test@example.com",
    "password": "password123"
  }'
```

## Common Issues

### Issue: "Network error"
- **Check:** Is the server running? Look for `[express] serving on port 5000`
- **Check:** Is the port correct? Default is 5000
- **Fix:** Restart the server

### Issue: "Invalid credentials"
- **Check:** Did you register first?
- **Check:** Is the password correct? (min 6 characters)
- **Check:** Are you using email OR mobile number (not username)?

### Issue: "Validation error"
- **Email:** Must be a valid email format
- **Mobile:** Must be a valid phone number (e.g., +1234567890)
- **Password:** Must be at least 6 characters
- **Username:** Must be at least 3 characters

## Server Logs

Check the terminal where the server is running. You should see:
```
[Auth] Registration request received
[Auth] Login request received
```

If you don't see these logs, the routes are not being hit.

## Browser DevTools

1. Open DevTools (F12)
2. Go to Network tab
3. Try to sign in
4. Look for `/api/auth/login` request
5. Check:
   - **Request URL:** Should be `http://localhost:5000/api/auth/login`
   - **Request Method:** Should be `POST`
   - **Status Code:** Should be 200 (success) or 400/401 (validation/auth error)
   - **Response:** Should be JSON, not HTML

## Still Not Working?

1. **Clear browser cache and reload**
2. **Check console for JavaScript errors**
3. **Verify all files are saved**
4. **Restart the server completely**
5. **Check if port 5000 is accessible**

## Need Help?

See the server console for detailed error messages. All errors are now logged with `[Auth]` prefix.
