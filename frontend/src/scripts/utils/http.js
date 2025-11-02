import { API_BASE } from "../config/constants.js";

function joinUrl(base, path) {
  const b = String(base).replace(/\/+$/, "");
  const p = String(path).replace(/^\/+/, "");
  return `${b}/${p}`;
}

export async function request(endpoint, method = "GET", data = null, token = null) {
  const headers = { "Content-Type": "application/json", "Accept": "application/json" };
  if (token) headers["Authorization"] = `Token ${token}`;

  const res = await fetch(joinUrl(API_BASE, endpoint), {
    method,
    headers,
    body: data ? JSON.stringify(data) : null,
  });

  if (!res.ok) {
    let msg = res.statusText;
    try {
      const j = await res.json();
      // Handle various error response formats
      if (j.detail) {
        msg = j.detail;
      } else if (j.error) {
        msg = j.error;
      } else if (j.message) {
        msg = j.message;
      } else if (typeof j === 'object') {
        // Handle field-specific errors (e.g., {"username": ["error"], "email": ["error"]})
        const errors = Object.entries(j)
          .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
          .join('; ');
        if (errors) {
          msg = errors;
        }
      }
    } catch {}
    throw new Error(msg || `Request failed with status ${res.status}`);
  }
  // allow empty 204
  if (res.status === 204) return null;
  return res.json();
}
