import { request } from "../utils/http.js";
import { ENDPOINTS } from "../config/constants.js";

export const OrderService = {
  getCart(token) {
    return request(ENDPOINTS.CART, "GET", null, token);
  },
  addItem(item_id, qty, token) {
    return request(ENDPOINTS.CART_ITEMS, "POST", { item_id, qty }, token);
  },
  updateItem(itemRowId, qty, token) {
    return request(`${ENDPOINTS.CART_ITEMS}${itemRowId}/`, "PATCH", { qty }, token);
  },
  removeItem(itemRowId, token) {
    return request(`${ENDPOINTS.CART_ITEMS}${itemRowId}/`, "DELETE", null, token);
  },
  clearCart(token) {
    return request(ENDPOINTS.CART, "DELETE", null, token);
  },
  checkout(pickup_time_iso, token) {
    return request(ENDPOINTS.CHECKOUT, "POST", { pickup_time: pickup_time_iso }, token);
  },
};

    export const OrdersQuery = {
  list(token) {
    return request(ENDPOINTS.ORDERS, "GET", null, token);
  },
};