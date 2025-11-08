import { sessionStore } from "./stores/sessionStore.js";
import { WalletService } from "./services/walletService.js";
import { OrderService } from "./services/order.js";
import { me as getMe } from "./services/auth.js";
import { customizationStore } from "./stores/customizationStore.js";

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

// Cart drawer toggle
export function wireCartDrawer() {
  const openBtn = document.getElementById("cartButton");
  const closeBtn = document.getElementById("cartClose");
  const drawer = document.getElementById("cartDrawer");
  const backdrop = document.getElementById("cartBackdrop");
  if (!openBtn || !drawer || !backdrop) return;

  let bodyEl = drawer.querySelector('.drawer-body');

  function money(minor) { return (minor / 100).toFixed(2); }

  async function renderCartDrawerBody() {
    if (!bodyEl) {
      console.error('Drawer body element not found');
      return;
    }
    
    // Show loading state
    bodyEl.innerHTML = '<div class="cart-empty-state"><p class="cart-empty-text">Loading cart...</p></div>';
    
    try {
      // Get wallet balance for meal plan display
      let walletBalance = 0;
      try {
        const wallet = await WalletService.getWallet();
        walletBalance = Number(wallet.balance_minor || 0);
      } catch (e) {
        console.error('Failed to load wallet:', e);
      }

      let cart;
      try {
        cart = await OrderService.getCart(sessionStore.getToken());
      } catch (e) {
        console.error('Failed to load cart:', e);
        bodyEl.innerHTML = `
          <div class="meal-plan-balance">
            <div class="meal-plan-balance-label">Wallet Balance</div>
            <div class="meal-plan-balance-amount">${money(walletBalance)} AED</div>
          </div>
          <div class="cart-empty-state">
            <p class="cart-empty-text">Failed to load cart. Please try again.</p>
          </div>
          <div class="drawer-checkout">
            <button class="checkout-btn" disabled style="opacity:0.5;cursor:not-allowed;">
              Checkout
              <span class="checkout-help" title="Need help?">?</span>
            </button>
          </div>
        `;
        return;
      }
      
      const isEmpty = !cart || !cart.items || cart.items.length === 0;

      // Wallet Balance Section
      const mealPlanSection = `
        <div class="meal-plan-balance">
          <div class="meal-plan-balance-label">Wallet Balance</div>
          <div class="meal-plan-balance-amount">${money(walletBalance)} AED</div>
        </div>
      `;

      let cartContent = '';
      
      if (isEmpty) {
        // Empty cart state
        cartContent = `
          <div class="cart-empty-state">
            <svg class="cart-empty-icon" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            <p class="cart-empty-text">Your cart is empty</p>
          </div>
        `;
      } else {
        // Calculate totals with customizations
        let customTotalMinor = 0;
        const itemsHtml = cart.items.map(ci => {
          const customization = customizationStore.get(ci.id);
          const unitPriceMinor = customization ? customization.customPriceMinor : ci.item.price_minor;
          const linePriceMinor = unitPriceMinor * ci.qty;
          customTotalMinor += linePriceMinor;

          // Build customization details
          let customizationDetails = "";
          if (customization) {
            const details = [];
            if (customization.size && customization.size !== "Small") {
              details.push(`Size: ${customization.size}`);
            }
            if (customization.addons && customization.addons.length > 0) {
              details.push(`${customization.addons.length} addon(s)`);
            }
            if (details.length > 0) {
              customizationDetails = `<div class="cart-item-customization">${details.join(", ")}</div>`;
            }
          }

          // Item image
          const imageHtml = ci.item.image_url 
            ? `<img src="${ci.item.image_url}" alt="${ci.item.name}" class="drawer-item-image" />`
            : `<div class="drawer-item-image-placeholder">🍽️</div>`;

          return `
            <div class="drawer-cart-item" data-cart-item-id="${ci.id}">
              <div class="drawer-item-image-wrapper">
                ${imageHtml}
              </div>
              <div class="drawer-item-content">
                <div class="drawer-item-header">
                  <div class="drawer-item-name">${ci.item.name}</div>
                  <button class="drawer-item-remove" data-remove="${ci.id}" aria-label="Remove item">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
                ${customizationDetails}
                <div class="drawer-item-controls">
                  <button class="drawer-qty-btn dec" data-id="${ci.id}">−</button>
                  <input class="drawer-qty-input" data-id="${ci.id}" type="number" min="1" value="${ci.qty}" />
                  <button class="drawer-qty-btn inc" data-id="${ci.id}">+</button>
                  <div class="drawer-item-price">${money(linePriceMinor)} AED</div>
                </div>
              </div>
            </div>
          `;
        }).join('');

        // Calculate tax (8%)
        const displayTotalMinor = customTotalMinor > 0 && customTotalMinor !== cart.total_minor 
          ? customTotalMinor 
          : cart.total_minor;
        const subtotal = displayTotalMinor / 100;
        const tax = subtotal * 0.08;
        const total = subtotal + tax;
        
        cartContent = `
          <div class="drawer-cart-items">
            ${itemsHtml}
          </div>
          <div class="drawer-order-summary">
            <hr class="drawer-divider" />
            <div class="drawer-summary-row">
              <span>Subtotal</span>
              <span>${money(displayTotalMinor)} AED</span>
            </div>
            <div class="drawer-summary-row">
              <span>Tax (8%)</span>
              <span>${tax.toFixed(2)} AED</span>
            </div>
            <div class="drawer-summary-row drawer-total-row">
              <span>Total</span>
              <span class="drawer-total-amount">${total.toFixed(2)} AED</span>
            </div>
          </div>
        `;
      }

      // Checkout button
      const checkoutButton = `
        <div class="drawer-checkout">
          <button class="checkout-btn" ${isEmpty ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''} onclick="window.location.href='./checkout.html'">
            Checkout
            <span class="checkout-help" title="Need help?">?</span>
          </button>
        </div>
      `;

      bodyEl.innerHTML = mealPlanSection + cartContent + checkoutButton;
      
      // Update cart count after rendering
      updateCartCount();
      
      // Wire up event handlers for cart items (will be set up on first click)
      // Events are delegated, so they work even after innerHTML updates
    } catch (e) {
      console.error('Failed to render cart drawer:', e);
      bodyEl.innerHTML = `
        <div class="meal-plan-balance">
          <div class="meal-plan-balance-label">Wallet Balance</div>
          <div class="meal-plan-balance-amount">0.00 AED</div>
        </div>
        <div class="cart-empty-state">
          <p class="cart-empty-text">Failed to load cart. Please refresh the page.</p>
        </div>
        <div class="drawer-checkout">
          <button class="checkout-btn" disabled style="opacity:0.5;cursor:not-allowed;">
            Checkout
            <span class="checkout-help" title="Need help?">?</span>
          </button>
        </div>
      `;
    }
  }

  // Wire drawer events - using event delegation so it works after innerHTML updates
  let drawerEventsWired = false;
  function wireDrawerCartEvents() {
    if (drawerEventsWired) return; // Only wire once
    
    const drawer = document.getElementById("cartDrawer");
    if (!drawer) return;

    drawer.addEventListener("click", async (e) => {
      const token = sessionStore.getToken();
      
      // Remove item
      if (e.target.closest("[data-remove]")) {
        const removeBtn = e.target.closest("[data-remove]");
        const id = Number(removeBtn.getAttribute("data-remove"));
        customizationStore.remove(id);
        await OrderService.removeItem(id, token);
        await renderCartDrawerBody();
        updateCartCount();
        window.dispatchEvent(new CustomEvent('cart:updated'));
        return;
      }

      // Increment quantity
      if (e.target.classList.contains("inc") || e.target.closest(".inc")) {
        const btn = e.target.classList.contains("inc") ? e.target : e.target.closest(".inc");
        const id = Number(btn.getAttribute("data-id"));
        const qtyEl = drawer.querySelector(`.drawer-qty-input[data-id="${id}"]`);
        qtyEl.value = Number(qtyEl.value) + 1;
        await OrderService.updateItem(id, Number(qtyEl.value), token);
        await renderCartDrawerBody();
        updateCartCount();
        window.dispatchEvent(new CustomEvent('cart:updated'));
        return;
      }

      // Decrement quantity
      if (e.target.classList.contains("dec") || e.target.closest(".dec")) {
        const btn = e.target.classList.contains("dec") ? e.target : e.target.closest(".dec");
        const id = Number(btn.getAttribute("data-id"));
        const qtyEl = drawer.querySelector(`.drawer-qty-input[data-id="${id}"]`);
        const next = Math.max(1, Number(qtyEl.value) - 1);
        qtyEl.value = next;
        await OrderService.updateItem(id, next, token);
        await renderCartDrawerBody();
        updateCartCount();
        window.dispatchEvent(new CustomEvent('cart:updated'));
        return;
      }
    });

    drawer.addEventListener("change", async (e) => {
      if (!e.target.classList.contains("drawer-qty-input")) return;
      const id = Number(e.target.getAttribute("data-id"));
      const qty = Math.max(1, Number(e.target.value || 1));
      await OrderService.updateItem(id, qty, sessionStore.getToken());
      await renderCartDrawerBody();
      updateCartCount();
      window.dispatchEvent(new CustomEvent('cart:updated'));
    });
    
    drawerEventsWired = true;
  }
  
  // Wire events when drawer is first opened
  openBtn.addEventListener("click", (e) => {
    e.preventDefault();
    wireDrawerCartEvents(); // Ensure events are wired
    open();
  });

  const open = () => {
    document.body.classList.add("cart-open");
    backdrop.hidden = false;
    drawer.setAttribute("aria-hidden", "false");
    // Always render cart drawer body when opening
    if (bodyEl) {
      renderCartDrawerBody();
    } else {
      console.error('Drawer body element not found when trying to open drawer');
      // Try to find it again
      const newBodyEl = drawer.querySelector('.drawer-body');
      if (newBodyEl) {
        // Update the closure reference
        bodyEl = newBodyEl;
        renderCartDrawerBody();
      } else {
        // Fallback: show error message
        drawer.innerHTML = `
          <div class="drawer-header">
            <div class="drawer-header-content">
              <svg class="drawer-cart-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
              <div class="drawer-title-group">
                <h2 class="drawer-title">Your Order</h2>
                <p class="drawer-subtitle">Review your items and proceed to checkout</p>
              </div>
            </div>
            <button id="cartClose" class="drawer-close" aria-label="Close cart">×</button>
          </div>
          <div class="drawer-body">
            <div class="cart-empty-state">
              <p class="cart-empty-text">Unable to load cart. Please refresh the page.</p>
            </div>
          </div>
        `;
      }
    }
  };
  const close = () => {
    document.body.classList.remove("cart-open");
    drawer.setAttribute("aria-hidden", "true");
    // wait for transition before hiding backdrop if needed
    setTimeout(() => { backdrop.hidden = true; }, 250);
  };

  // Remove the old onclick handler since we're using addEventListener above
  if (closeBtn) closeBtn.onclick = (e) => { e.preventDefault(); close(); };
  backdrop.addEventListener("click", close);
  window.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });

  // Update drawer contents when cart changes elsewhere
  window.addEventListener('cart:updated', () => {
    if (document.body.classList.contains('cart-open')) {
      renderCartDrawerBody();
    }
    updateCartCount();
  });

  // Initialize cart count
  updateCartCount();
}

// Update cart count badge
export async function updateCartCount() {
  const cartButton = document.getElementById("cartButton");
  if (!cartButton) return;

  try {
    const cart = await OrderService.getCart(sessionStore.getToken());
    const count = cart?.items?.reduce((sum, item) => sum + item.qty, 0) || 0;
    
    let badge = cartButton.querySelector(".cart-count-badge");
    if (count > 0) {
      if (!badge) {
        badge = document.createElement("span");
        badge.className = "cart-count-badge";
        cartButton.appendChild(badge);
      }
      badge.textContent = count > 99 ? "99+" : count.toString();
    } else if (badge) {
      badge.remove();
    }
  } catch (e) {
    // If not logged in or error, hide badge
    const badge = cartButton.querySelector(".cart-count-badge");
    if (badge) badge.remove();
  }
}

// Show toast notification
let toastHideTimeoutId = null;
let toastRemoveTimeoutId = null;

export function showToast(message, type = "success") {
  // Clear any existing timeouts
  if (toastHideTimeoutId) {
    clearTimeout(toastHideTimeoutId);
    toastHideTimeoutId = null;
  }
  if (toastRemoveTimeoutId) {
    clearTimeout(toastRemoveTimeoutId);
    toastRemoveTimeoutId = null;
  }

  // Remove existing toast immediately (no animation delay)
  const existingToast = document.querySelector(".toast");
  if (existingToast) {
    // Cancel any pending timeouts on existing toast
    existingToast.classList.remove("show");
    setTimeout(() => {
      if (existingToast.parentNode) {
        existingToast.remove();
      }
    }, 100);
  }

  // Create new toast element
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  
  const icon = type === "success" 
    ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>'
    : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
  
  toast.innerHTML = `
    <div class="toast-icon">${icon}</div>
    <div class="toast-message">${message}</div>
  `;
  
  // Append to body (not to any container that might be removed/updated)
  document.body.appendChild(toast);
  
  // Use requestAnimationFrame to ensure DOM is painted before adding show class
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      toast.classList.add("show");
      
      // Start the 3-second timer AFTER fade-in completes (350ms)
      // This ensures the toast is fully visible for 3 full seconds
      toastHideTimeoutId = setTimeout(() => {
        // After 3 seconds of being fully visible, start fade-out
        toast.classList.remove("show");
        
        // Remove from DOM after fade-out animation completes (400ms)
        toastRemoveTimeoutId = setTimeout(() => {
          if (toast && toast.parentNode) {
            toast.remove();
          }
          toastHideTimeoutId = null;
          toastRemoveTimeoutId = null;
        }, 400); // Slightly longer than transition (350ms) for safety
      }, 3350); // 350ms fade-in + 3000ms visible = 3350ms total
    });
  });
}

// Show admin link if staff/superuser
export async function showAdminIfStaff() {
  try {
    const user = await getMe();
    if (user?.is_staff || user?.is_superuser) {
      const link = document.querySelector("#adminLink");
      if (link) {
        link.style.display = "block";
        link.href = "./admin/dashboard.html";
        link.textContent = "Admin";
      }
    }
  } catch {
    // not logged in or unauthorized; ignore
  }
}
