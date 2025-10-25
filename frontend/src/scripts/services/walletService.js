import { request } from "../utils/http.js";
import { ENDPOINTS } from "../config/constants.js";
import { sessionStore } from "../stores/sessionStore.js";

export const WalletService = {
  getWallet() {
    const token = sessionStore.getToken();
    return request(ENDPOINTS.WALLET, "GET", null, token);
  },
  topup(amount_minor) {
    const token = sessionStore.getToken();
    return request(ENDPOINTS.WALLET_TOPUP, "POST", { amount_minor }, token);
  },
};
