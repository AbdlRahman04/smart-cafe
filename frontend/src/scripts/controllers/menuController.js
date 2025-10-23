import { sessionStore } from "../stores/sessionStore.js";
import { fetchCategories } from "../services/menu.js";
import { request } from "../utils/http.js";
import { ENDPOINTS } from "../config/constants.js";

export async function renderMenu(){
  const token = sessionStore.getToken();
  const container = document.getElementById("menuContainer");
  container.innerHTML = "<p>Loading menu…</p>";

  const cats = await fetchCategories(token);
  container.innerHTML = "";
  for (const cat of cats){
    const wrapper = document.createElement("div");
    wrapper.className = "panel";
    wrapper.innerHTML = `<h2>${cat.name}</h2>`;
    for (const it of cat.items){
      const row = document.createElement("div");
      row.className = "menu-card";
      row.innerHTML = `
        <div>
          <strong>${it.name}</strong>
          <div class="price">${(it.price_minor/100).toFixed(2)} AED</div>
        </div>
        <button class="btn" data-id="${it.id}">Add</button>
      `;
      wrapper.appendChild(row);
    }
    container.appendChild(wrapper);
  }

  container.addEventListener("click", async (e)=>{
    if (e.target.matches("button[data-id]")){
      const id = Number(e.target.getAttribute("data-id"));
      await request(ENDPOINTS.CART_ITEMS, "POST", { item_id:id, qty:1 }, token);
      e.target.textContent = "Added!";
      setTimeout(()=> e.target.textContent = "Add", 800);
    }
  });
}
