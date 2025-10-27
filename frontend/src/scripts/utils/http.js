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
      msg = j.detail || j.message || msg;
    } catch {}
    throw new Error(msg);
  }
  // allow empty 204
  if (res.status === 204) return null;
  return res.json();
}
