/* =========================================================================
   📊 PHÂN HỆ BÁO CÁO & KIỂM TOÁN TÀI CHÍNH ĐỘNG — LAS CINEMAS
   File: js/manager-audit.js

   Ghi chú ghép bản (main + femoi):
   - Giao diện (icon outline SVG, cấu trúc thẻ, class CSS) lấy theo bản FE MỚI
     để đồng bộ style với phần Dashboard Tổng quan.
   - Nguồn dữ liệu lấy THẬT từ API.getAuditReportData(date) (API đã có sẵn
     trên backend, khớp AuditDashboardDTO.java) thay vì mock tĩnh.
   - ⚠️ HTML hiện chỉ có <select id="aud-range-select"> (chọn "week" /
     "prev_week"), KHÔNG có ô chọn ngày (#mp-audit-date-input) như bản cũ
     mong đợi. Hàm audResolveAnchorDate() bên dưới tạm quy ước:
       "week"      -> lấy hôm nay làm ngày neo
       "prev_week" -> lấy hôm nay trừ 7 ngày làm ngày neo
     Nếu backend cần định dạng khác (VD: nhận cả date range), cần chỉnh lại
     hàm này và endpoint /audit/report cho khớp.
   ========================================================================= */

/* --- 1. TIỆN ÍCH --- */

function audFormatVnd(n) {
  return (n || 0).toLocaleString("vi-VN") + "đ";
}

function audResolveAnchorDate(range) {
  const d = new Date();
  if (range === "prev_week") d.setDate(d.getDate() - 7);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/* --- 2. BỘ ICON OUTLINE (SVG) DÙNG CHO CÁC THẺ METRIC --- */

const AUD_ICONS = {
  ticketRevenue: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9a3 3 0 1 0 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 1 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 11v2"/><path d="M13 17v2"/></svg>`,
  occupancy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18"/><path d="M8 6V4.5A1.5 1.5 0 0 1 9.5 3h5A1.5 1.5 0 0 1 16 4.5V6"/></svg>`,
  fnbQty: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 9 7.3 20a1 1 0 0 0 1 1h7.4a1 1 0 0 0 1-1L17.5 9"/><path d="M5.5 9c0-2.5 2.9-4.5 6.5-4.5s6.5 2 6.5 4.5c0 0-1.5.7-6.5.7S5.5 9 5.5 9Z"/><path d="M10 12.5v5"/><path d="M14 12.5v5"/></svg>`,
  fnbRevenue: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6l-1.3 3"/><path d="M8.3 6.3C5.4 7.9 4 10.8 4 14.2 4 18.5 7.4 21 12 21s8-2.5 8-6.8c0-3.4-1.4-6.3-4.3-7.9"/><path d="M12 9.5v7"/><path d="M10.2 14.3c0 .9.8 1.5 1.8 1.5s1.8-.5 1.8-1.4-1-1.2-1.8-1.4c-.8-.2-1.8-.5-1.8-1.4 0-.8.8-1.4 1.8-1.4s1.7.5 1.8 1.3"/></svg>`
};

/* --- 3. RENDER: THẺ CHỈ SỐ TỔNG QUAN (dữ liệu thật) --- */

function renderAuditMetricsReal(data) {
  const host = document.getElementById("aud-metrics");
  if (!host) return;

  host.innerHTML = `
    <div class="md-metric-card">
      <div class="md-metric-top"><div class="md-metric-icon">${AUD_ICONS.ticketRevenue}</div><span class="md-badge md-badge-up">↗ Live</span></div>
      <div class="md-metric-label">Doanh thu vé xem phim</div>
      <div class="md-metric-value">${audFormatVnd(data.ticketRevenue)}</div>
    </div>
    <div class="md-metric-card">
      <div class="md-metric-top"><div class="md-metric-icon">${AUD_ICONS.occupancy}</div><span class="md-badge md-badge-up">↗ Live</span></div>
      <div class="md-metric-label">Tỷ lệ Lấp đầy ghế</div>
      <div class="md-metric-value">${(data.occupancyRate || 0).toFixed(1)}%</div>
    </div>
    <div class="md-metric-card">
      <div class="md-metric-top"><div class="md-metric-icon">${AUD_ICONS.fnbQty}</div><span class="md-badge md-badge-up">↗ Live</span></div>
      <div class="md-metric-label">Sản phẩm F&B đã bán</div>
      <div class="md-metric-value">${data.fnbQuantity || 0} món</div>
    </div>
    <div class="md-metric-card">
      <div class="md-metric-top"><div class="md-metric-icon">${AUD_ICONS.fnbRevenue}</div><span class="md-badge md-badge-up">↗ Live</span></div>
      <div class="md-metric-label">Doanh thu Quầy / F&B</div>
      <div class="md-metric-value">${audFormatVnd(data.fnbRevenue)}</div>
    </div>`;
}

/* --- 4. RENDER: BAR CHART TỶ LỆ ĐỐI SOÁT KHỚP THEO NGÀY (dữ liệu thật) --- */

function renderAuditBarChart(rows) {
  const host = document.getElementById("aud-bar-chart");
  if (!host) return;

  if (!rows || rows.length === 0) {
    host.innerHTML = "<p style='color:#666; padding:20px; text-align:center;'>Chưa có dữ liệu đồ thị đối soát</p>";
    return;
  }

  const chartData = rows.slice(0, 7).reverse();

  host.innerHTML = `
    <div class="md-bars">
      ${chartData.map((d) => {
        const isMatch = (d.deviation || 0) === 0;
        const pct = isMatch ? 100 : 75;
        const cls = isMatch ? "peak" : "warn";
        return `
        <div class="md-bar-col">
          <span class="aud-bar-value">${pct}%</span>
          <div class="md-bar-wrap">
            <div class="md-bar-fill ${cls}" style="height:${pct}%;" title="Ngày ${d.labelDate}"></div>
          </div>
          <span class="md-bar-x">${d.labelDate}</span>
        </div>`;
      }).join("")}
    </div>`;
}

/* --- 5. RENDER: DONUT PHÂN BỔ NGUỒN DOANH THU (dữ liệu thật) --- */

function renderAuditDonut(rows) {
  const host = document.getElementById("aud-donut-chart");
  const legendHost = document.getElementById("aud-donut-legend");
  if (!host || !legendHost) return;

  if (!rows || rows.length === 0) {
    host.innerHTML = legendHost.innerHTML = "<p style='color:#666; padding:10px;'>Trống dữ liệu phân bổ</p>";
    return;
  }

  const totalPos = rows.reduce((acc, r) => acc + (r.posAmount || 0), 0);
  const totalOnline = rows.reduce((acc, r) => acc + (r.onlineAmount || 0), 0);
  const grandTotal = totalPos + totalOnline || 1;

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
    <svg class="md-donut-svg" viewBox="0 0 ${size} ${size}">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="${strokeW}"></circle>
      ${segments}
    </svg>`;

  legendHost.innerHTML = sourceData.map((g) => `
    <div class="md-legend-row">
      <span class="md-legend-left"><i class="md-dot" style="background:${g.color};"></i>${g.label}</span>
      <b>${g.pct.toFixed(0)}%</b>
    </div>`
  ).join("");
}

/* --- 6. RENDER: NHẬN ĐỊNH & ĐỀ XUẤT (dữ liệu thật) --- */

function renderAuditInsights(rows) {
  const host = document.getElementById("aud-insights");
  if (!host) return;

  const hasError = (rows || []).some((r) => (r.deviation || 0) !== 0);

  host.innerHTML = `
    <div class="aud-insight-card aud-insight-${hasError ? "warn" : "peak"}">
      <b class="aud-insight-title">📊 Trạng thái kiểm toán hệ thống</b>
      <p class="aud-insight-text">
        ${hasError
          ? "Cảnh báo: Phát hiện sai lệch dòng tiền giữa hệ thống POS quầy và Cổng ngân hàng trực tuyến. Vui lòng rà soát lại lịch sử đối chiếu hóa đơn."
          : "Hệ thống an toàn. Toàn bộ dòng tiền số và tiền mặt đối chiếu trùng khớp 100% không phát sinh chênh lệch."}
      </p>
    </div>
    <div class="aud-insight-card aud-insight-growth">
      <b class="aud-insight-title">💡 Đề xuất từ hệ thống quản trị</b>
      <p class="aud-insight-text">
        Khuyến khích tích hợp sâu phương thức VNPay/MoMo để giảm thiểu thời gian đối soát thủ công tại quầy và nâng cao trải nghiệm đặt vé trực tuyến.
      </p>
    </div>`;
}

/* --- 7. RENDER: BẢNG CHI TIẾT ĐỐI SOÁT (dữ liệu thật) --- */

function renderAuditTable(rows) {
  const host = document.getElementById("aud-table");
  if (!host) return;

  if (!rows || rows.length === 0) {
    host.innerHTML = '<div style="text-align:center; color:#888; padding:30px;">Không phát sinh giao dịch đối soát trong khoảng thời gian này!</div>';
    return;
  }

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
        ${rows.map((r) => {
          const diff = r.deviation || 0;
          const isMatch = diff === 0;
          return `
        <tr>
          <td>${r.labelDate}</td>
          <td>${audFormatVnd(r.posAmount)}</td>
          <td>${audFormatVnd(r.onlineAmount)}</td>
          <td class="${isMatch ? "aud-diff-ok" : "aud-diff-bad"}">${isMatch ? "0đ" : audFormatVnd(diff)}</td>
          <td><span class="md-tx-status ${isMatch ? "ok" : "fail"}">${isMatch ? "Khớp" : "Lỗi Chênh lệch"}</span></td>
        </tr>`;
        }).join("")}
      </tbody>
    </table>`;
}

/* --- 8. KHỞI TẠO TOÀN BỘ TAB BÁO CÁO & KIỂM TOÁN (gọi API thật) --- */

function renderAuditReport(range) {
  const metricsHost = document.getElementById("aud-metrics");
  if (metricsHost) {
    metricsHost.innerHTML = '<div style="color:#888; padding:10px; font-size:13px;">Hệ thống đang đối soát dòng tiền tài chính...</div>';
  }

  const anchorDate = audResolveAnchorDate(range);

  API.getAuditReportData(anchorDate)
    .then((data) => {
      const rows = data.auditRows || [];
      try { renderAuditMetricsReal(data); } catch (e) { console.error("Lỗi render metrics kiểm toán:", e); }
      try { renderAuditBarChart(rows); } catch (e) { console.error("Lỗi render bar chart đối soát:", e); }
      try { renderAuditDonut(rows); } catch (e) { console.error("Lỗi render donut nguồn doanh thu:", e); }
      try { renderAuditInsights(rows); } catch (e) { console.error("Lỗi render nhận định & đề xuất:", e); }
      try { renderAuditTable(rows); } catch (e) { console.error("Lỗi render bảng đối soát:", e); }
    })
    .catch((err) => {
      console.error(err);
      if (metricsHost) {
        metricsHost.innerHTML = `<div style="color:red; padding:10px;">Lỗi đồng bộ dữ liệu kiểm toán: ${err.message}</div>`;
      }
    });
}
window.renderAuditReport = renderAuditReport;

// Giữ tương thích ngược: một số nơi (nút "Đối soát Ngay") có thể còn gọi tên hàm cũ
window.triggerReconciliation = function () {
  renderAuditReport(document.getElementById("aud-range-select")?.value);
};