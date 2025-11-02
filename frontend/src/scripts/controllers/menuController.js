import { sessionStore } from "../stores/sessionStore.js";
import { fetchCategories } from "../services/menu.js";
import { request } from "../utils/http.js";
import { ENDPOINTS } from "../config/constants.js";
import { customizationStore } from "../stores/customizationStore.js";
import { showToast, updateCartCount } from "../app.js";

// State
let allCategories = [];
let allItems = [];
let selectedCategory = "all";
let searchQuery = "";

// Mock data structure for customization (to be replaced with backend data later)
const getItemCustomizationData = (item) => {
  // This will be replaced with actual backend data when available
  return {
    nutrients: {
      calories: 350,
      protein: "15g",
      carbs: "45g",
      fat: "12g",
      fiber: "5g"
    },
    sizeOptions: [
      { label: "Small", priceModifier: 0 },
      { label: "Large", priceModifier: 0.3 } // 30% more
    ],
    addons: [
      { id: 1, name: "Extra Cheese", priceMinor: 200 },
      { id: 2, name: "Extra Sauce", priceMinor: 100 },
      { id: 3, name: "Avocado", priceMinor: 300 }
    ],
    preparationTime: Math.floor(Math.random() * 10) + 5 // 5-15 minutes
  };
};

export async function renderMenu() {
  const token = sessionStore.getToken();
  const container = document.getElementById("menuContainer");
  container.innerHTML = "<p>Loading menu…</p>";

  // Fetch categories and items
  allCategories = await fetchCategories(token);
  
  // Flatten items for easier filtering
  allItems = [];
  allCategories.forEach(cat => {
    cat.items.forEach(item => {
      allItems.push({ ...item, categoryName: cat.name, categoryId: cat.id });
    });
  });

  // Render category filters
  renderCategoryFilters();

  // Render menu items
  renderMenuItems();

  // Setup event listeners
  setupEventListeners(token);
}

function renderCategoryFilters() {
  const filtersContainer = document.getElementById("categoryFilters");
  
  // Keep "All Menu" button
  let html = '<button class="category-btn active" data-category="all">All Menu</button>';
  
  // Add category buttons
  allCategories.forEach(cat => {
    const icon = getCategoryIcon(cat.name);
    html += `<button class="category-btn" data-category="${cat.id}">${icon} ${cat.name}</button>`;
  });
  
  filtersContainer.innerHTML = html;

  // Add click handlers
  filtersContainer.querySelectorAll(".category-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      filtersContainer.querySelectorAll(".category-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      selectedCategory = btn.getAttribute("data-category");
      renderMenuItems();
    });
  });
}

function getCategoryIcon(categoryName) {
  const icons = {
    "Breakfast": "☕",
    "Lunch": "🍽️",
    "Dinner": "🍽️",
    "Beverages": "🥤",
    "Snacks": "🍪",
    "Desserts": "🍰"
  };
  const normalized = categoryName.toLowerCase();
  for (const [key, icon] of Object.entries(icons)) {
    if (normalized.includes(key.toLowerCase())) return icon;
  }
  return "🍴";
}

function renderMenuItems() {
  const container = document.getElementById("menuContainer");
  
  // Filter items
  let filteredItems = allItems;
  
  // Filter by category
  if (selectedCategory !== "all") {
    filteredItems = filteredItems.filter(item => item.categoryId === Number(selectedCategory));
  }
  
  // Filter by search query
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filteredItems = filteredItems.filter(item => 
      item.name.toLowerCase().includes(query) ||
      (item.description && item.description.toLowerCase().includes(query)) ||
      item.categoryName.toLowerCase().includes(query)
    );
  }

  if (filteredItems.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: var(--muted); padding: 40px;">No items found matching your criteria.</p>';
    return;
  }

  // Render items as cards
  container.innerHTML = filteredItems.map(item => {
    const price = (item.price_minor / 100).toFixed(2);
    const customization = getItemCustomizationData(item);
    const imageHtml = item.image_url 
      ? `<img src="${item.image_url}" alt="${item.name}" class="menu-item-image" />`
      : `<div class="menu-item-image-placeholder">🍽️</div>`;
    
    return `
      <div class="menu-item-card" data-item-id="${item.id}">
        <div class="menu-item-image-wrapper">
          ${imageHtml}
          <span class="category-tag">${item.categoryName}</span>
        </div>
        <div class="menu-item-content">
          <h3 class="menu-item-title">${item.name}</h3>
          ${item.description ? `<p class="menu-item-description">${item.description}</p>` : ''}
          <div class="menu-item-footer">
            <div>
              <div class="menu-item-price">${price} AED</div>
              <div class="preparation-time">
                <span>⏱</span>
                <span>${customization.preparationTime} min</span>
              </div>
            </div>
          </div>
          <button class="add-btn" data-item-id="${item.id}">
            <span>+</span>
            <span>Add</span>
          </button>
        </div>
      </div>
    `;
  }).join("");

  // Add click handlers for cards
  container.querySelectorAll(".menu-item-card").forEach(card => {
    card.addEventListener("click", (e) => {
      // Don't open modal if clicking the Add button (it will be handled separately)
      if (e.target.classList.contains("add-btn") || e.target.closest(".add-btn")) {
        return;
      }
      const itemId = card.getAttribute("data-item-id");
      if (itemId) {
        const item = allItems.find(i => i.id === Number(itemId));
        if (item) {
          openCustomizationModal(item);
        }
      }
    });
  });

  // Add click handlers for Add buttons
  container.querySelectorAll(".add-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const itemId = btn.getAttribute("data-item-id");
      if (itemId) {
        const item = allItems.find(i => i.id === Number(itemId));
        if (item) {
          openCustomizationModal(item);
        }
      }
    });
  });
}

function setupEventListeners(token) {
  // Search input
  const searchInput = document.getElementById("searchInput");
  let searchTimeout;
  searchInput.addEventListener("input", (e) => {
    searchQuery = e.target.value;
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      renderMenuItems();
    }, 300); // Debounce search
  });

  // Modal close handlers
  const modal = document.getElementById("customizationModal");
  const closeBtn = document.querySelector(".modal-close");
  
  closeBtn.addEventListener("click", () => {
    closeCustomizationModal();
  });
  
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeCustomizationModal();
    }
  });

  // Close modal on ESC key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("active")) {
      closeCustomizationModal();
    }
  });

  // Add to cart from modal
  document.addEventListener("click", async (e) => {
    if (e.target.matches(".add-to-cart-btn") || e.target.closest(".add-to-cart-btn")) {
      const btn = e.target.matches(".add-to-cart-btn") ? e.target : e.target.closest(".add-to-cart-btn");
      const itemId = Number(btn.getAttribute("data-item-id"));
      const size = btn.getAttribute("data-size") || "Small";
      const addons = JSON.parse(btn.getAttribute("data-addons") || "[]");
      
      // Find the item to get base price
      const item = allItems.find(i => i.id === itemId);
      if (!item) {
        alert("Item not found");
        return;
      }

      // Calculate customized price
      const customization = getItemCustomizationData(item);
      const basePriceMinor = item.price_minor;
      const sizeOption = customization.sizeOptions.find(s => s.label === size);
      const sizeModifier = sizeOption ? sizeOption.priceModifier : 0;
      let customPriceMinor = Math.round(basePriceMinor * (1 + sizeModifier));
      
      // Add addon prices
      addons.forEach(addonId => {
        const addon = customization.addons.find(a => a.id === addonId);
        if (addon) {
          customPriceMinor += addon.priceMinor;
        }
      });
      
      try {
        // Show toast notification IMMEDIATELY (before async operations)
        showToast(`${item.name} added to cart!`);
        
        // Add item to cart
        const cartItemResponse = await request(ENDPOINTS.CART_ITEMS, "POST", { item_id: itemId, qty: 1 }, token);
        
        // Save customization data with the cart item ID
        // Note: If the item already existed in cart, backend will update quantity but return the same cart item ID
        // So we can safely overwrite any previous customization for this cart item
        if (cartItemResponse && cartItemResponse.id) {
          customizationStore.save(cartItemResponse.id, itemId, {
            size,
            addons,
            customPriceMinor,
            basePriceMinor
          });
        }
        
        btn.textContent = "Added!";

        // Inform other parts of the UI (drawer) that the cart changed
        window.dispatchEvent(new CustomEvent('cart:updated'));
        
        // Update cart count (but don't let it interfere with toast)
        updateCartCount();
        
        // Close modal after a delay (but after toast is shown)
        setTimeout(() => {
          closeCustomizationModal();
          // Optionally redirect to cart to see the updated price
          // window.location.href = "./cart.html";
        }, 800);
      } catch (err) {
        alert("Failed to add item to cart: " + (err?.message || err));
      }
    }
  });
}

function openCustomizationModal(item) {
  const modal = document.getElementById("customizationModal");
  const modalBody = document.getElementById("modalBody");
  const customization = getItemCustomizationData(item);
  
  const basePrice = item.price_minor / 100;
  let selectedSize = "Small";
  const selectedAddons = [];

  // Create modal content
  const imageHtml = item.image_url 
    ? `<img src="${item.image_url}" alt="${item.name}" class="modal-item-image" />`
    : `<div class="modal-item-image-placeholder">🍽️</div>`;

  let html = `
    ${imageHtml}
    <div class="modal-item-header">
      <h2 class="modal-item-title">${item.name}</h2>
      <p class="modal-item-description">${item.description || "Delicious dish from our menu"}</p>
    </div>

    <div class="modal-section">
      <h3 class="modal-section-title">Size</h3>
      <div class="size-options" id="sizeOptions">
        ${customization.sizeOptions.map((size, idx) => {
          const sizePrice = basePrice * (1 + size.priceModifier);
          const isSelected = idx === 0 ? "selected" : "";
          return `
            <div class="size-option ${isSelected}" data-size="${size.label}" data-modifier="${size.priceModifier}">
              <div class="size-option-label">${size.label}</div>
              <div class="size-option-price">${sizePrice.toFixed(2)} AED</div>
            </div>
          `;
        }).join("")}
      </div>
    </div>

    <div class="modal-section">
      <h3 class="modal-section-title">Nutrition Information</h3>
      <div class="nutrients-grid">
        <div class="nutrient-item">
          <div class="nutrient-label">Calories</div>
          <div class="nutrient-value">${customization.nutrients.calories}</div>
        </div>
        <div class="nutrient-item">
          <div class="nutrient-label">Protein</div>
          <div class="nutrient-value">${customization.nutrients.protein}</div>
        </div>
        <div class="nutrient-item">
          <div class="nutrient-label">Carbs</div>
          <div class="nutrient-value">${customization.nutrients.carbs}</div>
        </div>
        <div class="nutrient-item">
          <div class="nutrient-label">Fat</div>
          <div class="nutrient-value">${customization.nutrients.fat}</div>
        </div>
        <div class="nutrient-item">
          <div class="nutrient-label">Fiber</div>
          <div class="nutrient-value">${customization.nutrients.fiber}</div>
        </div>
        <div class="nutrient-item">
          <div class="nutrient-label">Prep Time</div>
          <div class="nutrient-value">${customization.preparationTime} min</div>
        </div>
      </div>
    </div>

    <div class="modal-section">
      <h3 class="modal-section-title">Add-ons (Optional)</h3>
      <div class="addons-list" id="addonsList">
        ${customization.addons.map(addon => {
          const addonPrice = (addon.priceMinor / 100).toFixed(2);
          return `
            <div class="addon-item" data-addon-id="${addon.id}" data-price="${addon.priceMinor}">
              <span class="addon-label">${addon.name}</span>
              <span class="addon-price">+${addonPrice} AED</span>
            </div>
          `;
        }).join("")}
      </div>
    </div>

    <div class="modal-footer">
      <div>
        <div style="font-size: 14px; color: var(--muted); margin-bottom: 4px;">Total</div>
        <div class="modal-total-price" id="modalTotalPrice">${basePrice.toFixed(2)} AED</div>
      </div>
      <button class="add-to-cart-btn" data-item-id="${item.id}" data-size="${selectedSize}" data-addons="[]">
        Add to Cart
      </button>
    </div>
  `;

  modalBody.innerHTML = html;

  // Setup size selection
  document.getElementById("sizeOptions").querySelectorAll(".size-option").forEach(option => {
    option.addEventListener("click", () => {
      document.querySelectorAll(".size-option").forEach(o => o.classList.remove("selected"));
      option.classList.add("selected");
      selectedSize = option.getAttribute("data-size");
      updateModalPrice();
    });
  });

  // Setup addon selection
  document.getElementById("addonsList").querySelectorAll(".addon-item").forEach(addonEl => {
    addonEl.addEventListener("click", () => {
      const addonId = Number(addonEl.getAttribute("data-addon-id"));
      if (addonEl.classList.contains("selected")) {
        addonEl.classList.remove("selected");
        const index = selectedAddons.indexOf(addonId);
        if (index > -1) selectedAddons.splice(index, 1);
      } else {
        addonEl.classList.add("selected");
        selectedAddons.push(addonId);
      }
      updateModalPrice();
    });
  });

  function updateModalPrice() {
    // Calculate base price with size modifier
    const sizeOption = customization.sizeOptions.find(s => s.label === selectedSize);
    const sizeModifier = sizeOption ? sizeOption.priceModifier : 0;
    let totalPrice = basePrice * (1 + sizeModifier);

    // Add addon prices
    selectedAddons.forEach(addonId => {
      const addon = customization.addons.find(a => a.id === addonId);
      if (addon) {
        totalPrice += addon.priceMinor / 100;
      }
    });

    // Update display
    document.getElementById("modalTotalPrice").textContent = totalPrice.toFixed(2) + " AED";
    
    // Update button data
    const addToCartBtn = document.querySelector(".add-to-cart-btn");
    addToCartBtn.setAttribute("data-size", selectedSize);
    addToCartBtn.setAttribute("data-addons", JSON.stringify(selectedAddons));
  }

  // Show modal
  modal.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeCustomizationModal() {
  const modal = document.getElementById("customizationModal");
  modal.classList.remove("active");
  document.body.style.overflow = "";
}
