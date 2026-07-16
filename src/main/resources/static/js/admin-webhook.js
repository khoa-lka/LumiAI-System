/* =========================================================================
   WEBHOOK LOGS (ADMIN) — DỮ LIỆU TĨNH (STATIC MOCK DATA)
   Ghi chú: Toàn bộ số liệu & danh sách webhook trong file này là dữ liệu tĩnh,
   dùng để hoàn thiện giao diện theo mẫu tham khảo (LumiAI - Webhook Logs).
   Khi Back-end có API webhook thật, chỉ cần thay ADM_WEBHOOK_DATA /
   ADM_WEBHOOK_METRICS bằng dữ liệu fetch() từ server, giữ nguyên các hàm
   render/filter/export bên dưới.
   ========================================================================= */

const ADM_WEBHOOK_METRICS = [
  // BỔ SUNG: đồng bộ nền tối đồng nhất + icon outline trắng cho cả 4 thẻ.
  {
    icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4 7 20M17 4l-2 16M4 9h16M3 15h16"/></svg>',
    bg: "var(--adm-surface-2)",
    fg: "#ffffff",
    label: "Tổng webhook",
    value: "0",
    pct: ""
  },
  {
    icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m8.3 12 2.5 2.5 4.7-5"/></svg>',
    bg: "var(--adm-surface-2)",
    fg: "#ffffff",
    label: "Thành công",
    value: "0",
    pct: "0%"
  },
  {
    icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M6 6l12 12"/></svg>',
    bg: "var(--adm-surface-2)",
    fg: "#ffffff",
    label: "Thất bại",
    value: "0",
    pct: "0%"
  },
  {
    icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 13.5 14.5 8.5"/><path d="M11 6.5l1.2-1.2a3.5 3.5 0 0 1 5 5L16 11.5"/><path d="M13 17.5l-1.2 1.2a3.5 3.5 0 0 1-5-5L8 12.5"/></svg>',
    bg: "var(--adm-surface-2)",
    fg: "#ffffff",
    label: "Endpoint đang hoạt động",
    value: "0",
    pct: ""
  }
];
/* --- 1. 4 THẺ CHỈ SỐ TỔNG QUAN --- */
const ADM_WEBHOOK_DATA = [];
// Danh sách endpoint & mã HTTP (dùng để đổ vào dropdown lọc)
const ADM_WEBHOOK_ENDPOINTS = [...new Set(ADM_WEBHOOK_DATA.map((w) => w.endpoint))].sort();
const ADM_WEBHOOK_CODES = [...new Set(ADM_WEBHOOK_DATA.map((w) => w.code))].sort((a, b) => a - b);

// Trạng thái phân trang hiện tại
let admWebhookCurrentPage = 1;
let admWebhookPageSize = 10;


function formatAdminWebhookTime(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  const pad = (number) => String(number).padStart(2, "0");

  return (
    `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}

function normalizeAdminWebhook(item) {
  const code = Number(item.code) || 0;

  let status = String(item.status || "").toLowerCase();

  if (!["success", "failed"].includes(status)) {
    status = code >= 200 && code < 300
      ? "success"
      : "failed";
  }

  return {
    time: formatAdminWebhookTime(item.time),
    endpoint: item.endpoint || "Không xác định",
    code: code,
    status: status,
    responseMs: Number(item.responseMs) || 0,
    sizeKb: Number(item.sizeKb) || 0,
    payload: item.payload || "{}",
    rawTime: item.time ? new Date(item.time) : null,
  };
}

function updateAdminWebhookMetrics(webhooks) {
  const total = webhooks.length;

  const successCount = webhooks.filter(
    (item) => item.status === "success"
  ).length;

  const failedCount = webhooks.filter(
    (item) => item.status === "failed"
  ).length;

  const activeEndpoints = new Set(
    webhooks
      .filter((item) => item.status === "success")
      .map((item) => item.endpoint)
  ).size;

  const successPercent =
    total === 0 ? 0 : (successCount / total) * 100;

  const failedPercent =
    total === 0 ? 0 : (failedCount / total) * 100;

  ADM_WEBHOOK_METRICS[0].value =
    total.toLocaleString("vi-VN");

  ADM_WEBHOOK_METRICS[0].pct = "";

  ADM_WEBHOOK_METRICS[1].value =
    successCount.toLocaleString("vi-VN");

  ADM_WEBHOOK_METRICS[1].pct =
    `${successPercent.toFixed(1)}%`;

  ADM_WEBHOOK_METRICS[2].value =
    failedCount.toLocaleString("vi-VN");

  ADM_WEBHOOK_METRICS[2].pct =
    `${failedPercent.toFixed(1)}%`;

  ADM_WEBHOOK_METRICS[3].value =
    activeEndpoints.toLocaleString("vi-VN");

  ADM_WEBHOOK_METRICS[3].pct = "";
}

async function loadAdminWebhooks() {
  const tbody = document.getElementById("admin-webhook-tbody");

  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7"
            style="text-align:center; padding:24px; color:var(--adm-muted);">
          Đang tải Webhook Logs...
        </td>
      </tr>
    `;
  }

  try {
    const response = await API.getWebhooks();

    const allWebhooks = (
      Array.isArray(response) ? response : []
    )
      .map(normalizeAdminWebhook)
      .sort((a, b) => {
        const timeA = a.rawTime
          ? a.rawTime.getTime()
          : 0;

        const timeB = b.rawTime
          ? b.rawTime.getTime()
          : 0;

        return timeB - timeA;
      });

    const endDate = new Date();

    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 6);
    startDate.setHours(0, 0, 0, 0);

    const currentWebhooks = allWebhooks.filter(
      (item) =>
        item.rawTime &&
        item.rawTime >= startDate &&
        item.rawTime <= endDate
    );

    ADM_WEBHOOK_DATA.splice(
      0,
      ADM_WEBHOOK_DATA.length,
      ...currentWebhooks
    );

    const endpoints = [
      ...new Set(
        ADM_WEBHOOK_DATA.map((item) => item.endpoint)
      ),
    ].sort();

    ADM_WEBHOOK_ENDPOINTS.splice(
      0,
      ADM_WEBHOOK_ENDPOINTS.length,
      ...endpoints
    );

    const codes = [
      ...new Set(
        ADM_WEBHOOK_DATA.map((item) => item.code)
      ),
    ].sort((a, b) => a - b);

    ADM_WEBHOOK_CODES.splice(
      0,
      ADM_WEBHOOK_CODES.length,
      ...codes
    );

    updateAdminWebhookMetrics(ADM_WEBHOOK_DATA);

    const dateRange = document.getElementById(
      "adm-webhook-date-range"
    );

    if (dateRange) {
      dateRange.textContent =
        `${startDate.toLocaleDateString("vi-VN")} - ` +
        `${endDate.toLocaleDateString("vi-VN")} ↻`;
    }

    // Giữ nguyên các hàm render cũ
    renderAdminWebhookPage();

  } catch (error) {
    console.error("Lỗi tải Webhook Logs:", error);

    ADM_WEBHOOK_DATA.splice(0);
    ADM_WEBHOOK_ENDPOINTS.splice(0);
    ADM_WEBHOOK_CODES.splice(0);

    updateAdminWebhookMetrics([]);
    renderAdminWebhookPage();

    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7"
              style="text-align:center; padding:24px; color:#ff4742;">
            Không tải được Webhook Logs:
            ${error.message || "Lỗi kết nối API"}
          </td>
        </tr>
      `;
    }
  }
}
/* --- 2. HÀM TIỆN ÍCH --- */

function admWebhookCodeColor(code) {
  if (code >= 200 && code < 300) return "#4ade80"; // xanh lá - thành công
  if (code >= 400 && code < 500) return "#f59e0b"; // cam - lỗi phía client
  return "#f87171"; // đỏ - lỗi server (5xx) hoặc khác
}

function admWebhookGetFilteredData() {
  const endpoint = document.getElementById("adm-webhook-endpoint-filter")?.value || "";
  const status = document.getElementById("adm-webhook-status-filter")?.value || "";
  const code = document.getElementById("adm-webhook-code-filter")?.value || "";
  const keyword = (document.getElementById("adm-webhook-search")?.value || "").toLowerCase().trim();

  return ADM_WEBHOOK_DATA.filter((w) => {
    if (endpoint && w.endpoint !== endpoint) return false;
    if (status && w.status !== status) return false;
    if (code && String(w.code) !== String(code)) return false;
    if (keyword) {
      const haystack = `${w.endpoint} ${w.code} ${w.payload}`.toLowerCase();
      if (!haystack.includes(keyword)) return false;
    }
    return true;
  });
}

/* --- 3. RENDER: 4 THẺ CHỈ SỐ --- */

function renderAdminWebhookMetrics() {
  const host = document.getElementById("adm-webhook-metrics");
  if (!host) return;
  host.innerHTML = ADM_WEBHOOK_METRICS.map((m) => {
    const pctHtml = m.pct
      ? `<span style="color:var(--adm-muted); font-size:13px; font-weight:700; margin-left:6px;">(${m.pct})</span>`
      : "";
    return `
    <div class="ad-metric-card">
      <div class="ad-metric-top">
        <div class="ad-metric-icon" style="background:${m.bg}; color:${m.fg};">${m.icon}</div>
      </div>
      <div class="ad-metric-label">${m.label}</div>
      <div class="ad-metric-value">${m.value}${pctHtml}</div>
    </div>`;
  }).join("");
}

/* --- 4. RENDER: DROPDOWN ENDPOINT / HTTP CODE --- */

function renderAdminWebhookFilters() {
  const endpointSelect = document.getElementById("adm-webhook-endpoint-filter");
  if (endpointSelect) {
    const current = endpointSelect.value;
    endpointSelect.innerHTML =
      `<option value="">Tất cả endpoint</option>` +
      ADM_WEBHOOK_ENDPOINTS.map((e) => `<option value="${e}">${e}</option>`).join("");
    endpointSelect.value = current;
  }

  const codeSelect = document.getElementById("adm-webhook-code-filter");
  if (codeSelect) {
    const current = codeSelect.value;
    codeSelect.innerHTML =
      `<option value="">Tất cả mã</option>` +
      ADM_WEBHOOK_CODES.map((c) => `<option value="${c}">${c}</option>`).join("");
    codeSelect.value = current;
  }
}

/* --- 5. RENDER: BẢNG WEBHOOK + PHÂN TRANG --- */

function renderAdminWebhookTable() {
  const tbody = document.getElementById("admin-webhook-tbody");
  if (!tbody) return;

  const filtered = admWebhookGetFilteredData();
  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / admWebhookPageSize));
  if (admWebhookCurrentPage > totalPages) admWebhookCurrentPage = totalPages;

  const startIdx = (admWebhookCurrentPage - 1) * admWebhookPageSize;
  const pageItems = filtered.slice(startIdx, startIdx + admWebhookPageSize);

  if (pageItems.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--adm-muted); padding:24px;">Không tìm thấy webhook nào phù hợp.</td></tr>`;
  } else {
    tbody.innerHTML = pageItems
      .map((w, idx) => {
        const globalIdx = startIdx + idx;
        const isSuccess = w.status === "success";
        const statusHtml = isSuccess
          ? `<span class="log-level-badge log-level-success">Thành công</span>`
          : `<span class="log-level-badge log-level-error">Thất bại</span>`;
        return `
        <tr>
          <td>${w.time}</td>
          <td>${w.endpoint}</td>
          <td><span style="color:${admWebhookCodeColor(w.code)}; font-weight:700;">${w.code}</span></td>
          <td>${statusHtml}</td>
          <td>${w.responseMs.toLocaleString("vi-VN")} ms</td>
          <td>${w.sizeKb.toFixed(2)} KB</td>
          <td>
            <span class="adm-icon-btn" title="Xem chi tiết" onclick="viewAdminWebhookDetail(${globalIdx})">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z"/><circle cx="12" cy="12" r="3"/></svg>
            </span>
            <span class="adm-icon-btn" title="Xem payload" onclick="viewAdminWebhookPayload(${globalIdx})">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
            </span>
          </td>
        </tr>`;
      })
      .join("");
  }

  renderAdminWebhookPagination(totalItems, totalPages);
}

function renderAdminWebhookPagination(totalItems, totalPages) {
  const host = document.getElementById("adm-webhook-pagination");
  if (!host) return;

  const startShown = totalItems === 0 ? 0 : (admWebhookCurrentPage - 1) * admWebhookPageSize + 1;
  const endShown = Math.min(admWebhookCurrentPage * admWebhookPageSize, totalItems);

  let pages = [];
  const maxShown = 5;
  if (totalPages <= maxShown + 1) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages = [1, 2, 3, 4, 5, "...", totalPages];
  }

  const pageBtns = pages
    .map((p) => {
      if (p === "...") return `<span class="adm-pagination-info">...</span>`;
      const activeClass = p === admWebhookCurrentPage ? "active" : "";
      return `<button class="adm-page-btn ${activeClass}" onclick="goToAdminWebhookPage(${p})">${p}</button>`;
    })
    .join("");

  host.innerHTML = `
    <span class="adm-pagination-info">Hiển thị ${startShown} đến ${endShown} của ${totalItems.toLocaleString("vi-VN")} kết quả</span>
    <div class="adm-pagination-controls">
      <select class="adm-page-size-select" onchange="changeAdminWebhookPageSize(this.value)">
        <option value="10" ${admWebhookPageSize === 10 ? "selected" : ""}>10 / trang</option>
        <option value="20" ${admWebhookPageSize === 20 ? "selected" : ""}>20 / trang</option>
        <option value="50" ${admWebhookPageSize === 50 ? "selected" : ""}>50 / trang</option>
      </select>
      <button class="adm-page-btn" onclick="goToAdminWebhookPage(${admWebhookCurrentPage - 1})" ${admWebhookCurrentPage <= 1 ? "disabled" : ""}>‹</button>
      ${pageBtns}
      <button class="adm-page-btn" onclick="goToAdminWebhookPage(${admWebhookCurrentPage + 1})" ${admWebhookCurrentPage >= totalPages ? "disabled" : ""}>›</button>
    </div>
  `;
}

function goToAdminWebhookPage(page) {
  admWebhookCurrentPage = page;
  renderAdminWebhookTable();
}

function changeAdminWebhookPageSize(size) {
  admWebhookPageSize = parseInt(size) || 10;
  admWebhookCurrentPage = 1;
  renderAdminWebhookTable();
}

function filterAdminWebhookTable() {
  admWebhookCurrentPage = 1;
  renderAdminWebhookTable();
}

/* --- 5b. POPUP CHI TIẾT / PAYLOAD (thay cho alert() mặc định của trình duyệt) --- */

// BỔ SUNG: trước đây viewAdminWebhookDetail/viewAdminWebhookPayload dùng alert()
// gốc của trình duyệt (popup "localhost:8080 says" xấu, không đồng bộ giao diện).
// Giờ chuyển sang popup tự vẽ, dùng chung màu sắc với theme admin (--adm-*).
function ensureAdminWebhookModal() {
  let overlay = document.getElementById("adm-webhook-modal-overlay");
  if (overlay) return overlay;

  const style = document.createElement("style");
  style.textContent = [
    "#adm-webhook-modal-overlay {",
    "  display: none; position: fixed; inset: 0; z-index: 9999;",
    "  background: rgba(0,0,0,0.6); align-items: center; justify-content: center;",
    "}",
    "#adm-webhook-modal-overlay.active { display: flex; }",
    ".adm-webhook-modal-box {",
    "  background: var(--adm-surface); color: var(--adm-text);",
    "  border: 1px solid var(--adm-border); border-top: 3px solid var(--adm-red);",
    "  border-radius: 10px; box-shadow: 0 4px 18px rgba(0,0,0,0.45);",
    "  width: 92%; max-width: 480px; max-height: 85vh; overflow-y: auto;",
    "  padding: 22px 24px; box-sizing: border-box;",
    "}",
    ".adm-webhook-modal-head {",
    "  display: flex; align-items: center; justify-content: space-between;",
    "  margin-bottom: 16px;",
    "}",
    ".adm-webhook-modal-head h3 { margin: 0; font-size: 17px; color: var(--adm-text); }",
    ".adm-webhook-modal-close {",
    "  cursor: pointer; background: var(--adm-surface-2); border: 1px solid var(--adm-border);",
    "  color: var(--adm-muted); border-radius: 50%; width: 28px; height: 28px;",
    "  display: flex; align-items: center; justify-content: center; font-size: 16px; line-height: 1;",
    "}",
    ".adm-webhook-modal-close:hover { color: var(--adm-text); border-color: var(--adm-red); }",
    ".adm-webhook-modal-row {",
    "  display: flex; justify-content: space-between; gap: 14px;",
    "  padding: 9px 0; border-bottom: 1px solid var(--adm-border); font-size: 14px;",
    "}",
    ".adm-webhook-modal-row:last-child { border-bottom: none; }",
    ".adm-webhook-modal-row span:first-child { color: var(--adm-muted); }",
    ".adm-webhook-modal-row span:last-child { color: var(--adm-text); font-weight: 600; text-align: right; }",
    ".adm-webhook-modal-pre {",
    "  background: var(--adm-surface-2); border: 1px solid var(--adm-border); border-radius: 8px;",
    "  padding: 14px; font-size: 13px; color: var(--adm-text); white-space: pre-wrap;",
    "  word-break: break-word; max-height: 50vh; overflow-y: auto; margin: 0;",
    "}"
  ].join("\n");
  document.head.appendChild(style);

  overlay = document.createElement("div");
  overlay.id = "adm-webhook-modal-overlay";
  overlay.innerHTML =
    '<div class="adm-webhook-modal-box" onclick="event.stopPropagation()">' +
      '<div class="adm-webhook-modal-head">' +
        '<h3 id="adm-webhook-modal-title"></h3>' +
        '<span class="adm-webhook-modal-close" onclick="closeAdminWebhookModal()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></span>' +
      '</div>' +
      '<div id="adm-webhook-modal-body"></div>' +
    '</div>';
  overlay.addEventListener("click", closeAdminWebhookModal);
  document.body.appendChild(overlay);
  return overlay;
}

function closeAdminWebhookModal() {
  const overlay = document.getElementById("adm-webhook-modal-overlay");
  if (overlay) overlay.classList.remove("active");
}

function openAdminWebhookModal(title, bodyHtml) {
  const overlay = ensureAdminWebhookModal();
  overlay.querySelector("#adm-webhook-modal-title").textContent = title;
  overlay.querySelector("#adm-webhook-modal-body").innerHTML = bodyHtml;
  overlay.classList.add("active");
}

function viewAdminWebhookDetail(globalIdx) {
  const filtered = admWebhookGetFilteredData();
  const item = filtered[globalIdx];
  if (!item) return;

  const statusText = item.status === "success" ? "Thành công" : "Thất bại";
  const rows = [
    ["Thời gian", item.time],
    ["Endpoint", item.endpoint],
    ["HTTP Code", item.code],
    ["Trạng thái", statusText],
    ["Thời gian phản hồi", `${item.responseMs} ms`],
    ["Kích thước", `${item.sizeKb.toFixed(2)} KB`],
  ];

  const bodyHtml = rows
    .map(([label, value]) => `<div class="adm-webhook-modal-row"><span>${label}</span><span>${value}</span></div>`)
    .join("");

  openAdminWebhookModal("Chi tiết webhook", bodyHtml);
}

function viewAdminWebhookPayload(globalIdx) {
  const filtered = admWebhookGetFilteredData();
  const item = filtered[globalIdx];
  if (!item) return;

  const bodyHtml = `<pre class="adm-webhook-modal-pre">${item.payload
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")}</pre>`;

  openAdminWebhookModal(`Payload — ${item.endpoint}`, bodyHtml);
}

/* --- 6. XUẤT CSV (client-side, không cần Back-end) --- */

function exportAdminWebhookCsv() {
  const filtered = admWebhookGetFilteredData();
  if (filtered.length === 0) {
    alert("Không có dữ liệu webhook nào để xuất!");
    return;
  }

  const header = ["Thời gian", "Endpoint", "HTTP Code", "Trạng thái", "Thời gian phản hồi (ms)", "Kích thước (KB)", "Payload"];
  const rows = filtered.map((w) => [
    w.time,
    w.endpoint,
    w.code,
    w.status === "success" ? "Thành công" : "Thất bại",
    w.responseMs,
    w.sizeKb,
    w.payload,
  ]);

  const csvContent = [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\r\n");

  const blob = new Blob(["﻿" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `webhook_logs_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/* --- 7. HÀM KHỞI TẠO CHÍNH — gọi khi chuyển sang tab "Webhook Logs" --- */

function renderAdminWebhookPage() {
  admWebhookCurrentPage = 1;
  renderAdminWebhookMetrics();
  renderAdminWebhookFilters();
  renderAdminWebhookTable();
}