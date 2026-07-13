/* =========================================================================
   MANAGER DASHBOARD — DỮ LIỆU TĨNH (STATIC MOCK DATA)
   Ghi chú: Toàn bộ số liệu trong file này là dữ liệu tĩnh dùng để hiển thị
   demo giao diện Dashboard. Khi Back-end có sẵn API thống kê, chỉ cần thay
   các hằng số MD_* bên dưới bằng dữ liệu fetch() từ server.
   ========================================================================= */


/* --- 2. HÀM TIỆN ÍCH --- */

function mdFormatVnd(n) {
  return n.toLocaleString("vi-VN") + "đ";
}
function mdFormatNum(n) {
  return n.toLocaleString("vi-VN");
}

/* --- 3. RENDER: METRIC CARDS --- */

function renderMdMetrics() {
  const host = document.getElementById("md-metrics");
  if (!host) return;
  host.innerHTML = MD_METRICS.map(
    (m) => `
    <div class="md-metric-card">
      <div class="md-metric-top">
        <div class="md-metric-icon">${m.icon}</div>
        <span class="md-badge ${m.up ? "md-badge-up" : "md-badge-down"}">${m.up ? "↗" : "↘"} ${m.delta}</span>
      </div>
      <div class="md-metric-label">${m.label}</div>
      <div class="md-metric-value">${m.value}</div>
    </div>`
  ).join("");
}

/* --- 4. RENDER: BIỂU ĐỒ XU HƯỚNG DOANH THU & VÉ (SVG LINE CHART) --- */

function renderMdTrendChart(range) {
  const host = document.getElementById("md-trend-chart");
  if (!host) return;
  const data = MD_TREND_MAP[range] || MD_TREND_6M;

  const W = 640, H = 230, padL = 10, padR = 10, padT = 15, padB = 26;
  const innerW = W - padL - padR, innerH = H - padT - padB;
  const maxRevenue = Math.max(...data.map((d) => d.revenue)) * 1.15;
  const maxTickets = Math.max(...data.map((d) => d.tickets)) * 1.15;
  const stepX = data.length > 1 ? innerW / (data.length - 1) : 0;

  const xAt = (i) => padL + stepX * i;
  const yAtRevenue = (v) => padT + innerH - (v / maxRevenue) * innerH;
  const yAtTickets = (v) => padT + innerH - (v / maxTickets) * innerH;

  const revenuePts = data.map((d, i) => [xAt(i), yAtRevenue(d.revenue)]);
  const ticketPts = data.map((d, i) => [xAt(i), yAtTickets(d.tickets)]);

  const toPath = (pts) => pts.map((p, i) => (i === 0 ? "M" : "L") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
  const revenueLine = toPath(revenuePts);
  const revenueArea = revenueLine + ` L${xAt(data.length - 1).toFixed(1)},${padT + innerH} L${padL},${padT + innerH} Z`;
  const ticketLine = toPath(ticketPts);

  // Đường lưới ngang (4 mốc)
  let gridLines = "";
  for (let i = 0; i <= 3; i++) {
    const y = padT + (innerH / 3) * i;
    gridLines += `<line x1="${padL}" y1="${y.toFixed(1)}" x2="${W - padR}" y2="${y.toFixed(1)}" class="md-grid"></line>`;
  }

  const axisLabels = data
    .map((d, i) => `<text x="${xAt(i).toFixed(1)}" y="${H - 6}" text-anchor="middle" class="md-axis">${d.label}</text>`)
    .join("");

  const revenueDots = revenuePts
    .map(
      (p, i) => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="4" fill="#ff6b35" class="md-hit"><title>${data[i].label}: ${mdFormatVnd(data[i].revenue)}</title></circle>`
    )
    .join("");
  const ticketDots = ticketPts
    .map(
      (p, i) => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3.5" fill="#4ade80" class="md-hit"><title>${data[i].label}: ${mdFormatNum(data[i].tickets)} vé</title></circle>`
    )
    .join("");

  host.innerHTML = `
    <div style="display:flex; gap:16px; margin-bottom:6px; font-size:11px; color:#9a9aa3;">
      <span style="display:flex;align-items:center;gap:6px;"><i class="md-dot" style="background:#ff6b35;"></i> Doanh thu</span>
      <span style="display:flex;align-items:center;gap:6px;"><i class="md-dot" style="background:#4ade80;"></i> Vé bán</span>
    </div>
    <svg class="md-svg" viewBox="0 0 ${W} ${H}">
      <defs>
        <linearGradient id="mdRevenueFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#ff6b35" stop-opacity="0.35"></stop>
          <stop offset="100%" stop-color="#ff6b35" stop-opacity="0"></stop>
        </linearGradient>
      </defs>
      ${gridLines}
      <path d="${revenueArea}" fill="url(#mdRevenueFill)" stroke="none"></path>
      <path d="${revenueLine}" fill="none" stroke="#ff6b35" stroke-width="2.5"></path>
      <path d="${ticketLine}" fill="none" stroke="#4ade80" stroke-width="2" stroke-dasharray="5 4"></path>
      ${revenueDots}
      ${ticketDots}
      ${axisLabels}
    </svg>`;
}

function mdSwitchTrend(range, btnEl) {
  document.querySelectorAll(".md-seg-btn").forEach((b) => b.classList.remove("active"));
  if (btnEl) btnEl.classList.add("active");
  renderMdTrendChart(range);
}
window.mdSwitchTrend = mdSwitchTrend;

/* --- 5. RENDER: DONUT PHÂN BỐ THỂ LOẠI --- */

function renderMdGenreDonut() {
  const host = document.getElementById("md-genre-chart");
  const legendHost = document.getElementById("md-genre-legend");
  if (!host || !legendHost) return;

  const size = 160, cx = 80, cy = 80, r = 58, strokeW = 22;
  const circumference = 2 * Math.PI * r;
  let offsetAcc = 0;

  const segments = MD_GENRES.map((g) => {
    const segLen = (g.pct / 100) * circumference;
    const seg = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${g.color}" stroke-width="${strokeW}"
        stroke-dasharray="${segLen.toFixed(2)} ${(circumference - segLen).toFixed(2)}"
        stroke-dashoffset="${(-offsetAcc).toFixed(2)}" transform="rotate(-90 ${cx} ${cy})">
        <title>${g.label}: ${g.pct}%</title>
      </circle>`;
    offsetAcc += segLen;
    return seg;
  }).join("");

  host.innerHTML = `
    <svg class="md-donut-svg" viewBox="0 0 ${size} ${size}">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="${strokeW}"></circle>
      ${segments}
    </svg>`;

  legendHost.innerHTML = MD_GENRES.map(
    (g) => `
    <div class="md-legend-row">
      <span class="md-legend-left"><i class="md-dot" style="background:${g.color};"></i>${g.label}</span>
      <b>${g.pct}%</b>
    </div>`
  ).join("");
}

/* --- 6. RENDER: BAR CHART VÉ BÁN THEO THÁNG --- */

function renderMdBarChart() {
  const host = document.getElementById("md-bar-chart");
  if (!host) return;
  const maxVal = Math.max(...MD_BAR_MONTHLY.map((d) => d.value));

  host.innerHTML = `
    <div class="md-bars">
      ${MD_BAR_MONTHLY.map((d) => {
        const pct = Math.max(4, Math.round((d.value / maxVal) * 100));
        const isPeak = d.value === maxVal;
        return `
        <div class="md-bar-col">
          <div class="md-bar-wrap">
            <div class="md-bar-fill ${isPeak ? "peak" : ""}" style="height:${pct}%;" title="${d.label}: ${mdFormatNum(d.value)} vé"></div>
          </div>
          <span class="md-bar-x">${d.label}</span>
        </div>`;
      }).join("")}
    </div>`;
}

/* --- 7. RENDER: TOP PHIM TUẦN NÀY --- */

function renderMdTopMovies() {
  const host = document.getElementById("md-top-movies");
  if (!host) return;
  host.innerHTML = MD_TOP_MOVIES.map(
    (m, i) => `
    <div class="md-tm-row">
      <div class="md-tm-rank">${i + 1}</div>
      <img src="${m.poster}" class="md-tm-poster" alt="${m.title}" onerror="this.style.display='none'">
      <div class="md-tm-info">
        <div class="md-tm-title">${m.title}</div>
        <div class="md-tm-meta">★ ${m.rating.toFixed(1)} <span class="md-tm-genre">· ${m.genre}</span></div>
      </div>
      <span class="md-tm-sold">${m.sold} vé</span>
    </div>`
  ).join("");
}

/* --- 8. RENDER: BẢNG GIAO DỊCH GẦN ĐÂY --- */

function renderMdTransactions() {
  const host = document.getElementById("md-transactions");
  if (!host) return;
  host.innerHTML = `
    <table class="md-tx-table">
      <thead>
        <tr>
          <th>Mã đặt vé</th>
          <th>Phim</th>
          <th>Phòng</th>
          <th>Thời gian</th>
          <th>Số tiền</th>
          <th>Trạng thái</th>
          <th>Phương thức</th>
        </tr>
      </thead>
      <tbody>
        ${MD_TRANSACTIONS.map(
          (t) => `
        <tr>
          <td class="md-tx-id">${t.id}</td>
          <td>${t.movie}</td>
          <td>${t.room}</td>
          <td>${t.time}</td>
          <td class="md-tx-amt">${t.amount}</td>
          <td><span class="md-tx-status ${t.status}">${MD_STATUS_TEXT[t.status]}</span></td>
          <td>${t.method}</td>
        </tr>`
        ).join("")}
      </tbody>
    </table>`;
}

/* =========================================================================
   🚀 ENGINE ĐỔ DỮ LIỆU ĐỘNG TỪ SPRING BOOT LÊN DASHBOARD MANAGER
   ========================================================================= */

// Hàm khởi tạo và bốc dữ liệu từ API tổng
function renderManagerDashboard() {
  const metricsHost = document.getElementById("md-metrics");
  if (!metricsHost) return;

  // 1. Hiển thị trạng thái chờ trong lúc quét Database
  metricsHost.innerHTML = `<div style="color:#888; padding:20px;">Hệ thống đang tổng hợp số liệu thời gian thực...</div>`;

  // Gọi API tổng hợp báo cáo từ Spring Boot
  API.getDashboardOverviewData()
    .then((data) => {
      // Lưu trữ bộ dữ liệu biểu đồ vào window để hàm chuyển tab switchTrend bốc ra xài
      window.dashboardTrendMap = {
        "6M": data.trendRevenueData || [],
        "3M": (data.trendRevenueData || []).slice(3),
        "1M": (data.trendRevenueData || []).slice(4)
      };
      window.dashboardTicketsMonthly = data.ticketsMonthlyData || [];

      // Execute 1: Vẽ 4 thẻ metric bằng dữ liệu thật bốc từ DB
      metricsHost.innerHTML = `
        <div class="md-metric-card">
          <div class="md-metric-top"><div class="md-metric-icon"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg></div><span class="md-badge md-badge-up">↗ Live</span></div>
          <div class="md-metric-label">Doanh thu hôm nay</div>
          <div class="md-metric-value">${(data.todayRevenue || 0).toLocaleString("vi-VN")}đ</div>
        </div>
        <div class="md-metric-card">
          <div class="md-metric-top"><div class="md-metric-icon"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4Z"></path><line x1="13" y1="5" x2="13" y2="19" stroke-dasharray="2,2"></line></svg></div><span class="md-badge md-badge-up">↗ Live</span></div>
          <div class="md-metric-label">Vé đã bán hôm nay</div>
          <div class="md-metric-value">${(data.todayTicketsSold || 0).toLocaleString("vi-VN")} vé</div>
        </div>
        <div class="md-metric-card">
          <div class="md-metric-top"><div class="md-metric-icon"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="18" rx="2" ry="2"></rect><line x1="7" y1="3" x2="7" y2="21"></line><line x1="17" y1="3" x2="17" y2="21"></line><line x1="2" y1="8" x2="7" y2="8"></line><line x1="2" y1="16" x2="7" y2="16"></line><line x1="17" y1="8" x2="22" y2="8"></line><line x1="17" y1="16" x2="22" y2="16"></line></svg></div><span class="md-badge md-badge-up">Active</span></div>
          <div class="md-metric-label">Phim đang hoạt động</div>
          <div class="md-metric-value">${data.activeMoviesCount || 0} phim</div>
        </div>
        <div class="md-metric-card">
          <div class="md-metric-top"><div class="md-metric-icon"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8v8a2 2 0 0 1-1 1.73l-7 4a2 2 0 0 1-2 0l-7-4A2 2 0 0 1 3 16V8"></path><path d="M3.27 6.96 12 12l8.73-5.04"></path><path d="M12 22V12"></path><path d="M3.29 7 12 2l8.71 5"></path></svg></div><span class="md-badge md-badge-down">Kho an toàn</span></div>
          <div class="md-metric-label">Tồn kho bắp nước</div>
          <div class="md-metric-value">Ổn định</div>
        </div>
      `;

      // Execute 2: Vẽ biểu đồ đường xu hướng doanh thu & số vé
      renderDynamicTrendChart("6M");

      // Execute 3: Vẽ biểu đồ hình tròn phân bổ thể loại phim từ Database
      renderDynamicGenreDonut(data.genreData || []);

      // Execute 4: Vẽ biểu đồ cột lượng vé bán ra theo tháng
      renderDynamicBarChart(data.ticketsMonthlyData || []);

      // Execute 5: Hiển thị Top phim đặt nhiều nhất từ Database
      renderDynamicTopMovies(data.topMovies || []);

      // Execute 6: In danh sách 5 giao dịch gần đây nhất ở đáy trang
      renderDynamicTransactions(data.recentOrders || []);
    })
    // 🎯 ĐÃ SỬA: Thay -> bằng => để hết gạch đỏ cú pháp
    .catch((err) => {
      console.error(err);
      metricsHost.innerHTML = `<div style="color:red; padding:20px;">Lỗi kết nối API Dashboard: ${err.message}</div>`;
    });
}
window.renderManagerDashboard = renderManagerDashboard;

// --- ĐOẠN HÀM XỬ LÝ VẼ SVG ĐỘNG HOÀN TOÀN KHÔNG DÙNG SỐ MỒI ---

function renderDynamicTrendChart(range) {
  const host = document.getElementById("md-trend-chart");
  if (!host || !window.dashboardTrendMap) return;
  const data = window.dashboardTrendMap[range] || [];

  if (data.length === 0) { host.innerHTML = "<p style='color:#666;'>Chưa có dữ liệu xu hướng</p>"; return; }

  // Logic tự tính toán tỉ lệ khung SVG dựa trên tiền thật trong Database
  const W = 640, H = 230, padL = 10, padR = 10, padT = 15, padB = 26;
  const innerW = W - padL - padR, innerH = H - padT - padB;
  const maxVal = Math.max(...data.map(d => d.value || 0)) * 1.15 || 1000000;
  const stepX = data.length > 1 ? innerW / (data.length - 1) : innerW;

  const points = data.map((d, i) => [padL + stepX * i, padT + innerH - ((d.value || 0) / maxVal) * innerH]);
  const linePath = points.map((p, i) => (i === 0 ? "M" : "L") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
  const areaPath = linePath + ` L${(padL + stepX * (data.length - 1)).toFixed(1)},${padT + innerH} L${padL},${padT + innerH} Z`;

  let gridLines = "";
  for (let i = 0; i <= 3; i++) {
    const y = padT + (innerH / 3) * i;
    gridLines += `<line x1="${padL}" y1="${y.toFixed(1)}" x2="${W - padR}" y2="${y.toFixed(1)}" stroke="rgba(255,255,255,0.05)" stroke-width="1"></line>`;
  }

  const labels = data.map((d, i) => `<text x="${(padL + stepX * i).toFixed(1)}" y="${H - 6}" text-anchor="middle" fill="#888" font-size="10">${d.label}</text>`).join("");
  const dots = points.map((p, i) => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="4" fill="#ff6b35"><title>${data[i].label}: ${(data[i].value || 0).toLocaleString("vi-VN")}đ</title></circle>`).join("");

  host.innerHTML = `
    <div style="display:flex; gap:16px; margin-bottom:6px; font-size:11px; color:#9a9aa3;">
      <span style="display:flex;align-items:center;gap:6px;"><i style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#ff6b35;"></i> Xu hướng dòng tiền</span>
    </div>
    <svg style="width:100%; height:${H}px; overflow:visible;" viewBox="0 0 ${W} ${H}">
      <defs>
        <linearGradient id="dbTrendFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#ff6b35" stop-opacity="0.25"></stop>
          <stop offset="100%" stop-color="#ff6b35" stop-opacity="0"></stop>
        </linearGradient>
      </defs>
      ${gridLines}
      <path d="${areaPath}" fill="url(#dbTrendFill)"></path>
      <path d="${linePath}" fill="none" stroke="#ff6b35" stroke-width="2.5"></path>
      ${dots} ${labels}
    </svg>`;
}

// Hàm đổi mốc thời gian biểu đồ
window.mdSwitchTrend = function(range, btnEl) {
  document.querySelectorAll(".md-seg-btn").forEach((b) => b.classList.remove("active"));
  if (btnEl) btnEl.classList.add("active");
  renderDynamicTrendChart(range);
};

function renderDynamicGenreDonut(genres) {
  const host = document.getElementById("md-genre-chart");
  const legendHost = document.getElementById("md-genre-legend");
  if (!host || !legendHost) return;

  if (genres.length === 0) {
    host.innerHTML = legendHost.innerHTML = "<p style='color:#666;'>Trống</p>";
    return;
  }

  const colors = ["#ff6b35", "#4ade80", "#f59e0b", "#3b82f6", "#a78bfa", "#6b6b73"];
  const total = genres.reduce((acc, g) => acc + g.count, 0) || 1;
  const size = 160, cx = 80, cy = 80, r = 58, strokeW = 22;
  const circumference = 2 * Math.PI * r;
  let offsetAcc = 0;

  const segments = genres.map((g, idx) => {
    const pct = (g.count / total) * 100;
    const segLen = (pct / 100) * circumference;
    const color = colors[idx % colors.length];
    const seg = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="${strokeW}"
        stroke-dasharray="${segLen.toFixed(2)} ${(circumference - segLen).toFixed(2)}"
        stroke-dashoffset="${(-offsetAcc).toFixed(2)}" transform="rotate(-90 ${cx} ${cy})">
        <title>${g.genreName}: ${pct.toFixed(1)}%</title>
      </circle>`;
    offsetAcc += segLen;
    return { html: seg, color: color, pct: pct, label: g.genreName };
  });

  host.innerHTML = `
    <svg style="width:100%; max-width:${size}px;" viewBox="0 0 ${size} ${size}">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="${strokeW}"></circle>
      ${segments.map(s => s.html).join("")}
    </svg>`;

  legendHost.innerHTML = segments.map(s => `
    <div class="md-legend-row" style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:6px;">
      <span><i style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${s.color};margin-right:6px;"></i>${s.label}</span>
      <b>${s.pct.toFixed(1)}%</b>
    </div>`).join("");
}

function renderDynamicBarChart(monthlyData) {
  const host = document.getElementById("md-bar-chart");
  if (!host) return;
  if (monthlyData.length === 0) { host.innerHTML = "<p style='color:#666;padding:20px;'>Trống</p>"; return; }

  const maxVal = Math.max(...monthlyData.map(d => d.value || 0)) || 1;

  host.innerHTML = `
    <div class="md-bars" style="display:flex; justify-content:space-between; align-items:flex-end; height:160px; padding-top:10px;">
      ${monthlyData.map((d) => {
        const pct = Math.max(5, Math.round(((d.value || 0) / maxVal) * 100));
        return `
        <div class="md-bar-col" style="display:flex; flex-direction:column; align-items:center; flex:1;">
          <div class="md-bar-wrap" style="width:24px; height:130px; background:rgba(255,255,255,0.04); border-radius:4px; display:flex; align-items:flex-end; overflow:hidden;">
            <div class="md-bar-fill" style="height:${pct}%; width:100%; background:linear-gradient(to top, #42a5f5, #26a69a); border-radius:4px;" title="${d.label}: ${d.value} vé"></div>
          </div>
          <span style="font-size:10px; color:#888; margin-top:6px;">${d.label}</span>
        </div>`;
      }).join("")}
    </div>`;
}

function renderDynamicTopMovies(movies) {
  const host = document.getElementById("md-top-movies");
  if (!host) return;

  if (movies.length === 0) { host.innerHTML = "<div style='color:#666;padding:15px;'>Chưa phát sinh lượt mua vé tuần này</div>"; return; }

  host.innerHTML = movies.map((m, i) => `
    <div class="md-tm-row" style="display:flex; align-items:center; gap:12px; padding:10px 0; border-bottom:1px solid rgba(255,255,255,0.04);">
      <div style="font-weight:bold; color:#ff6b35; width:20px;">${i + 1}</div>
      <div style="flex:1;">
        <div style="font-weight:bold; color:#f4f4f5; font-size:13px;">${m.title}</div>
        <div style="font-size:11px; color:#888;">★ ${m.rating ? m.rating.toFixed(1) : "0.0"}</div>
      </div>
      <span style="font-size:12px; font-weight:bold; color:#4ade80;">${m.ticketsCount} vé</span>
    </div>`).join("");
}

function renderDynamicTransactions(orders) {
  const host = document.getElementById("md-transactions");
  if (!host) return;

  if (orders.length === 0) { host.innerHTML = "<div style='color:#666;padding:20px;text-align:center;'>Chưa có giao dịch nào</div>"; return; }

  host.innerHTML = `
    <table class="md-tx-table" style="width:100%; border-collapse:collapse; text-align:left; font-size:13px;">
      <thead>
        <tr style="color:#888; border-bottom:1px solid rgba(255,255,255,0.06);">
          <th style="padding:12px;">Mã đặt hóa đơn</th>
          <th>Khách hàng</th>
          <th>Thời gian mua</th>
          <th>Số tiền</th>
          <th>Trạng thái</th>
          <th>Phương thức</th>
        </tr>
      </thead>
      <tbody>
        ${orders.map((o) => {
          let isSuccess = o.orderStatus === "COMPLETELY" || o.orderStatus === "COMPLETED";

          let statusStyle = isSuccess ? "color:#4ade80; background:rgba(74,222,128,0.1);" : "color:#ef5350; background:rgba(239,83,80,0.1);";
          let statusText = isSuccess ? "Thành công" : "Hủy/Lỗi";
          return `
          <tr style="border-bottom:1px solid rgba(255,255,255,0.03); color:#d4d4d8;">
            <td style="padding:12px; font-weight:bold; color:#ff6b35;">${o.orderCode}</td>
            <td><strong>${o.customerName}</strong></td>
            <td>${o.createdTime}</td>
            <td style="font-weight:bold; color:#ffca28;">${o.finalAmount.toLocaleString("vi-VN")}đ</td>
            <td><span style="padding:2px 6px; border-radius:4px; font-size:11px; font-weight:bold; ${statusStyle}">${statusText}</span></td>
            <td><span style="color:#888;">${o.paymentMethod || "CASH"}</span></td>
          </tr>`;
        }).join("")}
      </tbody>
    </table>`;
}

// Tự động kích hoạt khi tải trang
window.addEventListener("DOMContentLoaded", () => {
  renderManagerDashboard();
});