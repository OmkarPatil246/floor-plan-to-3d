# VR QR Code Generation - Debug Guide

## Problem
When clicking "Enter VR Mode", it shows "Failed to generate QR code"

## Updated Code - Better Error Messages
I've added comprehensive error logging to help identify the issue:

### New Console Logs to Check

1. **When page loads:**
   ```
   ✅ QRCode library loaded successfully
   ```
   OR
   ```
   ❌ QRCode library failed to load - VR QR code generation will not work
   ```

2. **When clicking "Enter VR Mode":**
   ```
   🔍 Attempting to generate QR code...
     URL: http://192.168.x.x:8080/?vr=auto
     QRCode library available: true
     Container: Found
   ✅ All checks passed, creating QR code...
   ✅ QR code generated successfully!
   ```

## How to Debug

### Step 1: Open Browser Console
1. Go to http://localhost:8080/
2. Press **F12** to open Developer Tools
3. Click the **Console** tab

### Step 2: Check Library Status
Look for this message when page loads:
- ✅ `QRCode library loaded successfully` → Library is working
- ❌ `QRCode library failed to load` → Internet/CDN issue

### Step 3: Load a Floor Plan
1. Click any sample floor plan (Modern Villa, etc.)
2. Wait for 3D model to load

### Step 4: Try Generate QR Code
1. Click "Enter VR Mode" button
2. Watch the console for error messages

## Common Errors & Solutions

### Error: "QRCode library not loaded"
**Cause:** CDN failed to load the library
**Solutions:**
1. Check internet connection
2. Try reloading the page (Ctrl+R or F5)
3. Check if firewall is blocking cdn.jsdelivr.net
4. Try a different browser

### Error: "No Floor Plan Loaded"
**Cause:** No floor plan was uploaded/selected
**Solution:**
1. Click one of the sample floor plans first
2. OR upload your own image
3. Wait for 3D model to appear
4. Then try "Enter VR Mode" again

### Error: "Invalid URL provided"
**Cause:** Server info endpoint returned empty/invalid data
**Solution:**
1. Check server is running: `netstat -ano | Select-String ":8080"`
2. Check server logs for errors
3. Try: `curl http://localhost:8080/api/server-info`
4. Should return JSON with `vr_url` field

### Error: "QR code container element not found"
**Cause:** HTML structure issue (very rare)
**Solution:**
1. Hard reload: Ctrl+Shift+R
2. Clear cache and reload
3. Check if modal HTML exists in page source

### Error: "Failed to fetch" or "Network error"
**Cause:** Server endpoint `/api/server-info` not responding
**Solution:**
1. Verify server is running on port 8080
2. Check server/main.py has `/api/server-info` endpoint
3. Check server logs for errors
4. Try accessing directly: http://localhost:8080/api/server-info

## Manual Testing

### Test 1: Check QRCode Library
Open console and type:
```javascript
typeof QRCode
```
Expected result: `"function"` (not `"undefined"`)

### Test 2: Check Container
Open console and type:
```javascript
document.getElementById('qr-code-container')
```
Expected result: HTML element (not `null`)

### Test 3: Check Server Info API
Open console and type:
```javascript
fetch('/api/server-info').then(r => r.json()).then(console.log)
```
Expected result:
```json
{
  "ok": true,
  "local_ip": "192.168.x.x",
  "port": 8080,
  "protocol": "http",
  "vr_url": "http://192.168.x.x:8080/?vr=auto"
}
```

### Test 4: Manually Generate QR Code
If all above tests pass, try manually:
```javascript
const container = document.getElementById('qr-code-container');
container.innerHTML = '';
new QRCode(container, {
  text: 'http://localhost:8080/?vr=auto',
  width: 256,
  height: 256
});
```
This should generate a QR code in the modal.

## What Changed

### Files Modified:
- `viewer/index.html`

### Changes:
1. Added QRCode library load check on page load
2. Enhanced `generateQRCode()` function with detailed logging
3. Better error messages showing exact failure reason
4. QR code generation moved BEFORE floor plan saving (non-blocking)
5. Fallback method for saving floor plan data if server endpoint fails

## Next Steps

1. **Open the page** → http://localhost:8080/
2. **Open console** → Press F12
3. **Load floor plan** → Click sample plan
4. **Try VR mode** → Click "Enter VR Mode"
5. **Check console** → Look for error messages
6. **Report back** → Send me the exact console error messages

## Expected Working Flow

```
Console Log Sequence (Success):
─────────────────────────────────────
1. ✅ QRCode library loaded successfully
2. [User clicks sample floor plan]
3. [3D model loads]
4. [User clicks "Enter VR Mode"]
5. 🔍 Attempting to generate QR code...
6.   URL: http://192.168.x.x:8080/?vr=auto
7.   QRCode library available: true
8.   Container: Found
9. ✅ All checks passed, creating QR code...
10. ✅ QR code generated successfully!
11. 📱 Saving floor plan data for VR phone access...
12. ✅ Floor plan data saved for VR mode (via server)
```

## Troubleshooting by Error Message

| Error Message | Likely Cause | Fix |
|---------------|--------------|-----|
| "QRCode library not loaded" | CDN blocked/offline | Reload page, check internet |
| "No Floor Plan Loaded" | No floor plan selected | Load a sample plan first |
| "Invalid URL provided" | Server API error | Check server logs |
| "Container element not found" | HTML/DOM issue | Hard reload page |
| "Failed to fetch" | Server offline | Check port 8080 is running |
| "Network error" | CORS/firewall | Check server CORS settings |

## Still Not Working?

Send me the **exact console output** including:
1. All messages when page loads
2. All messages when clicking "Enter VR Mode"
3. Any red error messages
4. Result of Test 3 (server-info API test)

This will help me pinpoint the exact issue!
