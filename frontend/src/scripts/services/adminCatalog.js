import { request } from "../utils/http.js";
import { ENDPOINTS } from "../config/constants.js";

export const AdminCatalog = {
  listItems(token) {
    return request(ENDPOINTS.ADMIN_CATALOG_ITEMS, "GET", null, token);
  },
  updateItem(id, data, token) {
    return request(`${ENDPOINTS.ADMIN_CATALOG_ITEMS}${id}/`, "PATCH", data, token);
  },
  deleteItem(id, token) {
    return request(`${ENDPOINTS.ADMIN_CATALOG_ITEMS}${id}/`, "DELETE", null, token);
  },
  createItem(data, token) {
    return request(ENDPOINTS.ADMIN_CATALOG_ITEMS, "POST", data, token);
  },
};


