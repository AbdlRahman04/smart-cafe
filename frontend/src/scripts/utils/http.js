import { API_BASE } from "../config/constants.js";


export async function request(endpoint, method="GET", data=null, token=null){
  const headers = { "Content-Type":"application/json" };
  if (token) headers["Authorization"] = `Token ${token}`;
  const res = await fetch(API_BASE + endpoint, {
    method, headers, body: data ? JSON.stringify(data) : null
  });
  if (!res.ok){
    let msg = res.statusText;
    try { const j = await res.json(); msg = j.detail || j.message || msg; } catch {}
    throw new Error(msg);
  }
  return res.json();
}
