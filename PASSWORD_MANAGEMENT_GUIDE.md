# Password Management Guide

## 🔐 Password Features Overview

Your FoodSaver app now has comprehensive password management features:
1. **Forgot Password** - Reset password without logging in
2. **Change Password** - Change password from your profile

---

## 🔑 Forgot Password

### When to Use
- You can't remember your password
- Need to reset your password for security
- Locked out of your account

### How to Reset Password

**Step 1: Go to Forgot Password Page**
1. Go to Login page
2. Click **"Forgot Password?"** link below the password field
3. OR visit directly: `http://localhost:5000/forgot-password`

**Step 2: Enter Your Identifier**
1. Enter your **email** OR **mobile number**
2. Click **"Continue"**

**Step 3: Set New Password**
1. Enter your new password (min 6 characters)
2. Confirm your new password
3. Click **"Reset Password"**

**Step 4: Login with New Password**
- You'll be redirected to the login page
- Sign in with your new password ✅

---

## 🔄 Change Password (For Logged-In Users)

### When to Use
- Want to update your password for security
- Suspect unauthorized access
- Following security best practices

### How to Change Password

**Step 1: Go to Your Profile**
1. Click **"Profile"** in the navigation bar
2. OR visit: `http://localhost:5000/profile`

**Step 2: Open Change Password Modal**
1. Scroll to **"Account Actions"** section
2. Click **"Change Password"** button (🔑 icon)

**Step 3: Fill the Form**
1. **Current Password**: Your existing password
2. **New Password**: Your desired new password (min 6 characters)
3. **Confirm New Password**: Re-enter new password
4. Click **"Change Password"**

**Step 4: Success!**
- Your password is updated immediately
- You can continue using the app
- Next login will require the new password

---

## ⚙️ API Endpoints

### Reset Password (Forgot Password)
```
POST /api/auth/reset-password

Request Body:
{
  "identifier": "user@email.com OR +1234567890",
  "newPassword": "newpass123"
}

Response (Success):
{
  "message": "Password reset successfully"
}

Response (Error):
{
  "message": "User not found" | "Password must be at least 6 characters"
}
```

### Change Password (Authenticated)
```
POST /api/auth/change-password

Request Body:
{
  "userId": "user-uuid",
  "currentPassword": "oldpass123",
  "newPassword": "newpass123"
}

Response (Success):
{
  "message": "Password changed successfully"
}

Response (Error):
{
  "message": "Current password is incorrect" | "Password must be at least 6 characters"
}
```

---

## ✅ Password Requirements

### Minimum Requirements
- **Length**: At least 6 characters
- **Different**: New password must differ from current password

### Best Practices (Recommended)
- ✅ Use 8+ characters
- ✅ Mix uppercase and lowercase letters
- ✅ Include numbers
- ✅ Include special characters (!@#$%^&*)
- ✅ Don't reuse passwords
- ✅ Change password every 90 days

### Example Strong Passwords
```
FoodSaver2025!
MyGroceries#2024
Track&Save$123
```

---

## 🔒 Security Features

### Password Hashing
- All passwords are hashed using **SHA-256**
- Passwords are **never stored in plain text**
- Hash is one-way (cannot be reversed)

### Validation
- ✅ Email format validation
- ✅ Mobile number format validation  
- ✅ Password length validation
- ✅ Password match confirmation
- ✅ User existence check

### User Verification
- **Forgot Password**: Identifies user by email/mobile
- **Change Password**: Requires current password verification
- User ID validation on all requests

---

## 🎯 Use Cases

### Scenario 1: Forgot Password
```
Problem: Can't remember password
Solution:
1. Click "Forgot Password?"
2. Enter email: user@example.com
3. Set new password: MyNewPass123
4. Login with new password
```

### Scenario 2: Security Update
```
Problem: Want to update password for security
Solution:
1. Go to Profile
2. Click "Change Password"
3. Current: oldpassword
4. New: StrongPass2025!
5. Confirm and save
```

### Scenario 3: Account Recovery
```
Problem: Suspect unauthorized access
Solution:
1. Use "Forgot Password" to reset
2. Enter your email
3. Set completely new password
4. Login securely
```

---

## 🚦 Error Messages

### Forgot Password Errors

**"User not found"**
- Email/mobile not registered
- Check spelling
- Try different identifier

**"Password must be at least 6 characters"**
- New password is too short
- Use 6 or more characters

**"Passwords do not match"**
- Confirmation doesn't match
- Re-type carefully

### Change Password Errors

**"All fields are required"**
- Fill in all three fields
- Don't leave any blank

**"Current password is incorrect"**
- Wrong current password
- Check CAPS LOCK
- Try "Forgot Password" if needed

**"New password must be different from current password"**
- Choose a different new password
- Can't use the same password

**"New passwords do not match"**
- Confirmation doesn't match new password
- Re-type carefully

---

## 💡 Tips

### For Forgot Password
- ✅ Use the same email/mobile from registration
- ✅ Create a memorable but strong password
- ✅ Write it down in a secure place initially
- ✅ Test login immediately after reset

### For Change Password
- ✅ Keep current password handy
- ✅ Choose a stronger password than before
- ✅ Don't reuse old passwords
- ✅ Update password manager if you use one

### Password Management
- 📝 Consider using a password manager
- 🔄 Change password every 3-6 months
- 🚫 Don't share your password
- 📱 Use different passwords for different sites

---

## 🧪 Testing

### Test Forgot Password
```
1. Register: testuser@email.com / password123
2. Logout
3. Click "Forgot Password?"
4. Enter: testuser@email.com
5. New password: newpass123
6. Confirm: newpass123
7. Try login with new password ✅
```

### Test Change Password
```
1. Login to your account
2. Go to Profile
3. Click "Change Password"
4. Current: password123
5. New: strongpass456
6. Confirm: strongpass456
7. Save and test login later ✅
```

---

## 🔧 Technical Implementation

### Backend (Server)

**Storage Method**:
```typescript
updateUserPassword(userId: string, newPasswordHash: string): Promise<boolean>
```

**Password Hashing**:
```typescript
function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}
```

**Password Verification**:
```typescript
function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}
```

### Frontend (Client)

**Components**:
- `ForgotPasswordPage.tsx` - Password reset flow
- `ChangePasswordModal.tsx` - Change password modal
- `AuthForm.tsx` - Includes forgot password link

**Routes**:
- `/forgot-password` - Password reset page
- `/profile` - Access change password

---

## 🆘 Troubleshooting

### Can't Reset Password

**Issue**: "User not found" error

**Solutions**:
1. Check email spelling
2. Try mobile number instead
3. Verify registration email
4. Contact support if needed

### Can't Change Password

**Issue**: "Current password is incorrect"

**Solutions**:
1. Verify you're typing correctly
2. Check CAPS LOCK is off
3. Use "Forgot Password" to reset
4. Try different browser

### Network Errors

**Issue**: "Network error. Please try again"

**Solutions**:
1. Check server is running
2. Verify port 5000 is accessible
3. Check browser console for errors
4. Refresh and try again

---

## 📊 Feature Comparison

| Feature | Forgot Password | Change Password |
|---------|----------------|-----------------|
| **When** | Not logged in | Must be logged in |
| **Verification** | Email/Mobile | Current password |
| **Access** | Login page link | Profile page |
| **Use Case** | Lost password | Update password |
| **Security** | Account recovery | Proactive security |

---

## ✨ Benefits

### For Users
- 🔓 Never locked out of account
- 🔐 Easy password updates
- 🛡️ Better security control
- 😌 Peace of mind

### For Security
- ✅ Strong password enforcement
- ✅ Secure password hashing
- ✅ User verification required
- ✅ Protection against unauthorized access

---

## 🎉 Success!

Your FoodSaver app now has professional password management:
- ✅ Forgot password recovery
- ✅ Change password from profile
- ✅ Secure password hashing
- ✅ User-friendly interface
- ✅ Comprehensive validation
- ✅ Clear error messages

**Stay secure and enjoy your food tracking!** 🔐🍎
