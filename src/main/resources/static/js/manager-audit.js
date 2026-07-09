/* =========================================================================
   BÁO CÁO & KIỂM TOÁN — DỮ LIỆU TĨNH (STATIC MOCK DATA)
   Ghi chú: Số liệu trong file này là dữ liệu tĩnh dùng để hiển thị demo giao
   diện. Khi Back-end có API đối soát/báo cáo thật, chỉ cần thay các hằng số
   AUD_* bên dưới bằng dữ liệu fetch() từ server, giữ nguyên các hàm render.
   ========================================================================= */



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

/* =========================================================================
   🚀 ENGINE ĐỔ DỮ LIỆU ĐỘNG TỪ SPRING BOOT LÊN CẤU TRÚC GỐC HTML CỦA EM
   ========================================================================= */

// Hàm bốc dữ liệu theo ngày được chọn trên giao diện
window.loadManagerAudit = function() {
  const dateInput = document.getElementById("mp-audit-date-input");

  // 🛡️ LỚP BẢO VỆ: Nếu chưa có ô input trên giao diện thì dừng lại, không báo lỗi đỏ lòm
  if (!dateInput) return;
  
  // Tự động mồi ngày hôm nay nếu Manager mới vào tab chưa chọn ngày cụ thể
  if (dateInput && !dateInput.value) {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    dateInput.value = `${y}-${m}-${d}`;
  }

  const selectedDate = dateInput.value;
  
  const metricsHost = document.getElementById("aud-metrics");
  const tableHost = document.getElementById("aud-table");

  if (metricsHost) metricsHost.innerHTML = '<div style="color:#888; padding:10px;">Hệ thống đang đối soát dòng tiền...</div>';

  // Gọi API tổng hợp báo cáo đối soát từ Spring Boot
  API.getAuditReportData(selectedDate)
    .then((data) => {
      // 1. 🎯 ĐỔ DỮ LIỆU VÀO 4 THẺ METRICS GỐC (id="aud-metrics")
      if (metricsHost) {
        metricsHost.innerHTML = `
          <div class="md-metric-card">
            <div class="md-metric-top"><div class="md-metric-icon">🎟️</div><span class="md-badge md-badge-up">Live</span></div>
            <div class="md-metric-label">Doanh thu vé xem phim</div>
            <div class="md-metric-value">${(data.ticketRevenue || 0).toLocaleString("vi-VN")}đ</div>
          </div>
          <div class="md-metric-card">
            <div class="md-metric-top"><div class="md-metric-icon">🏟️</div><span class="md-badge md-badge-up">Live</span></div>
            <div class="md-metric-label">Tỷ lệ Lấp đầy ghế</div>
            <div class="md-metric-value">${data.occupancyRate || 0}%</div>
          </div>
          <div class="md-metric-card">
            <div class="md-metric-top"><div class="md-metric-icon">🍿</div><span class="md-badge md-badge-up">Live</span></div>
            <div class="md-metric-label">Sản phẩm F&B đã bán</div>
            <div class="md-metric-value">${data.fnbQuantity || 0} món</div>
          </div>
          <div class="md-metric-card">
            <div class="md-metric-top"><div class="md-metric-icon">💰</div><span class="md-badge md-badge-up">Live</span></div>
            <div class="md-metric-label">Doanh thu Quầy / F&B</div>
            <div class="md-metric-value">${(data.fnbRevenue || 0).toLocaleString("vi-VN")}đ</div>
          </div>
        `;
      }

      // 2. 🎯 ĐỔ DỮ LIỆU CHI TIẾT VÀO BẢNG ĐỐI SOÁT GỐC (id="aud-table")
      if (tableHost) {
        const rows = data.auditRows || [];

        if (rows.length === 0) {
          tableHost.innerHTML = '<div style="text-align:center; color:#888; padding:20px;">Không phát sinh giao dịch đối soát trong ngày này!</div>';
          return;
        }

        let rowsHTML = rows.map((row) => {
          let isMatch = row.deviation === 0;
          let deviationStyle = !isMatch ? "color: #ef5350; font-weight: bold;" : "color: #4ade80; font-weight: bold;";
          let statusStyle = isMatch ? "color:#4ade80; background:rgba(74,222,128,0.1);" : "color:#ef5350; background:rgba(239,83,80,0.1);";
          let statusText = isMatch ? "Khớp hoàn toàn" : "Lỗi Chênh lệch";

          return `
            <tr style="border-bottom:1px solid rgba(255,255,255,0.03); color:#d4d4d8;">
              <td style="padding:12px; font-weight: bold; color: #ff6b35; text-align: center;">${new Date(row.labelDate).toLocaleDateString("vi-VN")}</td>
              <td style="font-weight: bold;">${(row.posAmount || 0).toLocaleString("vi-VN")} đ</td>
              <td style="font-weight: bold;">${(row.onlineAmount || 0).toLocaleString("vi-VN")} đ</td>
              <td style="text-align: right; ${deviationStyle}">${(row.deviation || 0).toLocaleString("vi-VN")} đ</td>
              <td style="text-align: center;">
                <span style="padding:4px 8px; border-radius:4px; font-size:11px; font-weight:bold; ${statusStyle}">
                  ${statusText}
                </span>
              </td>
            </tr>
          `;
        }).join("");

        tableHost.innerHTML = `
          <table class="md-tx-table" style="width:100%; border-collapse:collapse; text-align:left; font-size:13px;">
            <thead>
              <tr style="color:#888; border-bottom:1px solid rgba(255,255,255,0.06);">
                <th style="padding:12px; text-align: center;">Ngày đối soát</th>
                <th>Doanh thu POS / Quầy</th>
                <th>Doanh thu Cổng TTTT</th>
                <th style="text-align: right;">Chênh lệch</th>
                <th style="text-align: center;">Trạng thái hệ thống</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHTML}
            </tbody>
          </table>
        `;
      }

      console.log("📊 Đối soát hoàn tất cho ngày: " + selectedDate);
    })
    .catch((err) => {
      console.error(err);
      if (metricsHost) metricsHost.innerHTML = `<div style="color:red; padding:10px;">Lỗi đồng bộ dữ liệu kiểm toán: ${err.message}</div>`;
    });
};

// Hàm kích hoạt tính năng khi nhấn nút Đối soát ngay
window.triggerReconciliation = function() {
  alert("🚀 Hệ thống đang chạy đối chiếu dữ liệu hóa đơn POS quầy và chữ ký số từ Cổng trực tuyến...");
  window.loadManagerAudit();
};
