import { sessionStore } from "./stores/sessionStore.js";
import { WalletService } from "./services/walletService.js";


export async function inject(partialPath, mountSelector){
  const el = document.querySelector(mountSelector);
  if (!el) return;
  const res = await fetch(partialPath, { cache: "no-cache" });
  el.innerHTML = await res.text();
}

export function wireAuthLinks(){
  const loggedIn = sessionStore.isLoggedIn();
  const loginLink = document.getElementById("loginLink");
  const logoutLink = document.getElementById("logoutLink");
  if (loginLink) loginLink.style.display = loggedIn ? "none" : "";
  if (logoutLink){
    logoutLink.style.display = loggedIn ? "" : "none";
    logoutLink.onclick = (e)=>{
      e.preventDefault();
      sessionStore.clear();
      window.location.href = "./login.html";
    };
  }
}

export function requireAuth(){
  if (!sessionStore.isLoggedIn()){
    window.location.replace("./login.html");
  }
}

export async function updateWalletDisplay() {
  const el = document.getElementById("walletDisplay");
  if (!el) return;
  const token = sessionStore.getToken();
  if (!token) { el.textContent = ""; return; }

  try {
    const w = await WalletService.getWallet(token);
    el.textContent = `${(w.balance_minor / 100).toFixed(2)} AED`;
  } catch {
    el.textContent = "";
  }
}