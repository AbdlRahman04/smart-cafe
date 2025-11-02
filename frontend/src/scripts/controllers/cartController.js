import { sessionStore } from "../stores/sessionStore.js";
import { OrderService } from "../services/order.js";
import { customizationStore } from "../stores/customizationStore.js";

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
  let customTotalMinor = 0;

  cart.items.forEach(ci => {
    // Get customization data if available
    const customization = customizationStore.get(ci.id);
    const unitPriceMinor = customization ? customization.customPriceMinor : ci.item.price_minor;
    const linePriceMinor = unitPriceMinor * ci.qty;
    customTotalMinor += linePriceMinor;

    // Build customization details string
    let customizationDetails = "";
    if (customization) {
      const details = [];
      if (customization.size && customization.size !== "Small") {
        details.push(`Size: ${customization.size}`);
      }
      if (customization.addons && customization.addons.length > 0) {
        // Note: We'd need to fetch item data to show addon names, for now just show count
        details.push(`${customization.addons.length} addon(s)`);
      }
      if (details.length > 0) {
        customizationDetails = `<div style="font-size:12px;color:var(--brand);margin-top:4px;">${details.join(", ")}</div>`;
      }
    }

    const row = document.createElement("div");
    row.className = "panel";
    row.setAttribute("data-cart-item-id", ci.id);
    row.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;">
        <div style="flex:1">
          <strong>${ci.item.name}</strong>
          ${customizationDetails}
          <div style="opacity:.7;margin-top:4px;">
            <div>Unit: <span class="unit-price">${money(unitPriceMinor)}</span></div>
            <div>Line: <span class="line" data-base="${ci.line_total_minor}">${money(linePriceMinor)}</span></div>
          </div>
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
  // Use customized total if we have customizations, otherwise use backend total
  const displayTotalMinor = customTotalMinor > 0 && customTotalMinor !== cart.total_minor 
    ? customTotalMinor 
    : cart.total_minor;
  total.innerHTML = `<h3>Total: <span id="cartTotal" data-base="${cart.total_minor}">${money(displayTotalMinor)}</span></h3>
    ${customTotalMinor > 0 && customTotalMinor !== cart.total_minor 
      ? `<div style="font-size:12px;color:var(--muted);margin-top:4px;">Base total: ${money(cart.total_minor)}</div>` 
      : ''}
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px">
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
      // Remove customization data
      customizationStore.remove(id);
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
    // Clear customization data
    cart.items.forEach(ci => {
      customizationStore.remove(ci.id);
    });
    const snapshot = await OrderService.clearCart(sessionStore.getToken());
    rerender(snapshot);
  });

  function refreshLineAndTotal(itemId, snapshot) {
    // Update the DOM from snapshot
    const found = snapshot.items.find(x => x.id === itemId);
    if (found) {
      root.querySelector(`input.qty[data-id="${itemId}"]`).value = found.qty;
      
      // Check for customization and update price accordingly
      const customization = customizationStore.get(itemId);
      const unitPriceMinor = customization ? customization.customPriceMinor : found.item.price_minor;
      const linePriceMinor = unitPriceMinor * found.qty;
      
      const lineEl = root.querySelector(`input.qty[data-id="${itemId}"]`).closest(".panel").querySelector(".line");
      lineEl.textContent = money(linePriceMinor);
      
      // Update unit price if customized
      const unitPriceEl = root.querySelector(`input.qty[data-id="${itemId}"]`).closest(".panel").querySelector(".unit-price");
      if (unitPriceEl) {
        unitPriceEl.textContent = money(unitPriceMinor);
      }
    }
    
    // Recalculate total with customizations
    let customTotalMinor = 0;
    snapshot.items.forEach(ci => {
      const customization = customizationStore.get(ci.id);
      const unitPriceMinor = customization ? customization.customPriceMinor : ci.item.price_minor;
      customTotalMinor += unitPriceMinor * ci.qty;
    });
    
    const displayTotalMinor = customTotalMinor > 0 && customTotalMinor !== snapshot.total_minor 
      ? customTotalMinor 
      : snapshot.total_minor;
    const totalEl = document.getElementById("cartTotal");
    totalEl.textContent = money(displayTotalMinor);
    totalEl.setAttribute("data-base", snapshot.total_minor);
  }

  function rerender(snapshot) {
    // quick rerender: simplest path
    renderCart(); // idempotent
  }
}
