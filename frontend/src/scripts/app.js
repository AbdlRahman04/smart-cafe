import { sessionStore } from "./stores/sessionStore.js";
import { WalletService } from "./services/walletService.js";
import { me as getMe } from "./services/auth.js";

export async function inject(partialPath, mountSelector) {
  const el = document.querySelector(mountSelector);
  if (!el) return;
  const res = await fetch(partialPath, { cache: "no-cache" });
  el.innerHTML = await res.text();
}

export function wireAuthLinks() {
  const loggedIn = sessionStore.isLoggedIn();
  const loginLink = document.getElementById("loginLink");
  const logoutLink = document.getElementById("logoutLink");
  if (loginLink) loginLink.style.display = loggedIn ? "none" : "";
  if (logoutLink) {
    logoutLink.style.display = loggedIn ? "" : "none";
    logoutLink.onclick = (e) => {
      e.preventDefault();
      sessionStore.clear();
      window.location.href = "./login.html";
    };
  }
}

export function requireAuth() {
  if (!sessionStore.isLoggedIn()) {
    window.location.replace("./login.html");
  }
}

export async function updateWalletDisplay() {
  const el = document.getElementById("walletDisplay");
  if (!el) return;
  if (!sessionStore.isLoggedIn()) { el.textContent = ""; return; }

  try {
    const w = await WalletService.getWallet();
    el.textContent = `${(Number(w.balance_minor || 0) / 100).toFixed(2)} AED`;
  } catch {
    el.textContent = "";
  }
}

// Mobile nav toggle (called after header injection)
export function wireNavToggle() {
  const btn = document.getElementById("navToggle");
  const links = document.getElementById("navLinks");
  if (!btn || !links) return;
  btn.onclick = () => links.classList.toggle("open");
  links.querySelectorAll("a").forEach(a =>
    a.addEventListener("click", () => links.classList.remove("open"))
  );
}

// Show admin link if staff/superuser
export async function showAdminIfStaff() {
  try {
    const user = await getMe();
    if (user?.is_staff || user?.is_superuser) {
      const link = document.querySelector("#adminLink");
      if (link) link.style.display = "block";
    }
  } catch {
    // not logged in or unauthorized; ignore
  }
}
