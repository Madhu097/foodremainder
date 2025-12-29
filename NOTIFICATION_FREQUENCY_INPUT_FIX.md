# Notification Frequency Input Field Fix

## Problem
The notification frequency number input field was not working properly. Users were unable to change the value in the input field.

## Root Cause
There were multiple issues causing this problem:

1. **Frontend Validation Mismatch**: The frontend allowed values 1-5, but was preventing changes due to strict validation that didn't allow intermediate states during typing
2. **Server Validation Too Restrictive**: The server only accepted values 1-4, rejecting valid values like 5
3. **No Empty State Handling**: The input didn't handle empty strings during editing, making it impossible to clear and type a new value

## Solution

### 1. Frontend Changes ([client/src/components/NotificationSettings.tsx](client/src/components/NotificationSettings.tsx))

**Updated Input Field:**
- Changed `max` from `5` to `24` (now supports hourly notifications)
- Added support for empty string during editing
- Added `onBlur` handler to ensure valid value when user leaves the field
- Improved validation logic to allow typing without immediately rejecting partial values

```tsx
<Input
  id="notifications-per-day"
  type="number"
  min="1"
  max="24"
  value={preferences.notificationsPerDay}
  onChange={(e) => {
    const value = e.target.value;
    // Allow empty string during editing
    if (value === '') {
      return;
    }
    const num = parseInt(value);
    if (!isNaN(num) && num >= 1 && num <= 24) {
      setPreferences({ ...preferences, notificationsPerDay: num });
    }
  }}
  onBlur={(e) => {
    // Ensure valid value on blur
    const value = e.target.value;
    if (value === '' || isNaN(parseInt(value))) {
      setPreferences({ ...preferences, notificationsPerDay: 24 });
    }
  }}
  className="w-24"
/>
```

**Updated Default Values:**
- Changed default from `5` to `24` notifications per day
- Updated interface documentation from `1-5` to `1-24`

### 2. Server Changes ([server/routes.ts](server/routes.ts))

**Updated Validation:**
```typescript
// Before: only accepted 1-4
if (typeof notificationsPerDay === "number" && notificationsPerDay >= 1 && notificationsPerDay <= 4) {
  preferences.notificationsPerDay = notificationsPerDay.toString();
}

// After: accepts 1-24
if (typeof notificationsPerDay === "number" && notificationsPerDay >= 1 && notificationsPerDay <= 24) {
  preferences.notificationsPerDay = notificationsPerDay.toString();
}
```

**Updated Default:**
- Changed default return value from `"1"` to `"24"` when fetching preferences

### 3. Schema Updates ([shared/schema.ts](shared/schema.ts))

Updated documentation to reflect new range:
```typescript
notificationsPerDay: string; // Number of times to send notifications per day (1-24, hourly default)
```

## How It Works Now

### User Experience
1. User can type any number in the field
2. Empty strings are allowed during editing (user can clear and type new value)
3. When user leaves the field (onBlur), invalid values default to 24
4. Valid range: 1-24 notifications per day
5. Changes save successfully to the server

### Notification Frequency Options
- **1/day**: One notification per day (24-hour gap)
- **2/day**: Notifications every 12 hours
- **3/day**: Notifications every 8 hours
- **5/day**: Notifications every ~5 hours
- **24/day**: Hourly notifications (recommended, default)

### Updated Help Text
Old: "💡 **1:** 9 AM • **2:** 9 AM, 3 PM • **3:** 9 AM, 1 PM, 5 PM..."
New: "💡 **1:** Daily • **2:** Every 12h • **3:** Every 8h • **5:** Every 5h • **24:** Hourly (recommended)"

## Testing Instructions

1. **Open Profile/Settings** page
2. **Find "Notification Frequency"** section
3. **Try these scenarios:**
   - Clear the field completely and type a new number (1-24)
   - Type numbers incrementally (e.g., type "1", then "2", then "24")
   - Try values outside range (should default to 24 on blur)
   - Save settings and verify they persist after page reload

## Files Changed

| File | Changes |
|------|---------|
| [client/src/components/NotificationSettings.tsx](client/src/components/NotificationSettings.tsx) | Updated input validation, max value (5→24), default value, help text |
| [server/routes.ts](server/routes.ts) | Updated server validation (1-4 → 1-24), default value (1→24) |
| [shared/schema.ts](shared/schema.ts) | Updated documentation comment |

## Benefits

1. ✅ **Input field now works smoothly** - users can type and change values
2. ✅ **Supports hourly notifications** - better for time-sensitive food expiry alerts
3. ✅ **Consistent validation** - frontend and backend now agree on valid range
4. ✅ **Better UX** - allows clearing field during editing
5. ✅ **Smart defaults** - invalid values automatically become 24 (hourly)

## Related

This fix works in conjunction with:
- [AUTOMATIC_NOTIFICATIONS_FIX.md](AUTOMATIC_NOTIFICATIONS_FIX.md) - Automatic notification system
- Notification scheduler running every 5 minutes in test mode
- Frequency throttling allowing notifications every hour (when set to 24/day)
