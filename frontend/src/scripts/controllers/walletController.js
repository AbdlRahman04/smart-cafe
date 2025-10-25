import { sessionStore } from "../stores/sessionStore.js";
import { WalletService } from "../services/walletService.js";

function money(minor) {
  return (minor / 100).toFixed(2) + " AED";
}

export async function renderWallet() {
  const token = sessionStore.getToken();
  const container = document.getElementById("walletContainer");
  container.innerHTML = "<p>Loading wallet...</p>";

  try {
    const wallet = await WalletService.getWallet(token);

  container.innerHTML = `
  <div class="panel" style="max-width:480px;margin:auto;">
    <h2>Wallet Balance</h2>
    <h3 id="balance">${money(wallet.balance_minor)}</h3>
    <hr />
    <div style="margin-top:1rem;">

 <label for="amount" style="display:block; margin-bottom:15px;">Top-up Amount (AED)</label>
          <input id="amount" type="number" step="5" min="5" placeholder="Enter amount" />
          <button id="topupBtn" class="btn" style="margin-top:15px;">Add Funds</button>
          <p id="msg" style="color:var(--danger)"></p>

    </div>
    <hr />
    <div class="panel" style="margin-top:1rem;background:#222;border:1px dashed #444;">
      <h3>Other Payment Methods</h3>
      <button class="btn secondary" disabled style="opacity:0.7;cursor:not-allowed;">
        💳 Pay with Credit Card (Coming Soon)
      </button>
    </div>
  </div>
`;


    document.getElementById("topupBtn").addEventListener("click", async () => {
      const val = Number(document.getElementById("amount").value || 0);
      const msg = document.getElementById("msg");
      msg.textContent = "";
      if (val < 1) {
        msg.textContent = "Enter a valid amount";
        return;
      }

      try {
        const updated = await WalletService.topup(val * 100, token);
        document.getElementById("balance").textContent = money(updated.balance_minor);
        document.getElementById("amount").value = "";
      } catch (err) {
        msg.textContent = err.message || "Top-up failed.";
        console.error(err);
      }
    });

  } catch (err) {
    container.innerHTML = `<div class="panel" style="border-color:#a00">Error: ${err.message}</div>`;
  }
}
