/* =========================================================================
   BÁO CÁO & KIỂM TOÁN — DỮ LIỆU TĨNH (STATIC MOCK DATA)
   Ghi chú: Số liệu trong file này là dữ liệu tĩnh dùng để hiển thị demo giao
   diện. Khi Back-end có API đối soát/báo cáo thật, chỉ cần thay các hằng số
   AUD_* bên dưới bằng dữ liệu fetch() từ server, giữ nguyên các hàm render.
   ========================================================================= */

/* --- 1. BỘ DỮ LIỆU TĨNH --- */

const AUD_METRICS = [
  {
    icon: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="20" height="20" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3C12 3 7.5 7.5 7.5 12C7.5 15.6 9.9 18 13 18C15.5 18 17.5 16 17.5 13.3C17.5 10.5 15.3 9 14.5 7C14.3 8.3 13.5 9.2 12.6 9.6C12.8 8 12.5 5.3 12 3Z"/></svg>`,
    label: "Doanh thu hôm nay",
    value: "125.000.000đ",
    delta: "+12.4%",
    type: "up",
  },
  {
    icon: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="20" height="20" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10H21"/><path d="M8 6V4.5C8 3.7 8.7 3 9.5 3H14.5C15.3 3 16 3.7 16 4.5V6"/></svg>`,
    label: "Tỷ lệ lấp đầy phòng chiếu",
    value: "78%",
    delta: "+8.1%",
    type: "up",
  },
  {
    icon: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="20" height="20" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 9L7.3 20C7.35 20.6 7.85 21 8.4 21H15.6C16.15 21 16.65 20.6 16.7 20L17.5 9"/><path d="M5.5 9C5.5 6.5 8.4 4.5 12 4.5C15.6 4.5 18.5 6.5 18.5 9C18.5 9 17 9.7 12 9.7C7 9.7 5.5 9 5.5 9Z"/><path d="M10 12.5V17.5"/><path d="M14 12.5V17.5"/></svg>`,
    label: "Hiệu suất F&B (Đơn bán)",
    value: "150 đơn",
    delta: "+9.8%",
    type: "up",
  },
  {
    icon: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="20" height="20" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4L21.5 20H2.5L12 4Z" stroke-linejoin="round"/><path d="M12 10V14.5"/><circle cx="12" cy="17.3" r="0.9" fill="#fff" stroke="none"/></svg>`,
    label: "Đối soát lệch tuần này",
    value: "2 ngày",
    delta: "Cần kiểm tra",
    type: "warn",
  },
];

// Tỷ lệ đối soát khớp theo ngày (7 ngày gần nhất)
const AUD_MATCH_RATE = [
  { label: "T2", pct: 96 },
  { label: "T3", pct: 94 },
  { label: "T4", pct: 89 },
  { label: "T5", pct: 97 },
  { label: "T6", pct: 100 },
  { label: "T7", pct: 82 },
  { label: "CN", pct: 91 },
];

// Phân bổ nguồn doanh thu theo kênh thanh toán
const AUD_REVENUE_SOURCE = [
  { label: "POS tại quầy", pct: 45, color: "#ff6b35" },
  { label: "Cổng thanh toán", pct: 33, color: "#3b82f6" },
  { label: "Ứng dụng di động", pct: 15, color: "#4ade80" },
  { label: "Đối tác bán vé", pct: 7, color: "#a78bfa" },
];

// Nhận định & đề xuất
const AUD_INSIGHTS = [
  {
    type: "peak",
    title: "Hiệu Suất Đỉnh Điểm",
    content:
      "Tỷ lệ đối soát khớp cao nhất vào Thứ 6 (100%), thấp nhất vào Thứ 7 (82%) do lượng giao dịch cuối tuần tăng đột biến. Nên tăng cường nhân sự đối soát vào cuối tuần.",
  },
  {
    type: "growth",
    title: "Tăng Trưởng Doanh Thu",
    content:
      "Doanh thu trung bình mỗi ngày tăng 12.4% so với tuần trước, chủ yếu đến từ combo bắp nước và các suất chiếu tối. Cân nhắc mở rộng danh mục combo cao cấp.",
  },
  {
    type: "warn",
    title: "Cảnh Báo Chênh Lệch",
    content:
      "Phát hiện 2/7 ngày có chênh lệch giữa doanh thu POS và Cổng thanh toán vượt ngưỡng cho phép (&gt;0.5%). Cần đối soát thủ công trước khi chốt sổ.",
  },
];

// Chi tiết đối soát doanh thu (POS vs Cổng thanh toán trực tuyến)
const AUD_REVENUE_TABLE = [
  { date: "03/06/2026", pos: 118500000, gateway: 118500000 },
  { date: "04/06/2026", pos: 121200000, gateway: 121200000 },
  { date: "05/06/2026", pos: 109800000, gateway: 108950000 },
  { date: "06/06/2026", pos: 125000000, gateway: 124450000 },
  { date: "07/06/2026", pos: 132400000, gateway: 132400000 },
  { date: "08/06/2026", pos: 145900000, gateway: 145900000 },
  { date: "09/06/2026", pos: 125000000, gateway: 125000000 },
];

/* --- 2. HÀM TIỆN ÍCH --- */

function audFormatVnd(n) {
  return n.toLocaleString("vi-VN") + "đ";
}

/* --- 3. RENDER: THẺ CHỈ SỐ TỔNG QUAN --- */

function renderAuditMetrics() {
  const host = document.getElementById("aud-metrics");
  if (!host) return;
  host.innerHTML = AUD_METRICS.map((m) => {
    let badge = "";
    if (m.type === "up") badge = `<span class="md-badge md-badge-up">↗ ${m.delta}</span>`;
    else if (m.type === "down") badge = `<span class="md-badge md-badge-down">↘ ${m.delta}</span>`;
    else badge = `<span class="md-badge md-badge-warn">⚠ ${m.delta}</span>`;
    return `
    <div class="md-metric-card${m.type === "warn" ? " aud-metric-warn" : ""}">
      <div class="md-metric-top">
        <div class="md-metric-icon">${m.icon}</div>
        ${badge}
      </div>
      <div class="md-metric-label">${m.label}</div>
      <div class="md-metric-value">${m.value}</div>
    </div>`;
  }).join("");
}

/* --- 4. RENDER: BAR CHART TỶ LỆ ĐỐI SOÁT KHỚP THEO NGÀY --- */

function renderAuditBarChart() {
  const host = document.getElementById("aud-bar-chart");
  if (!host) return;
  const peakVal = Math.max(...AUD_MATCH_RATE.map((d) => d.pct));

  host.innerHTML = `
    <div class="md-bars">
      ${AUD_MATCH_RATE.map((d) => {
        const isPeak = d.pct === peakVal;
        const isWarn = d.pct < 90;
        const cls = isPeak ? "peak" : isWarn ? "warn" : "";
        return `
        <div class="md-bar-col">
          <span class="aud-bar-value">${d.pct}%</span>
          <div class="md-bar-wrap">
            <div class="md-bar-fill ${cls}" style="height:${d.pct}%;" title="${d.label}: ${d.pct}%"></div>
          </div>
          <span class="md-bar-x">${d.label}</span>
        </div>`;
      }).join("")}
    </div>`;
}

/* --- 5. RENDER: DONUT PHÂN BỔ NGUỒN DOANH THU --- */

function renderAuditDonut() {
  const host = document.getElementById("aud-donut-chart");
  const legendHost = document.getElementById("aud-donut-legend");
  if (!host || !legendHost) return;

  const size = 160, cx = 80, cy = 80, r = 58, strokeW = 22;
  const circumference = 2 * Math.PI * r;
  let offsetAcc = 0;

  const segments = AUD_REVENUE_SOURCE.map((g) => {
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

  legendHost.innerHTML = AUD_REVENUE_SOURCE.map(
    (g) => `
    <div class="md-legend-row">
      <span class="md-legend-left"><i class="md-dot" style="background:${g.color};"></i>${g.label}</span>
      <b>${g.pct}%</b>
    </div>`
  ).join("");
}

/* --- 6. RENDER: NHẬN ĐỊNH & ĐỀ XUẤT --- */

function renderAuditInsights() {
  const host = document.getElementById("aud-insights");
  if (!host) return;
  host.innerHTML = AUD_INSIGHTS.map(
    (i) => `
    <div class="aud-insight-card aud-insight-${i.type}">
      <b class="aud-insight-title">${i.title}</b>
      <p class="aud-insight-text">${i.content}</p>
    </div>`
  ).join("");
}

/* --- 7. RENDER: BẢNG CHI TIẾT ĐỐI SOÁT DOANH THU --- */

function renderAuditTable() {
  const host = document.getElementById("aud-table");
  if (!host) return;
  host.innerHTML = `
    <table class="md-tx-table">
      <thead>
        <tr>
          <th>Ngày</th>
          <th>Doanh thu POS</th>
          <th>Doanh thu Cổng TTTT</th>
          <th>Chênh lệch</th>
          <th>Trạng thái</th>
        </tr>
      </thead>
      <tbody>
        ${AUD_REVENUE_TABLE.map((r) => {
          const diff = r.gateway - r.pos;
          const isMatch = diff === 0;
          return `
        <tr>
          <td>${r.date}</td>
          <td>${audFormatVnd(r.pos)}</td>
          <td>${audFormatVnd(r.gateway)}</td>
          <td class="${isMatch ? "aud-diff-ok" : "aud-diff-bad"}">${isMatch ? "0đ" : audFormatVnd(diff)}</td>
          <td><span class="md-tx-status ${isMatch ? "ok" : "fail"}">${isMatch ? "Khớp" : "Lỗi Chênh lệch"}</span></td>
        </tr>`;
        }).join("")}
      </tbody>
    </table>`;
}

/* --- 8. KHỞI TẠO TOÀN BỘ TAB BÁO CÁO & KIỂM TOÁN --- */

function renderAuditReport() {
  try { renderAuditMetrics(); } catch (e) { console.error("Lỗi render metrics kiểm toán:", e); }
  try { renderAuditBarChart(); } catch (e) { console.error("Lỗi render bar chart đối soát:", e); }
  try { renderAuditDonut(); } catch (e) { console.error("Lỗi render donut nguồn doanh thu:", e); }
  try { renderAuditInsights(); } catch (e) { console.error("Lỗi render nhận định & đề xuất:", e); }
  try { renderAuditTable(); } catch (e) { console.error("Lỗi render bảng đối soát:", e); }
}
window.renderAuditReport = renderAuditReport;