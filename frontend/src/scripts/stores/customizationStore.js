// Store customization data (size, addons, custom price) for cart items
// Keys: "cart_item_{cartItemId}" or "item_{itemId}_{timestamp}"

const STORAGE_KEY_PREFIX = "cart_customization_";

export const customizationStore = {
  /**
   * Save customization data for a cart item
   * @param {number} cartItemId - The cart item ID from backend
   * @param {number} itemId - The menu item ID
   * @param {object} customization - { size, addons: [], customPriceMinor, basePriceMinor }
   */
  save(cartItemId, itemId, customization) {
    const key = `${STORAGE_KEY_PREFIX}${cartItemId}`;
    const data = {
      cartItemId,
      itemId,
      ...customization,
      savedAt: Date.now()
    };
    localStorage.setItem(key, JSON.stringify(data));
  },

  /**
   * Get customization data for a cart item
   * @param {number} cartItemId - The cart item ID
   * @returns {object|null} Customization data or null
   */
  get(cartItemId) {
    const key = `${STORAGE_KEY_PREFIX}${cartItemId}`;
    const data = localStorage.getItem(key);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  },

  /**
   * Remove customization data for a cart item
   * @param {number} cartItemId - The cart item ID
   */
  remove(cartItemId) {
    const key = `${STORAGE_KEY_PREFIX}${cartItemId}`;
    localStorage.removeItem(key);
  },

  /**
   * Clear all customization data (useful when clearing cart)
   */
  clearAll() {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(STORAGE_KEY_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  },

  /**
   * Get all customization data for cart items
   * @returns {object} Map of cartItemId -> customization data
   */
  getAll() {
    const customizations = {};
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(STORAGE_KEY_PREFIX)) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          if (data.cartItemId) {
            customizations[data.cartItemId] = data;
          }
        } catch {
          // Invalid data, skip
        }
      }
    });
    return customizations;
  }
};

