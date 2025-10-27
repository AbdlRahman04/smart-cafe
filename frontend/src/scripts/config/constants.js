export const API_BASE = window.API_BASE || "http://127.0.0.1:8000/api";

export const ENDPOINTS = {

  LOGIN: "/accounts/login/",
  REGISTER: "/accounts/register/",
  ME:           "/accounts/me/",
  LOGOUT:       "/accounts/logout/",   // if you implemented it
  WALLET:         "/wallet/",
  WALLET_TOPUP:     "/wallet/topup/",


  MENU_CATEGORIES: "/catalog/categories/",   // ← we will use this key
  CART: "/orders/cart/",
  CART_ITEMS: "/orders/cart/items/",
  CHECKOUT: "/orders/checkout/",

  // CATALOG (adjust if your URLs differ)
  CATEGORIES:   "/catalog/categories/",
  ITEMS:        "/catalog/items/",        // support ?category=ID, ?search=, etc.


  ORDERS: "/orders/orders",   // /api + this path => /api/orders/orders/
  ORDER_DETAIL: (id) => `/orders/${id}/`, // GET detail

};

