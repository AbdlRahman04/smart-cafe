In Progress.....

# Smart Café (University Project)

This is a full-stack web application for managing a university cafeteria.
Students can:
- Log in and browse menus
- Add meals to cart and pre-order for pickup
- Pay using an internal wallet or linked card

Admins can:
- Manage menu items and prices
- View daily orders and reports

## 📁 Folder structure
smart-cafe/
├─ frontend/
│  ├─ public/
│  │  ├─ favicon.ico                      🟡
│  │  └─ app-config.js                    ✅
│  └─ src/
│     ├─ pages/
│     │  ├─ index.html                    ✅
│     │  ├─ menu.html                     ✅
│     │  ├─ cart.html                     ✅
│     │  ├─ checkout.html                 ✅
│     │  ├─ wallet.html                   ✅
│     │  ├─ login.html                    ✅
│     │  ├─ register.html                 ✅
│     │  ├─ orders.html                   ✅
│     │  └─ admin/
│     │     ├─ dashboard.html             ❌
│     │     └─ menu.html                  ❌
│     ├─ components/
│     │  ├─ header.html                   ✅
│     │  └─ footer.html                   ✅
│     ├─ styles/
│     │  ├─ variables.css                 ✅
│     │  ├─ base.css                      ✅
│     │  ├─ components.css                ✅
│     │  └─ pages/
│     │     ├─ menu.css                   🟡
│     │     ├─ cart.css                   🟡
│     │     ├─ checkout.css               🟡
│     │     ├─ wallet.css                 ✅   (used by wallet page)
│     │     ├─ auth.css                   🟡
│     │     ├─ admin.css                  ❌
│     │     └─ orders.css                 🟡
│     └─ scripts/
│        ├─ app.js                        ✅   (inject, wireAuthLinks, requireAuth, updateWalletDisplay)
│        ├─ config/
│        │  └─ constants.js               ✅   (ENDPOINTS incl. ORDERS)
│        ├─ utils/
│        │  ├─ dom.js                     ❌
│        │  ├─ format.js                  ❌
│        │  ├─ http.js                    ✅
│        │  └─ events.js                  ❌
│        ├─ stores/
│        │  ├─ sessionStore.js            ✅
│        │  ├─ cartStore.js               ❌
│        │  └─ walletStore.js             ❌
│        ├─ services/
│        │  ├─ auth.js                    ✅
│        │  ├─ menu.js                    ✅
│        │  ├─ order.js                   ✅   (cart ops + checkout + list orders)
│        │  ├─ paymentMethod.js           ❌   (future: cards)
│        │  └─ walletService.js           ✅
│        └─ controllers/
│           ├─ authController.js          ❌   (login handled inline)
│           ├─ menuController.js          ✅
│           ├─ cartController.js          ✅
│           ├─ checkoutController.js      ❌   (checkout handled inline)
│           ├─ walletController.js        ✅
│           ├─ ordersController.js        ✅
│           ├─ adminMenuController.js     ❌
│           └─ adminDashboardController.js ❌
└─ backend/                       ← Django + DRF API
   ├─ manage.py
   ├─ config/                     ← Django project
   │  ├─ settings.py
   │  ├─ urls.py
   │  └─ ...
   └─ apps/
      ├─ accounts/               ← auth endpoints (login/register/me)
      ├─ catalog/                ← categories & items
      ├─ orders/                 ← place & list orders
      └─ wallet/                 ← wallet balance & topups

## ⚙️ Local setup (backend)
To run the backend locally:
```bash
cd backend
python -m venv .venv
. .venv/Scripts/Activate.ps1
pip install -r requirements.txt
python manage.py runserver

Open the URL shown (usually http://127.0.0.1:8000). If you see the Django welcome page, close the server with Ctrl+C.


