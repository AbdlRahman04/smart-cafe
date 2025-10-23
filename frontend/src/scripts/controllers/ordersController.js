import { sessionStore } from "../stores/sessionStore.js";
import { OrdersQuery } from "../services/order.js";

const statusColors = {
  pending: "#f1c40f",
  paid: "#2ecc71",
  preparing: "#3498db",
  ready: "#9b59b6",
  completed: "#27ae60",
  cancelled: "#e74c3c",
};

function money(minor){ return (minor/100).toFixed(2) + " AED"; }
function badge(status){
  const color = statusColors[status] || "#95a5a6";
  return `<span style="background:${color};color:#000;padding:2px 8px;border-radius:999px;font-weight:700">
    ${status.toUpperCase()}
  </span>`;
}

export async function renderOrders(){
  const token = sessionStore.getToken();
  const mount = document.getElementById("ordersContainer");
  mount.innerHTML = "<p>Loading orders…</p>";

  const rows = await OrdersQuery.list(token);
  if (!rows.length){
    mount.innerHTML = `<div class="panel"><p>No orders yet.</p>
      <p><a class="btn" href="./menu.html">Order something</a></p></div>`;
    return;
  }

  const list = document.createElement("div");
  list.className = "grid";
  rows.forEach(o=>{
    const items = (o.items || []).map(i => `${i.item_name} × ${i.qty}`).join(", ");
    const when = new Date(o.pickup_time).toLocaleString();
    const el = document.createElement("div");
    el.className = "panel";
    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap">
        <div>
          <h3 style="margin:0 0 6px 0">Order #${o.id}</h3>
          <div>Pickup: <strong>${when}</strong></div>
          <div style="opacity:.8;margin-top:4px">${items}</div>
        </div>
        <div style="text-align:right">
          <div>${badge(o.status)}</div>
          <div style="margin-top:8px;font-size:18px;font-weight:700">${money(o.total_minor)}</div>
        </div>
      </div>`;
    list.appendChild(el);
  });

  mount.innerHTML = "";
  mount.appendChild(list);
}
