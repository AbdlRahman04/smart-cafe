# 🚀 Quick Start: Network Access

## For You (Main Computer - Server)

### Start the Backend:
**Windows:**
```bash
double-click: start-network-server.bat
```

**Mac/Linux:**
```bash
chmod +x start-network-server.sh
./start-network-server.sh
```

### Start Frontend:
Open `frontend/src/pages/index.html` with Live Server

---

## For Your Friends (Other Devices)

### 1. Open on their device:
```
frontend/public/app-config.js
```

### 2. Replace line 2 with YOUR IP:
```javascript
window.API_BASE = "http://172.16.82.148:8000/api";
```

Replace `172.16.82.148` with YOUR actual IP address!

### 3. Open website on their device:
```
http://172.16.82.148:5500/frontend/src/pages/index.html
```

---

## Find Your IP Address

**Windows:**
```bash
ipconfig
```
Look for: `IPv4 Address` under "Wireless LAN adapter Wi-Fi"

**Mac/Linux:**
```bash
ifconfig  # or: ip addr
```

---

## ✅ Registration is Already Enabled!

Users can register new accounts directly - no extra configuration needed!

---

## Troubleshooting

- **Can't connect?** Make sure both devices are on the SAME WiFi network
- **Wrong IP?** Your IP might have changed - run `ipconfig` again
- **Backend not running?** Use `0.0.0.0:8000` not just `:8000`

See `NETWORK_SETUP.md` for detailed instructions!

