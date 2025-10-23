import { request } from "../utils/http.js";
import { ENDPOINTS } from "../config/constants.js";
import { sessionStore } from "../stores/sessionStore.js";

export async function login(username, password) {
  const data = await request(ENDPOINTS.LOGIN, "POST", { username, password });
  sessionStore.setToken(data.token);
  return data;
}

// UPDATED: include email (backend expects it)
export async function register(username, email, password) {
  return request(ENDPOINTS.REGISTER, "POST", { username, email, password });
}

export function logout() {
  sessionStore.clear();
  window.location.href = "./login.html";
}
