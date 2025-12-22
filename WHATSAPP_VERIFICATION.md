# WhatsApp Verification Process - User Guide

## Overview
The Food Remainder app now includes a WhatsApp verification system similar to Telegram. Users must verify their WhatsApp number before receiving notifications.

## How It Works

### For Users

#### 1. Enable WhatsApp Notifications
1. Go to **Profile** → **Notification Settings**
2. Toggle **WhatsApp Notifications** to ON
3. You'll see a verification section appear

#### 2. Request Verification Code
1. Click the **"Request Code"** button
2. A 6-digit verification code will be sent to your WhatsApp number
3. The code is valid for 10 minutes

#### 3. Enter Verification Code
1. Check your WhatsApp for the verification message
2. Enter the 6-digit code in the input field
3. Click **"Verify"**
4. Once verified, you'll see "WhatsApp Connected!" message

#### 4. Disconnect (Optional)
- Click **"Disconnect"** to unlink your WhatsApp
- You can reconnect anytime by requesting a new code

### Verification Message Format
When you request a code, you'll receive a WhatsApp message like this:

```
🍎 Food Remainder - WhatsApp Verification

Hi [Your Name]! 👋

Your verification code is: *123456*

This code will expire in 10 minutes.

Enter this code in the app to enable WhatsApp notifications.

If you didn't request this, please ignore this message.
```

## Technical Details

### Backend Implementation

#### 1. Verification Service (`whatsappVerificationService.ts`)
- **Code Generation**: Creates random 6-digit codes
- **Code Storage**: Stores codes in memory with expiration (10 minutes)
- **Verification**: Validates codes against stored data
- **Number Tracking**: Maintains verified numbers map

#### 2. API Endpoints

**Request Verification Code**
```
POST /api/notifications/whatsapp/request-code
Body: { userId: string }
Response: { success: boolean, message: string }
```

**Verify Code**
```
POST /api/notifications/whatsapp/verify-code
Body: { userId: string, code: string }
Response: { success: boolean, message: string }
```

**Check Verification Status**
```
GET /api/notifications/whatsapp/status/:userId
Response: { isVerified: boolean, mobile: string, hasPendingCode: boolean }
```

**Disconnect WhatsApp**
```
POST /api/notifications/whatsapp/disconnect
Body: { userId: string }
Response: { success: boolean, message: string }
```

### Frontend Implementation

#### WhatsAppVerification Component
Located in: `client/src/components/NotificationSettings.tsx`

**Features:**
- Request verification code button
- Code input field (6 digits only)
- Real-time verification status
- Disconnect functionality
- Loading states for all actions
- Error handling with toast notifications

**States:**
- `isVerified`: Whether WhatsApp is connected
- `verificationCode`: Current code input
- `isRequestingCode`: Loading state for code request
- `isVerifying`: Loading state for verification
- `isDisconnecting`: Loading state for disconnection

## Security Features

### 1. Code Expiration
- Codes expire after 10 minutes
- Expired codes are automatically cleaned up
- Users must request a new code if expired

### 2. User Validation
- Codes are tied to specific user IDs
- Mobile numbers are validated against user records
- Only the correct user can verify their number

### 3. Single Active Code
- Only one code per mobile number at a time
- New code requests invalidate previous codes
- Prevents code spam

## Comparison with Telegram

| Feature | WhatsApp | Telegram |
|---------|----------|----------|
| **Connection Method** | Verification Code | Deep Link (/start) |
| **User Action** | Enter code in app | Click link, press Start |
| **Verification** | 6-digit code | Automatic via bot |
| **Expiration** | 10 minutes | No expiration |
| **Reconnection** | Request new code | Click link again |
| **User Experience** | 2 steps | 1 step |

## Advantages of WhatsApp Verification

### 1. **Security**
- Explicit verification ensures number ownership
- Time-limited codes prevent unauthorized access
- No persistent deep links

### 2. **User Control**
- Users explicitly verify their number
- Clear disconnect option
- Transparent verification status

### 3. **Flexibility**
- Works with WhatsApp Business Cloud API
- Compatible with sandbox and production modes
- No bot setup required for users

## Troubleshooting

### Code Not Received
**Possible Causes:**
1. WhatsApp service not configured on server
2. User not in WhatsApp sandbox (for testing)
3. Phone number format incorrect
4. 24-hour messaging window expired (WhatsApp Cloud API)

**Solutions:**
1. Check server logs for detailed errors
2. Verify WhatsApp Cloud API configuration
3. Ensure phone number includes country code
4. For sandbox: User must send join code first
5. For production: Use approved message templates

### Verification Failed
**Possible Causes:**
1. Code expired (>10 minutes old)
2. Wrong code entered
3. User ID mismatch
4. Code already used

**Solutions:**
1. Request a new code
2. Double-check the code from WhatsApp
3. Ensure you're logged in with correct account
4. Try disconnecting and reconnecting

### Can't Disconnect
**Possible Causes:**
1. Network error
2. Server issue
3. User not found

**Solutions:**
1. Check internet connection
2. Try again after a moment
3. Contact support if persists

## Best Practices

### For Users
1. **Keep Codes Private**: Don't share verification codes
2. **Verify Quickly**: Enter code within 10 minutes
3. **Check Number**: Ensure your mobile number is correct in profile
4. **Test Notifications**: Use "Test Notification" button after verification

### For Developers
1. **Monitor Logs**: Check server logs for verification issues
2. **Clean Up Codes**: Expired codes are auto-cleaned, but monitor memory
3. **Rate Limiting**: Consider adding rate limits for code requests
4. **Persistent Storage**: For production, consider storing verified numbers in database

## Future Enhancements

### Potential Improvements
1. **SMS Fallback**: Send code via SMS if WhatsApp fails
2. **Rate Limiting**: Prevent code request spam
3. **Database Storage**: Persist verified numbers across server restarts
4. **Code Resend**: Add explicit "Resend Code" button
5. **Multi-Device**: Support multiple devices per user
6. **Verification History**: Track verification attempts

### Advanced Features
1. **Two-Factor Auth**: Use WhatsApp as 2FA method
2. **Biometric Verification**: Add fingerprint/face ID
3. **QR Code**: Alternative verification via QR scan
4. **Voice Call**: Automated call with code for accessibility

## Support

### Getting Help
1. Check this documentation
2. Review `WHATSAPP_SETUP.md` for server configuration
3. Check server logs for detailed error messages
4. Contact support with:
   - User ID
   - Mobile number
   - Error message
   - Timestamp of issue

### Common Error Messages

**"WhatsApp service not configured on server"**
- Server admin needs to set up WhatsApp Cloud API
- See `WHATSAPP_SETUP.md` for configuration steps

**"No verification code found. Please request a new code."**
- Code expired or never requested
- Click "Request Code" again

**"Verification code has expired. Please request a new code."**
- Code is older than 10 minutes
- Request a fresh code

**"Invalid verification code. Please try again."**
- Code doesn't match what was sent
- Check WhatsApp message for correct code
- Ensure no typos

## Summary

The WhatsApp verification system provides a secure, user-friendly way to connect WhatsApp for notifications. It's similar to Telegram but uses explicit code verification for enhanced security. Users have full control over their connection status and can easily disconnect and reconnect as needed.

For technical implementation details, see:
- `server/whatsappVerificationService.ts` - Backend service
- `server/routes.ts` - API endpoints
- `client/src/components/NotificationSettings.tsx` - Frontend UI
