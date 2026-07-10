/* =========================================================================
   MANAGER DASHBOARD — DỮ LIỆU TĨNH (STATIC MOCK DATA)
   Ghi chú: Toàn bộ số liệu trong file này là dữ liệu tĩnh dùng để hiển thị
   demo giao diện Dashboard. Khi Back-end có sẵn API thống kê, chỉ cần thay
   các hằng số MD_* bên dưới bằng dữ liệu fetch() từ server.
   ========================================================================= */

/* --- 1. BỘ DỮ LIỆU TĨNH --- */

const MD_METRICS = [
  {
    icon: "💰",
    label: "Doanh thu (Tháng này)",
    value: "92.000.000đ",
    delta: "+18.2%",
    up: true,
  },
  {
    icon: "🎟️",
    label: "Vé đã bán (Tháng này)",
    value: "1.150",
    delta: "+16.7%",
    up: true,
  },
  {
    icon: "👥",
    label: "Người dùng hoạt động",
    value: "3.284",
    delta: "+8.4%",
    up: true,
  },
  {
    icon: "🎬",
    label: "Phim đang chiếu",
    value: "5",
    delta: "+2 phim mới",
    up: true,
  },
];

// Doanh thu (VNĐ) & vé bán theo từng mốc thời gian
const MD_TREND_6M = [
  { label: "T1", revenue: 58000000, tickets: 620 },
  { label: "T2", revenue: 61500000, tickets: 655 },
  { label: "T3", revenue: 59000000, tickets: 640 },
  { label: "T4", revenue: 68000000, tickets: 710 },
  { label: "T5", revenue: 79500000, tickets: 890 },
  { label: "T6", revenue: 92000000, tickets: 1150 },
];
const MD_TREND_3M = MD_TREND_6M.slice(3); // T4 - T6
const MD_TREND_1M = [
  { label: "Tuần 1", revenue: 19500000, tickets: 240 },
  { label: "Tuần 2", revenue: 21000000, tickets: 262 },
  { label: "Tuần 3", revenue: 24500000, tickets: 305 },
  { label: "Tuần 4", revenue: 27000000, tickets: 343 },
];
const MD_TREND_MAP = {
  "6M": MD_TREND_6M,
  "3M": MD_TREND_3M,
  "1M": MD_TREND_1M,
};

// Vé bán theo tháng (dùng lại cùng dữ liệu vé của biểu đồ xu hướng cho đồng bộ)
const MD_BAR_MONTHLY = MD_TREND_6M.map((d) => ({
  label: d.label,
  value: d.tickets,
}));

// Phân bố thể loại phim
const MD_GENRES = [
  { label: "Hành động", pct: 38, color: "#ff6b35" },
  { label: "Kinh dị", pct: 22, color: "#4ade80" },
  { label: "Chính kịch", pct: 16, color: "#f59e0b" },
  { label: "Hoạt hình", pct: 12, color: "#3b82f6" },
  { label: "Tình cảm", pct: 8, color: "#a78bfa" },
  { label: "Khác", pct: 4, color: "#6b6b73" },
];

// Top phim trong tuần (tái sử dụng poster + tên phim đã có sẵn trong dự án)
const MD_TOP_MOVIES = [
  {
    title: "Tên cậu là gì",
    poster: "img/yournamemain.jpg",
    rating: 9.1,
    genre: "Hoạt hình",
    sold: 239,
  },
  {
    title: "Lầu Chú Hỏa",
    poster: "img/lauchuhoaposter.jpg",
    rating: 8.4,
    genre: "Kinh dị",
    sold: 213,
  },
  {
    title: "Ma Xó",
    poster: "img/maxoposter.png",
    rating: 7.9,
    genre: "Kinh dị",
    sold: 187,
  },
  {
    title: "Lớp Học Ẩm",
    poster: "img/lopmain.jpg",
    rating: 7.6,
    genre: "Hài hước",
    sold: 110,
  },
];

// Giao dịch gần đây
const MD_TRANSACTIONS = [
  {
    id: "BK-2026-00155",
    movie: "Lầu Chú Hỏa",
    room: "Phòng 3",
    time: "09/06/2026 19:30",
    amount: "350.000đ",
    status: "ok",
    method: "Thẻ tín dụng",
  },
  {
    id: "BK-2026-00154",
    movie: "Tên cậu là gì",
    room: "Phòng 1",
    time: "09/06/2026 21:00",
    amount: "120.000đ",
    status: "pending",
    method: "VNPay",
  },
  {
    id: "BK-2026-00153",
    movie: "Ma Xó",
    room: "Phòng 2",
    time: "08/06/2026 16:00",
    amount: "390.000đ",
    status: "ok",
    method: "MoMo",
  },
  {
    id: "BK-2026-00152",
    movie: "Lớp Học Ẩm",
    room: "Phòng 4",
    time: "08/06/2026 14:00",
    amount: "260.000đ",
    status: "fail",
    method: "Thẻ tín dụng",
  },
  {
    id: "BK-2026-00151",
    movie: "Lầu Chú Hỏa",
    room: "Phòng 3",
    time: "07/06/2026 13:30",
    amount: "520.000đ",
    status: "ok",
    method: "Thẻ tín dụng",
  },
];

const MD_STATUS_TEXT = {
  ok: "Thành công",
  pending: "Đang xử lý",
  fail: "Thất bại",
};

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
    </div>`,
  ).join("");
}

/* --- 4. RENDER: BIỂU ĐỒ XU HƯỚNG DOANH THU & VÉ (SVG LINE CHART) --- */

function renderMdTrendChart(range) {
  const host = document.getElementById("md-trend-chart");
  if (!host) return;
  const data = MD_TREND_MAP[range] || MD_TREND_6M;

  const W = 640,
    H = 230,
    padL = 10,
    padR = 10,
    padT = 15,
    padB = 26;
  const innerW = W - padL - padR,
    innerH = H - padT - padB;
  const maxRevenue = Math.max(...data.map((d) => d.revenue)) * 1.15;
  const maxTickets = Math.max(...data.map((d) => d.tickets)) * 1.15;
  const stepX = data.length > 1 ? innerW / (data.length - 1) : 0;

  const xAt = (i) => padL + stepX * i;
  const yAtRevenue = (v) => padT + innerH - (v / maxRevenue) * innerH;
  const yAtTickets = (v) => padT + innerH - (v / maxTickets) * innerH;

  const revenuePts = data.map((d, i) => [xAt(i), yAtRevenue(d.revenue)]);
  const ticketPts = data.map((d, i) => [xAt(i), yAtTickets(d.tickets)]);

  const toPath = (pts) =>
    pts
      .map(
        (p, i) =>
          (i === 0 ? "M" : "L") + p[0].toFixed(1) + "," + p[1].toFixed(1),
      )
      .join(" ");
  const revenueLine = toPath(revenuePts);
  const revenueArea =
    revenueLine +
    ` L${xAt(data.length - 1).toFixed(1)},${padT + innerH} L${padL},${padT + innerH} Z`;
  const ticketLine = toPath(ticketPts);

  // Đường lưới ngang (4 mốc)
  let gridLines = "";
  for (let i = 0; i <= 3; i++) {
    const y = padT + (innerH / 3) * i;
    gridLines += `<line x1="${padL}" y1="${y.toFixed(1)}" x2="${W - padR}" y2="${y.toFixed(1)}" class="md-grid"></line>`;
  }

  const axisLabels = data
    .map(
      (d, i) =>
        `<text x="${xAt(i).toFixed(1)}" y="${H - 6}" text-anchor="middle" class="md-axis">${d.label}</text>`,
    )
    .join("");

  const revenueDots = revenuePts
    .map(
      (p, i) =>
        `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="4" fill="#ff6b35" class="md-hit"><title>${data[i].label}: ${mdFormatVnd(data[i].revenue)}</title></circle>`,
    )
    .join("");
  const ticketDots = ticketPts
    .map(
      (p, i) =>
        `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3.5" fill="#4ade80" class="md-hit"><title>${data[i].label}: ${mdFormatNum(data[i].tickets)} vé</title></circle>`,
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
  document
    .querySelectorAll(".md-seg-btn")
    .forEach((b) => b.classList.remove("active"));
  if (btnEl) btnEl.classList.add("active");
  renderMdTrendChart(range);
}
window.mdSwitchTrend = mdSwitchTrend;

/* --- 5. RENDER: DONUT PHÂN BỐ THỂ LOẠI --- */

function renderMdGenreDonut() {
  const host = document.getElementById("md-genre-chart");
  const legendHost = document.getElementById("md-genre-legend");
  if (!host || !legendHost) return;

  const size = 160,
    cx = 80,
    cy = 80,
    r = 58,
    strokeW = 22;
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
    </div>`,
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
    </div>`,
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
        </tr>`,
        ).join("")}
      </tbody>
    </table>`;
}

/* --- 9. KHỞI TẠO TOÀN BỘ DASHBOARD --- */

function renderManagerDashboard() {
  try {
    renderMdMetrics();
  } catch (e) {
    console.error("Lỗi render metrics:", e);
  }
  try {
    renderMdTrendChart("6M");
  } catch (e) {
    console.error("Lỗi render trend chart:", e);
  }
  try {
    renderMdGenreDonut();
  } catch (e) {
    console.error("Lỗi render genre donut:", e);
  }
  try {
    renderMdBarChart();
  } catch (e) {
    console.error("Lỗi render bar chart:", e);
  }
  try {
    renderMdTopMovies();
  } catch (e) {
    console.error("Lỗi render top movies:", e);
  }
  try {
    renderMdTransactions();
  } catch (e) {
    console.error("Lỗi render transactions:", e);
  }
}
window.renderManagerDashboard = renderManagerDashboard;

// Dashboard là tab mặc định khi tải trang -> render ngay khi DOM sẵn sàng
window.addEventListener("DOMContentLoaded", () => {
  renderManagerDashboard();
});
