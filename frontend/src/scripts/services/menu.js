import { request } from "../utils/http.js";
import { ENDPOINTS } from "../config/constants.js";

export function fetchCategories(token){
  return request(ENDPOINTS.MENU_CATEGORIES, "GET", null, token);
}
