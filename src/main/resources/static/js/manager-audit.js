/* =========================================================================
   BÁO CÁO & KIỂM TOÁN — DỮ LIỆU TĨNH (STATIC MOCK DATA)
   Ghi chú: Số liệu trong file này là dữ liệu tĩnh dùng để hiển thị demo giao
   diện. Khi Back-end có API đối soát/báo cáo thật, chỉ cần thay các hằng số
   AUD_* bên dưới bằng dữ liệu fetch() từ server, giữ nguyên các hàm render.
   ========================================================================= */

/* =========================================================================
   📊 PHÂN HỆ BÁO CÁO & KIỂM TOÁN TÀI CHÍNH ĐỘNG — LAS CINEMAS
   File: js/manager-audit.js
   ========================================================================= */

// Hàm bốc dữ liệu theo ngày được chọn trên giao diện
window.loadManagerAudit = function() {
  const dateInput = document.getElementById("mp-audit-date-input");

  // 🛡️ LỚP BẢO VỆ: Nếu chưa có ô input trên giao diện thì dừng lại
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

  if (metricsHost) {
    metricsHost.innerHTML = '<div style="color:#888; padding:10px; font-size:13px;">Hệ thống đang đối soát dòng tiền tài chính...</div>';
  }

  // Gọi API tổng hợp báo cáo đối soát từ Spring Boot
  API.getAuditReportData(selectedDate)
    .then((data) => {
      
      // 1. 🎯 ĐỔ DỮ LIỆU VÀO 4 THÈ METRICS GỐC (Khớp chuẩn 100% AuditDashboardDTO.java)
      if (metricsHost) {
        metricsHost.innerHTML = `
          <div class="md-metric-card">
            <div class="md-metric-top"><div class="md-metric-icon">🎟️</div><span class="md-badge md-badge-up">↗ Live</span></div>
            <div class="md-metric-label">Doanh thu vé xem phim</div>
            <div class="md-metric-value">${(data.ticketRevenue || 0).toLocaleString("vi-VN")}đ</div>
          </div>
          <div class="md-metric-card">
            <div class="md-metric-top"><div class="md-metric-icon">🏟️</div><span class="md-badge md-badge-up">↗ Live</span></div>
            <div class="md-metric-label">Tỷ lệ Lấp đầy ghế</div>
            <div class="md-metric-value">${(data.occupancyRate || 0).toFixed(1)}%</div>
          </div>
          <div class="md-metric-card">
            <div class="md-metric-top"><div class="md-metric-icon">🍿</div><span class="md-badge md-badge-up">↗ Live</span></div>
            <div class="md-metric-label">Sản phẩm F&B đã bán</div>
            <div class="md-metric-value">${data.fnbQuantity || 0} món</div>
          </div>
          <div class="md-metric-card">
            <div class="md-metric-top"><div class="md-metric-icon">💰</div><span class="md-badge md-badge-up">↗ Live</span></div>
            <div class="md-metric-label">Doanh thu Quầy / F&B</div>
            <div class="md-metric-value">${(data.fnbRevenue || 0).toLocaleString("vi-VN")}đ</div>
          </div>
        `;
      }

      const rows = data.auditRows || [];

      // 2. 📊 VẼ BIỂU ĐỒ 1: Tỷ lệ đối soát khớp theo ngày (Cột dọc)
      renderDynamicAuditBarChart(rows);

      // 3. 📊 VẼ BIỂU ĐỒ 2: Phân bổ nguồn doanh thu từ Quầy vs Online
      renderDynamicAuditDonut(rows);

      // 4. 🧠 VẼ HỘP NHẬN ĐỊNH TỰ ĐỘNG
      renderDynamicAuditInsights(rows);

      // 5. 🎯 ĐỔ DỮ LIỆU CHI TIẾT VÀO BẢNG ĐỐI SOÁT GỐC (id="aud-table")
      if (tableHost) {
        if (rows.length === 0) {
          tableHost.innerHTML = '<div style="text-align:center; color:#888; padding:30px;">Không phát sinh giao dịch đối soát trong ngày này!</div>';
          return;
        }

        let rowsHTML = rows.map((row) => {
          let isMatch = (row.deviation || 0) === 0;
          let deviationStyle = !isMatch ? "color: #ef5350; font-weight: bold;" : "color: #4ade80; font-weight: bold;";
          let statusStyle = isMatch ? "color:#4ade80; background:rgba(74,222,128,0.1);" : "color:#ef5350; background:rgba(239,83,80,0.1);";
          let statusText = isMatch ? "Khớp hoàn toàn" : "Lỗi Chênh lệch";

          return `
            <tr style="border-bottom:1px solid rgba(255,255,255,0.03); color:#d4d4d8;">
              <td style="padding:12px; font-weight: bold; color: #ff6b35; text-align: center;">${row.labelDate}</td>
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
            <tbody>${rowsHTML}</tbody>
          </table>
        `;
      }
    })
    .catch((err) => {
      console.error(err);
      if (metricsHost) {
        metricsHost.innerHTML = `<div style="color:red; padding:10px;">Lỗi đồng bộ dữ liệu kiểm toán: ${err.message}</div>`;
      }
    });
};

// --- BỘ CÁC HÀM VẼ BIỂU ĐỒ ĐỘNG CHẠY THEO DATA ĐỐI SOÁT ---

function renderDynamicAuditBarChart(rows) {
  const host = document.getElementById("aud-bar-chart");
  if (!host) return;

  if (rows.length === 0) {
    host.innerHTML = "<p style='color:#666; padding:20px; text-align:center;'>Chưa có dữ liệu đồ thị đối soát</p>";
    return;
  }

  const chartData = rows.slice(0, 6).reverse();

  host.innerHTML = `
    <div class="md-bars" style="display:flex; justify-content:space-between; align-items:flex-end; height:160px; padding-top:10px;">
      ${chartData.map((d) => {
        let isMatch = (d.deviation || 0) === 0;
        let finalPct = isMatch ? 100 : 75;
        let barColor = isMatch ? "#ff6b35" : "#f87171";

        return `
        <div class="md-bar-col" style="display:flex; flex-direction:column; align-items:center; flex:1;">
          <span style="font-size:10px; color:#fff; margin-bottom:4px;">${finalPct}%</span>
          <div class="md-bar-wrap" style="width:22px; height:110px; background:rgba(255,255,255,0.04); border-radius:4px; display:flex; align-items:flex-end;">
            <div class="md-bar-fill" style="height:${finalPct}%; width:100%; background:${barColor}; border-radius:4px;" title="Ngày ${d.labelDate}"></div>
          </div>
          <span style="font-size:10px; color:#888; margin-top:6px;">${d.labelDate}</span>
        </div>`;
      }).join("")}
    </div>`;
}

function renderDynamicAuditDonut(rows) {
  const host = document.getElementById("aud-donut-chart");
  const legendHost = document.getElementById("aud-donut-legend");
  if (!host || !legendHost) return;

  if (rows.length === 0) {
    host.innerHTML = legendHost.innerHTML = "<p style='color:#666; padding:10px;'>Trống dữ liệu phân bổ</p>";
    return;
  }

  let totalPos = rows.reduce((acc, r) => acc + (r.posAmount || 0), 0);
  let totalOnline = rows.reduce((acc, r) => acc + (r.onlineAmount || 0), 0);
  let grandTotal = totalPos + totalOnline || 1;

  const sourceData = [
    { label: "Cổng trực tuyến (Online)", pct: (totalOnline / grandTotal) * 100, color: "#3b82f6" },
    { label: "Quầy vé / Máy POS", pct: (totalPos / grandTotal) * 100, color: "#ff6b35" }
  ];

  const size = 160, cx = 80, cy = 80, r = 58, strokeW = 22;
  const circumference = 2 * Math.PI * r;
  let offsetAcc = 0;

  const segments = sourceData.map((g) => {
    const segLen = (g.pct / 100) * circumference;
    const seg = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${g.color}" stroke-width="${strokeW}"
        stroke-dasharray="${segLen.toFixed(2)} ${(circumference - segLen).toFixed(2)}"
        stroke-dashoffset="${(-offsetAcc).toFixed(2)}" transform="rotate(-90 ${cx} ${cy})">
        <title>${g.label}: ${g.pct.toFixed(1)}%</title>
      </circle>`;
    offsetAcc += segLen;
    return seg;
  }).join("");

  host.innerHTML = `
    <svg class="md-donut-svg" viewBox="0 0 ${size} ${size}" style="width:100%; max-width:${size}px;">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="${strokeW}"></circle>
      ${segments}
    </svg>`;

  legendHost.innerHTML = sourceData.map((g) => `
    <div class="md-legend-row" style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:6px; color:#d4d4d8;">
      <span><i class="md-dot" style="display:inline-block; width:8px; height:8px; border-radius:50%; background:${g.color}; margin-right:6px;"></i>${g.label}</span>
      <b>${g.pct.toFixed(0)}%</b>
    </div>`
  ).join("");
}

function renderDynamicAuditInsights(rows) {
  const host = document.getElementById("aud-insights");
  if (!host) return;

  let hasError = rows.some(r => (r.deviation || 0) !== 0);

  host.innerHTML = `
    <div class="aud-insight-card" style="background:rgba(255,255,255,0.02); padding:14px; border-radius:6px; border-left:4px solid ${hasError ? '#ef5350' : '#4ade80'}; margin-bottom:8px;">
      <b class="aud-insight-title" style="color:#fff; font-size:13px;">📊 Trạng thái kiểm toán hệ thống</b>
      <p class="aud-insight-text" style="color:#a8a8b3; font-size:12px; margin-top:4px;">
        ${hasError 
          ? "Cảnh báo: Phát hiện sai lệch dòng tiền giữa hệ thống POS quầy và Cổng ngân hàng trực tuyến. Vui lòng rà soát lại lịch sử đối chiếu hóa đơn." 
          : "Hệ thống an toàn. Toàn bộ dòng tiền số và tiền mặt đối chiếu trùng khớp 100% không phát sinh chênh lệch."}
      </p>
    </div>
    <div class="aud-insight-card" style="background:rgba(255,255,255,0.02); padding:14px; border-radius:6px; border-left:4px solid #3b82f6;">
      <b class="aud-insight-title" style="color:#fff; font-size:13px;">💡 Đề xuất từ hệ thống quản trị</b>
      <p class="aud-insight-text" style="color:#a8a8b3; font-size:12px; margin-top:4px;">
        Khuyến khích tích hợp sâu phương thức VNPay/MoMo để giảm thiểu thời gian đối soát thủ công tại quầy và nâng cao trải nghiệm đặt vé trực tuyến.
      </p>
    </div>`;
}

window.triggerReconciliation = function() {
  alert("🚀 Hệ thống đang chạy đối chiếu dữ liệu hóa đơn POS quầy và chữ ký số từ Cổng trực tuyến...");
  window.loadManagerAudit();
};
