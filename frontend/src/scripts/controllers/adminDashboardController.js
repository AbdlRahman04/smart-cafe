import { sessionStore } from "../stores/sessionStore.js";
import { request } from "../utils/http.js";
import { ENDPOINTS } from "../config/constants.js";

// Store chart data for resize handling
let chartData = [];

function money(minor) {
  return (minor / 100).toFixed(2);
}

function formatMoney(minor) {
  return `${money(minor)} AED`;
}

export async function renderDashboard() {
  const token = sessionStore.getToken();
  
  try {
    const data = await request(ENDPOINTS.ADMIN_DASHBOARD, "GET", null, token);
    
    // Update KPI cards
    document.getElementById("totalOrders").textContent = data.total_orders;
    document.getElementById("ordersToday").textContent = `+${data.orders_today} today`;
    
    document.getElementById("totalRevenue").textContent = formatMoney(data.total_revenue_minor);
    document.getElementById("revenueToday").textContent = `+${formatMoney(data.revenue_today_minor)} today`;
    
    document.getElementById("activeOrders").textContent = data.active_orders;
    document.getElementById("avgOrder").textContent = formatMoney(data.avg_order_minor);

    // Store chart data for resize
    chartData = data.daily_revenue;

    // Render chart
    renderPerformanceChart(chartData);

    // Handle window resize for chart
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        renderPerformanceChart(chartData);
      }, 250);
    });

    // Render orders table
    renderOrdersTable(data.recent_orders, token);

  } catch (err) {
    console.error("Failed to load dashboard:", err);
    document.querySelector(".container").innerHTML = `
      <div class="panel" style="border-color: var(--danger); text-align: center; padding: 40px;">
        <h2>Failed to Load Dashboard</h2>
        <p>${err.message || "Unknown error"}</p>
        <a href="../index.html" class="btn" style="margin-top: 20px;">Go to Home</a>
      </div>
    `;
  }
}

function renderPerformanceChart(dailyRevenue) {
  const canvas = document.getElementById("performanceChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const container = canvas.parentElement;
  if (!container) return;
  
  const width = container.clientWidth || 800;
  const height = 300;
  
  // Set canvas size
  canvas.width = width;
  canvas.height = height;
  
  // Set display size for proper scaling
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  if (dailyRevenue.length === 0) {
    ctx.fillStyle = "var(--muted)";
    ctx.font = "16px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("No data available", width / 2, height / 2);
    return;
  }

  // Calculate scales
  const padding = { top: 40, right: 40, bottom: 40, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxRevenue = Math.max(...dailyRevenue.map(d => d.revenue_minor), 1);
  const yScale = chartHeight / maxRevenue;

  // Draw grid
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 1;
  
  // Horizontal grid lines
  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (chartHeight / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();
    
    // Y-axis labels
    const value = maxRevenue - (maxRevenue / 4) * i;
    ctx.fillStyle = "var(--muted)";
    ctx.font = "12px system-ui";
    ctx.textAlign = "right";
    ctx.fillText(formatMoney(value), padding.left - 10, y + 4);
  }

  // X-axis labels
  dailyRevenue.forEach((day, i) => {
    const x = padding.left + (chartWidth / (dailyRevenue.length - 1)) * i;
    ctx.fillStyle = "var(--muted)";
    ctx.font = "12px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(day.day_name, x, height - padding.bottom + 20);
  });

  // Draw line
  ctx.strokeStyle = "var(--brand)";
  ctx.lineWidth = 3;
  ctx.beginPath();

  dailyRevenue.forEach((day, i) => {
    const x = padding.left + (chartWidth / Math.max(dailyRevenue.length - 1, 1)) * i;
    const y = padding.top + chartHeight - (day.revenue_minor * yScale);
    
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });

  ctx.stroke();

  // Draw points
  dailyRevenue.forEach((day, i) => {
    const x = padding.left + (chartWidth / Math.max(dailyRevenue.length - 1, 1)) * i;
    const y = padding.top + chartHeight - (day.revenue_minor * yScale);
    
    ctx.fillStyle = "var(--brand)";
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
  });
}

function renderOrdersTable(orders, token) {
  const tbody = document.getElementById("ordersTableBody");
  if (!tbody) return;

  if (orders.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 20px; color: var(--muted);">
          No orders yet
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = orders.map(order => {
    const statusClass = getStatusClass(order.status);
    const statusOptions = ['pending', 'paid', 'preparing', 'ready', 'completed', 'cancelled'];
    
    return `
      <tr>
        <td>#${order.id}</td>
        <td>${escapeHtml(order.student)}</td>
        <td>${escapeHtml(order.items)}</td>
        <td>${formatMoney(order.amount_minor)}</td>
        <td>${order.pickup_time}</td>
        <td>
          <span class="status-badge status-${statusClass}">${order.status}</span>
        </td>
        <td>
          <select class="status-select" data-order-id="${order.full_id}" data-current="${order.status}">
            ${statusOptions.map(opt => 
              `<option value="${opt}" ${opt === order.status ? 'selected' : ''}>${opt.charAt(0).toUpperCase() + opt.slice(1)}</option>`
            ).join('')}
          </select>
        </td>
      </tr>
    `;
  }).join('');

  // Add event listeners for status updates
  tbody.querySelectorAll('.status-select').forEach(select => {
    select.addEventListener('change', async (e) => {
      const orderId = e.target.getAttribute('data-order-id');
      const newStatus = e.target.value;
      const currentStatus = e.target.getAttribute('data-current');
      
      if (newStatus === currentStatus) return;

      try {
        await request(ENDPOINTS.ADMIN_ORDER_UPDATE(orderId), "PATCH", { status: newStatus }, token);
        e.target.setAttribute('data-current', newStatus);
        
        // Update status badge
        const row = e.target.closest('tr');
        const badge = row.querySelector('.status-badge');
        badge.textContent = newStatus;
        badge.className = `status-badge status-${getStatusClass(newStatus)}`;
        
        // Show success feedback
        const originalBg = row.style.backgroundColor;
        row.style.backgroundColor = 'rgba(46, 204, 113, 0.1)';
        setTimeout(() => {
          row.style.backgroundColor = originalBg;
        }, 1000);
      } catch (err) {
        alert("Failed to update order status: " + (err.message || err));
        e.target.value = currentStatus; // Revert
      }
    });
  });
}

function getStatusClass(status) {
  const classes = {
    'pending': 'pending',
    'paid': 'paid',
    'preparing': 'preparing',
    'ready': 'ready',
    'completed': 'completed',
    'cancelled': 'cancelled'
  };
  return classes[status] || 'pending';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

