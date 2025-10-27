import { AuthService } from "../services/authService.js";
import { sessionStore } from "../stores/sessionStore.js";

export function mountLoginForm() {
  const form = document.getElementById("loginForm");
  const errBox = document.getElementById("loginError");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errBox && (errBox.textContent = "");
    const fd = new FormData(form);
    const username = fd.get("username");
    const password = fd.get("password");

    try {
      const { token } = await AuthService.login({ username, password });
      if (!token) throw new Error("No token returned");
      sessionStore.setToken(token);
      window.location.href = "./index.html";
    } catch (err) {
      const msg = err?.body?.detail || "Invalid username or password.";
      if (errBox) errBox.textContent = msg;
    }
  });
}
