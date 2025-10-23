import { request } from "../utils/http.js";
import { ENDPOINTS } from "../config/constants.js";

export const WalletService = {
  getWallet(token) {
    return request(ENDPOINTS.WALLET, "GET", null, token);
  },
  topup(amount_minor, token) {
    return request(ENDPOINTS.WALLET_TOPUP, "POST", { amount_minor }, token);
  },
};
