export const API_BASE = window.API_BASE || "http://127.0.0.1:8000/api";
export const ENDPOINTS = {

  LOGIN: "/accounts/login/",
  REGISTER: "/accounts/register/",

  MENU_CATEGORIES: "/catalog/categories/",   // ← we will use this key

  CART: "/orders/cart/",
  CART_ITEMS: "/orders/cart/items/",
  CHECKOUT: "/orders/checkout/",

  WALLET: "/wallet/",
  WALLET_TOPUP: "/wallet/topup/",
  ORDERS: "/orders/orders/",   // /api + this path => /api/orders/orders/
};

