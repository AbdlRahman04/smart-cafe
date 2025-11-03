# Network Setup Guide for Smart Café

This guide will help you configure the Smart Café application to run on your local network, allowing friends and other devices to access it.

## ✅ Configuration Complete

The backend has been configured to allow network access. Here's what needs to be done:

### Backend Configuration (✅ Already Done)

The `settings.py` has been updated with:
- `ALLOWED_HOSTS = ['localhost', '127.0.0.1', '172.16.82.148']`
- `CORS_ALLOW_ALL_ORIGINS = True` (already configured)

### Frontend Configuration

**IMPORTANT:** Each device needs a different configuration. Choose **Option A** or **Option B**:

---

## Option A: Update Each Device's Configuration (Recommended for Easy Access)

Each friend/device on your network needs to update their `app-config.js` file.

### Step 1: Find Your Host Machine's IP Address

On your main computer (running the servers), open Command Prompt/Terminal and run:
- **Windows:** `ipconfig` (look for IPv4 Address in the wireless adapter section)
- **Mac/Linux:** `ifconfig` or `ip addr`

Example output:
```
Wireless LAN adapter Wi-Fi:
   IPv4 Address. . . . . . . . . . . : 172.16.82.148
```

### Step 2: Update Other Devices

On each friend's device:

1. Open: `frontend/public/app-config.js`
2. Change line 2 from:
   ```javascript
   window.API_BASE = "http://127.0.0.1:8000/api";
   ```
   To:
   ```javascript
   window.API_BASE = "http://172.16.82.148:8000/api";
   ```
   (Replace `172.16.82.148` with YOUR actual IP address)

### Step 3: Start the Servers

**On your main computer:**

1. **Start Django Backend:**
   ```bash
   cd backend
   python manage.py runserver 0.0.0.0:8000
   ```
   (`0.0.0.0` makes Django listen on all network interfaces)

2. **Start Live Server (for frontend):**
   - If using VS Code Live Server: Right-click on `frontend/src/pages/index.html` → "Open with Live Server"
   - Or use any static file server

### Step 4: Access from Other Devices

Your friends can now access:
- **Frontend:** `http://172.16.82.148:5500` (or whatever port your Live Server uses)
- **Backend API:** `http://172.16.82.148:8000`

---

## Option B: Automatic IP Detection (Advanced)

Create a smart configuration that auto-detects the network.

### Create `frontend/public/app-config.js`:

```javascript
// Auto-detect network configuration
(function() {
    const hostname = window.location.hostname;
    
    // If accessing from localhost, use localhost for API
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        window.API_BASE = "http://127.0.0.1:8000/api";
    } else {
        // If accessing from network, use the same IP for API
        window.API_BASE = `http://${hostname}:8000/api`;
    }
})();
```

---

## For University Network Access

When you're on a university network, you may need to:

1. **Find your university IP:**
   - Run `ipconfig` or `ifconfig` to get your IP
   - Add it to `ALLOWED_HOSTS` in `backend/config/settings.py`

2. **If IP changes frequently:**
   - Temporarily use: `ALLOWED_HOSTS = ['*']` ⚠️ **ONLY for development/testing**
   - Or update the IP whenever it changes

---

## Troubleshooting

### Cannot Access from Other Devices

1. **Check Firewall:**
   - Windows: Allow Python through firewall
   - Mac: System Preferences → Security → Firewall

2. **Verify IP Address:**
   - Both devices must be on same network (WiFi)
   - Check if IP address changed

3. **Test Backend Connection:**
   - On friend's device, open: `http://YOUR_IP:8000/api/healthz`
   - Should return: `{"status":"ok"}`

4. **Check Django is Listening:**
   - Make sure you ran: `python manage.py runserver 0.0.0.0:8000`
   - NOT just: `python manage.py runserver`

### CORS Errors

- Already configured with `CORS_ALLOW_ALL_ORIGINS = True`
- If issues persist, check browser console

### Registration Not Working

- Registration is already enabled with `permission_classes = [AllowAny]`
- Check backend is running and accessible

---

## Security Notes

⚠️ **Important Security Warnings:**

1. **Current Setup is for Development ONLY**
   - `DEBUG = True` exposes detailed error messages
   - `CORS_ALLOW_ALL_ORIGINS = True` allows any origin
   - SQLite database is not suitable for production

2. **For Production:**
   - Set `DEBUG = False`
   - Configure specific `CORS_ALLOWED_ORIGINS`
   - Use a proper database (PostgreSQL, MySQL)
   - Set `ALLOWED_HOSTS` to specific domains
   - Use HTTPS

3. **Don't Expose to Internet:**
   - Current setup is only for local network access
   - Never use `ALLOWED_HOSTS = ['*']` on public internet

---

## Summary

✅ **Backend:** Configured to allow network access
✅ **Registration:** Already enabled for all users
✅ **CORS:** Already configured

**What you need to do:**
1. Update `app-config.js` on each device with your IP
2. Run Django with: `python manage.py runserver 0.0.0.0:8000`
3. Access from other devices using your IP address

**Example Access URLs:**
- Main computer: `http://127.0.0.1:5500/frontend/src/pages/index.html`
- Other devices: `http://172.16.82.148:5500/frontend/src/pages/index.html`

