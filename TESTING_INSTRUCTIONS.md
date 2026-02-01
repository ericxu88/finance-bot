# Testing Instructions - Real-time Dashboard Updates

## Backend Status: ✅ WORKING PERFECTLY

The backend has been tested and confirmed working:
- Transfers update profile correctly
- Goals are added to user profile
- `updatedUserProfile` is sent in responses
- Profile persists across requests

## Frontend Updates Made:
1. Added real-time profile update handling
2. Dashboard now refreshes automatically
3. Debug logging added to browser console

---

## How to Test:

### Step 1: Clear Browser Cache & Reload
**CRITICAL:** You must do a hard refresh to load the new JavaScript:

- **Chrome/Edge:** `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- **Firefox:** `Ctrl+F5` or `Cmd+Shift+R` (Mac)
- Or: Open DevTools → Right-click reload button → "Empty Cache and Hard Reload"

### Step 2: Verify Version Loaded
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for: `💰 Finance Bot v3.0 loaded - Real-time updates enabled`
   - **If you see this:** ✅ New code loaded
   - **If you don't see this:** ❌ Still cached, try Step 1 again

### Step 3: Test Transfer
1. Go to Chat tab
2. Type: `move 100 from checking to savings`
3. Bot will ask for confirmation
4. Reply: `yes do it`
5. **Watch the Console** for these logs:
   ```
   [Chat] Complete event received, has profile update: true
   [Chat] Updating profile with balances: {checking: 2900, savings: 8100}
   [Profile] Updated user profile - accounts: {checking: 2900, savings: 8100}
   ```

### Step 4: Verify Dashboard Updates
1. Switch to Dashboard tab
2. Check the account balances in the sidebar
3. **Expected:** Balances should show the NEW values
4. **If not:** Check console for errors

### Step 5: Test Goal Creation
1. Go to Goals tab
2. Click "Add Goal"
3. Fill in:
   - Name: "Test Car"
   - Amount: 15000
   - Current: 0
   - Deadline: 2027-12-31
   - Priority: 5
4. Submit
5. Goal should appear in the list
6. Switch to Dashboard → Goal should show there too

---

## Backend Test (Verify Backend is Working)

Run these commands in terminal to verify backend:

```bash
# Test 1: Transfer money
CONV_ID=$(curl -s -X POST http://localhost:3000/chat -H 'Content-Type: application/json' -d '{"message": "transfer 50 from checking to savings", "userId": "cli_test"}' | jq -r '.conversationId')

curl -s -X POST http://localhost:3000/chat -H 'Content-Type: application/json' -d "{\"message\": \"yes do it\", \"userId\": \"cli_test\", \"conversationId\": \"$CONV_ID\"}" | jq '{checking: .updatedUserProfile.accounts.checking, savings: .updatedUserProfile.accounts.savings}'

# Expected: Shows updated balances (checking: 2950, savings: 8050)
```

---

## Common Issues:

### Issue: Dashboard not updating
**Cause:** Browser cache
**Fix:** Hard refresh (Ctrl+Shift+R)

### Issue: Console shows version 2.0, not 3.0
**Cause:** Old JavaScript loaded
**Fix:**
1. Clear browser cache completely
2. Close and reopen browser
3. Navigate to app again

### Issue: No console logs when transferring
**Cause:** DevTools not open or wrong tab
**Fix:** Open DevTools (F12) → Console tab → Try transfer again

### Issue: Balances show $16,000 (hardcoded values)
**Cause:** `currentUserProfile` is null
**Fix:** Check console for errors. Profile should load on page load.

---

## Debug Checklist:

Open DevTools Console and run:
```javascript
// Check if currentUserProfile exists
console.log('Profile:', currentUserProfile);

// Check current balances
console.log('Checking:', currentUserProfile?.accounts?.checking);
console.log('Savings:', currentUserProfile?.accounts?.savings);
```

**Expected output:**
```
Profile: {id: "default", name: "Sarah Chen", accounts: {...}, ...}
Checking: 3000  (or whatever current value is)
Savings: 8000   (or whatever current value is)
```

If `currentUserProfile` is `null`, the profile didn't load. Check network tab for failed requests.

---

## Files Modified:

**Backend:**
- `backend/src/server.ts` - Added user profile storage & persistence
- `backend/lib/chat/chat-handler.ts` - Return updated profiles
- All endpoints now save/return updated profiles

**Frontend:**
- `frontend/app.js` - Added profile update handling
  - Line 991-992: Stream handling
  - Line 1069-1070: Fallback handling
  - Line 35-48: updateUserProfile function
  - Line 284-321: Real balance calculation

---

## Success Criteria:

✅ Browser console shows v3.0 loaded
✅ Console shows profile update logs after transfer
✅ Dashboard balances update immediately
✅ Created goals appear in both Goals and Dashboard tabs
✅ Profile persists after page refresh

If all above pass → Everything is working! 🎉
