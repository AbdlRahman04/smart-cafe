import { sessionStore } from "../stores/sessionStore.js";
import { request } from "./http.js";
import { ENDPOINTS } from "../config/constants.js";

/**
 * Require admin or superuser authentication.
 * Redirects to login if not authenticated, or home if not admin.
 */
export async function requireAdminAuth() {
  if (!sessionStore.isLoggedIn()) {
    // Check if we're in admin folder or root
    const isAdminFolder = window.location.pathname.includes('/admin/');
    const redirectPath = isAdminFolder ? '../login.html' : './login.html';
    window.location.replace(redirectPath);
    throw new Error("Not authenticated");
  }

  try {
    const token = sessionStore.getToken();
    const user = await request(ENDPOINTS.ME, "GET", null, token);
    
    if (!user.is_staff && !user.is_superuser) {
      const isAdminFolder = window.location.pathname.includes('/admin/');
      const redirectPath = isAdminFolder ? '../index.html' : './index.html';
      window.location.replace(redirectPath);
      throw new Error("Not authorized - admin access required");
    }
    
    return user;
  } catch (err) {
    if (err.message && err.message.includes("Not authorized")) {
      throw err;
    }
    // If we can't fetch user data, redirect to login
    const isAdminFolder = window.location.pathname.includes('/admin/');
    const redirectPath = isAdminFolder ? '../login.html' : './login.html';
    window.location.replace(redirectPath);
    throw new Error("Authentication failed");
  }
}

