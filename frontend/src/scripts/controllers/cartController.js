import { sessionStore } from "../stores/sessionStore.js";
import { OrderService } from "../services/order.js";

function money(minor) { return (minor / 100).toFixed(2) + " AED"; }

export async function renderCart() {
  const token = sessionStore.getToken();
  const root = document.getElementById("cartContainer");
  root.innerHTML = "<p>Loading cart…</p>";

  const cart = await OrderService.getCart(token);
  if (!cart.items.length) {
    root.innerHTML = `<div class="panel"><p>Your cart is empty.</p>
      <p><a class="btn" href="./menu.html">Back to Menu</a></p></div>`;
    return;
  }

  const list = document.createElement("div");
  list.className = "grid";
  cart.items.forEach(ci => {
    const row = document.createElement("div");
    row.className = "panel";
    row.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;">
        <div>
          <strong>${ci.item.name}</strong>
          <div style="opacity:.7">Unit: ${money(ci.item.price_minor)}</div>
          <div style="opacity:.7">Line: <span class="line">${money(ci.line_total_minor)}</span></div>
        </div>
        <div style="display:flex;align-items:center;gap:6px;">
          <button class="btn secondary dec" data-id="${ci.id}">−</button>
          <input class="qty" data-id="${ci.id}" type="number" min="1" value="${ci.qty}" style="width:70px;text-align:center">
          <button class="btn secondary inc" data-id="${ci.id}">+</button>
          <button class="btn" style="background:#e74c3c;color:#fff" data-remove="${ci.id}">Remove</button>
        </div>
      </div>`;
    list.appendChild(row);
  });

  const total = document.createElement("div");
  total.className = "panel";
  total.innerHTML = `<h3>Total: <span id="cartTotal">${money(cart.total_minor)}</span></h3>
    <div style="display:flex;gap:10px;flex-wrap:wrap">
      <button id="clearCart" class="btn secondary">Clear Cart</button>
      <a href="./checkout.html" class="btn">Proceed to Checkout</a>
    </div>`;

  root.innerHTML = "";
  root.appendChild(list);
  root.appendChild(total);

  // Wire actions
  root.addEventListener("click", async (e) => {
    const token = sessionStore.getToken();
    if (e.target.matches("[data-remove]")) {
      const id = Number(e.target.getAttribute("data-remove"));
      const snapshot = await OrderService.removeItem(id, token);
      return rerender(snapshot);
    }
    if (e.target.classList.contains("inc")) {
      const id = Number(e.target.getAttribute("data-id"));
      const qtyEl = root.querySelector(`input.qty[data-id="${id}"]`);
      qtyEl.value = Number(qtyEl.value) + 1;
      const snapshot = await OrderService.updateItem(id, Number(qtyEl.value), token);
      return refreshLineAndTotal(id, snapshot);
    }
    if (e.target.classList.contains("dec")) {
      const id = Number(e.target.getAttribute("data-id"));
      const qtyEl = root.querySelector(`input.qty[data-id="${id}"]`);
      const next = Math.max(1, Number(qtyEl.value) - 1);
      qtyEl.value = next;
      const snapshot = await OrderService.updateItem(id, next, token);
      return refreshLineAndTotal(id, snapshot);
    }
  });

  root.addEventListener("change", async (e) => {
    if (!e.target.classList.contains("qty")) return;
    const id = Number(e.target.getAttribute("data-id"));
    const qty = Math.max(1, Number(e.target.value || 1));
    const snapshot = await OrderService.updateItem(id, qty, sessionStore.getToken());
    refreshLineAndTotal(id, snapshot);
  });

  document.getElementById("clearCart").addEventListener("click", async () => {
    const snapshot = await OrderService.clearCart(sessionStore.getToken());
    rerender(snapshot);
  });

  function refreshLineAndTotal(itemId, snapshot) {
    // Update the DOM from snapshot
    const found = snapshot.items.find(x => x.id === itemId);
    if (found) {
      root.querySelector(`input.qty[data-id="${itemId}"]`).value = found.qty;
      root.querySelector(`input.qty[data-id="${itemId}"]`).closest(".panel")
        .querySelector(".line").textContent = money(found.line_total_minor);
    }
    document.getElementById("cartTotal").textContent = money(snapshot.total_minor);
  }

  function rerender(snapshot) {
    // quick rerender: simplest path
    renderCart(); // idempotent
  }
}
