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

## ⚙️ Local setup (backend)
To run the backend locally:
```bash
cd backend
python -m venv .venv
. .venv/Scripts/Activate.ps1
pip install -r requirements.txt
python manage.py runserver