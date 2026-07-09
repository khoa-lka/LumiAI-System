/* =========================================================================
   WEBHOOK LOGS (ADMIN) — DỮ LIỆU TĨNH (STATIC MOCK DATA)
   Ghi chú: Toàn bộ số liệu & danh sách webhook trong file này là dữ liệu tĩnh,
   dùng để hoàn thiện giao diện theo mẫu tham khảo (LumiAI - Webhook Logs).
   Khi Back-end có API webhook thật, chỉ cần thay ADM_WEBHOOK_DATA /
   ADM_WEBHOOK_METRICS bằng dữ liệu fetch() từ server, giữ nguyên các hàm
   render/filter/export bên dưới.
   ========================================================================= */

/* --- 1. 4 THẺ CHỈ SỐ TỔNG QUAN --- */
const ADM_WEBHOOK_METRICS = [
  { icon: "#️⃣", bg: "rgba(59,130,246,0.16)", fg: "#60a5fa", label: "Tổng webhook", value: "1.024", pct: "" },
  { icon: "✅", bg: "rgba(34,197,94,0.16)", fg: "#4ade80", label: "Thành công", value: "892", pct: "87.1%" },
  { icon: "⛔", bg: "rgba(239,68,68,0.16)", fg: "#f87171", label: "Thất bại", value: "132", pct: "12.9%" },
  { icon: "🔗", bg: "rgba(59,130,246,0.16)", fg: "#60a5fa", label: "Endpoint đang hoạt động", value: "8", pct: "" },
];

/* --- 2. DANH SÁCH WEBHOOK MẪU (đại diện, phân trang & lọc hoạt động thật trên tập này) --- */
const ADM_WEBHOOK_DATA = [
  { time: "09/07/2026 14:32:21", endpoint: "/webhook/chat", code: 200, status: "success", responseMs: 245, sizeKb: 2.45, payload: '{"message":"Xin chào, tôi cần hỗ trợ đặt vé"}' },
  { time: "09/07/2026 14:31:05", endpoint: "/webhook/user", code: 201, status: "success", responseMs: 198, sizeKb: 1.12, payload: '{"userId":128,"action":"created"}' },
  { time: "09/07/2026 14:30:12", endpoint: "/webhook/payment", code: 500, status: "failed", responseMs: 1245, sizeKb: 3.67, payload: '{"orderId":"88231","error":"Gateway timeout"}' },
  { time: "09/07/2026 14:29:47", endpoint: "/webhook/subscription", code: 200, status: "success", responseMs: 312, sizeKb: 2.01, payload: '{"plan":"pro","status":"active"}' },
  { time: "09/07/2026 14:28:33", endpoint: "/webhook/ai-result", code: 200, status: "success", responseMs: 421, sizeKb: 4.89, payload: '{"model":"lumiai-v2","tokens":842}' },
  { time: "09/07/2026 14:27:19", endpoint: "/webhook/chat", code: 400, status: "failed", responseMs: 156, sizeKb: 2.33, payload: '{"error":"Thiếu trường bắt buộc: conversation_id"}' },
  { time: "09/07/2026 14:25:08", endpoint: "/webhook/notification", code: 200, status: "success", responseMs: 99, sizeKb: 1.01, payload: '{"type":"push","recipients":1}' },
  { time: "09/07/2026 14:24:36", endpoint: "/webhook/email", code: 200, status: "success", responseMs: 120, sizeKb: 1.45, payload: '{"to":"khachhang@example.com","template":"booking_confirm"}' },
  { time: "09/07/2026 14:23:11", endpoint: "/webhook/security", code: 404, status: "failed", responseMs: 88, sizeKb: 0.92, payload: '{"error":"Endpoint không tồn tại"}' },
  { time: "09/07/2026 14:21:54", endpoint: "/webhook/email", code: 200, status: "success", responseMs: 110, sizeKb: 1.15, payload: '{"to":"tranthib@example.com","template":"password_reset"}' },
  { time: "09/07/2026 13:58:02", endpoint: "/webhook/chat", code: 200, status: "success", responseMs: 267, sizeKb: 2.6, payload: '{"message":"Cho tôi hỏi lịch chiếu phim Lầu Chú Hỏa"}' },
  { time: "09/07/2026 13:47:15", endpoint: "/webhook/payment", code: 200, status: "success", responseMs: 534, sizeKb: 2.98, payload: '{"orderId":"88240","status":"paid"}' },
  { time: "09/07/2026 13:30:44", endpoint: "/webhook/booking", code: 201, status: "success", responseMs: 289, sizeKb: 3.12, payload: '{"showtimeId":4521,"seats":["C5","C6"]}' },
  { time: "09/07/2026 13:12:09", endpoint: "/webhook/payment", code: 500, status: "failed", responseMs: 1580, sizeKb: 3.4, payload: '{"orderId":"88245","error":"Bank gateway unreachable"}' },
  { time: "09/07/2026 12:55:37", endpoint: "/webhook/ai-result", code: 200, status: "success", responseMs: 378, sizeKb: 4.21, payload: '{"model":"lumiai-v2","tokens":650}' },
  { time: "09/07/2026 12:40:21", endpoint: "/webhook/notification", code: 200, status: "success", responseMs: 104, sizeKb: 0.98, payload: '{"type":"email","recipients":3}' },
  { time: "09/07/2026 12:20:03", endpoint: "/webhook/security", code: 401, status: "failed", responseMs: 76, sizeKb: 0.85, payload: '{"error":"Token không hợp lệ"}' },
  { time: "09/07/2026 11:58:59", endpoint: "/webhook/booking", code: 200, status: "success", responseMs: 301, sizeKb: 2.77, payload: '{"showtimeId":4522,"seats":["D1"]}' },
  { time: "09/07/2026 11:33:12", endpoint: "/webhook/chat", code: 200, status: "success", responseMs: 233, sizeKb: 2.15, payload: '{"message":"Rạp có suất chiếu IMAX không?"}' },
  { time: "09/07/2026 11:10:48", endpoint: "/webhook/user", code: 200, status: "success", responseMs: 178, sizeKb: 1.34, payload: '{"userId":142,"action":"updated"}' },
  { time: "09/07/2026 10:47:26", endpoint: "/webhook/payment", code: 400, status: "failed", responseMs: 210, sizeKb: 1.9, payload: '{"error":"Số thẻ không hợp lệ"}' },
  { time: "09/07/2026 10:22:14", endpoint: "/webhook/email", code: 200, status: "success", responseMs: 132, sizeKb: 1.22, payload: '{"to":"manager_vien@las.vn","template":"low_stock_alert"}' },
  { time: "09/07/2026 10:05:37", endpoint: "/webhook/chat", code: 200, status: "success", responseMs: 251, sizeKb: 2.5, payload: '{"message":"Giá vé phòng IMAX bao nhiêu?"}' },
  { time: "09/07/2026 09:48:03", endpoint: "/webhook/security", code: 500, status: "failed", responseMs: 990, sizeKb: 1.05, payload: '{"error":"Không thể xác minh chữ ký webhook"}' },
  { time: "09/07/2026 09:30:51", endpoint: "/webhook/subscription", code: 200, status: "success", responseMs: 288, sizeKb: 2.09, payload: '{"plan":"basic","status":"cancelled"}' },
  { time: "08/07/2026 22:14:09", endpoint: "/webhook/booking", code: 200, status: "success", responseMs: 296, sizeKb: 2.81, payload: '{"showtimeId":4498,"seats":["A2","A3"]}' },
  { time: "08/07/2026 21:50:33", endpoint: "/webhook/security", code: 403, status: "failed", responseMs: 65, sizeKb: 0.77, payload: '{"error":"IP bị chặn do nghi ngờ tấn công"}' },
  { time: "08/07/2026 20:37:41", endpoint: "/webhook/user", code: 200, status: "success", responseMs: 190, sizeKb: 1.4, payload: '{"userId":91,"action":"updated"}' },
  { time: "08/07/2026 19:59:12", endpoint: "/webhook/email", code: 500, status: "failed", responseMs: 1420, sizeKb: 1.5, payload: '{"to":"khachhang09@example.com","error":"SMTP timeout"}' },
  { time: "08/07/2026 19:20:05", endpoint: "/webhook/booking", code: 201, status: "success", responseMs: 305, sizeKb: 3.05, payload: '{"showtimeId":4530,"seats":["B4"]}' },
  { time: "08/07/2026 18:44:38", endpoint: "/webhook/chat", code: 200, status: "success", responseMs: 244, sizeKb: 2.3, payload: '{"message":"Rạp còn suất 20h hôm nay không?"}' },
  { time: "08/07/2026 18:02:57", endpoint: "/webhook/ai-result", code: 200, status: "success", responseMs: 402, sizeKb: 4.5, payload: '{"model":"lumiai-v2","tokens":712}' },
  { time: "08/07/2026 17:31:20", endpoint: "/webhook/payment", code: 200, status: "success", responseMs: 498, sizeKb: 2.85, payload: '{"orderId":"88190","status":"paid"}' },
  { time: "08/07/2026 16:48:16", endpoint: "/webhook/notification", code: 400, status: "failed", responseMs: 91, sizeKb: 0.88, payload: '{"error":"Thiếu recipients"}' },
  { time: "08/07/2026 16:10:44", endpoint: "/webhook/booking", code: 200, status: "success", responseMs: 277, sizeKb: 2.66, payload: '{"showtimeId":4501,"seats":["C1","C2"]}' },
  { time: "08/07/2026 15:22:07", endpoint: "/webhook/subscription", code: 200, status: "success", responseMs: 265, sizeKb: 1.95, payload: '{"plan":"pro","status":"renewed"}' },
  { time: "08/07/2026 14:59:31", endpoint: "/webhook/security", code: 401, status: "failed", responseMs: 70, sizeKb: 0.81, payload: '{"error":"Token hết hạn"}' },
  { time: "08/07/2026 14:20:19", endpoint: "/webhook/user", code: 201, status: "success", responseMs: 205, sizeKb: 1.5, payload: '{"userId":150,"action":"created"}' },
  { time: "08/07/2026 13:45:52", endpoint: "/webhook/chat", code: 200, status: "success", responseMs: 259, sizeKb: 2.4, payload: '{"message":"Cho tôi combo bắp nước loại nào rẻ nhất"}' },
  { time: "08/07/2026 13:08:03", endpoint: "/webhook/payment", code: 402, status: "failed", responseMs: 340, sizeKb: 1.6, payload: '{"error":"Giao dịch bị từ chối bởi ngân hàng"}' },
];

// Danh sách endpoint & mã HTTP (dùng để đổ vào dropdown lọc)
const ADM_WEBHOOK_ENDPOINTS = [...new Set(ADM_WEBHOOK_DATA.map((w) => w.endpoint))].sort();
const ADM_WEBHOOK_CODES = [...new Set(ADM_WEBHOOK_DATA.map((w) => w.code))].sort((a, b) => a - b);

// Trạng thái phân trang hiện tại
let admWebhookCurrentPage = 1;
let admWebhookPageSize = 10;

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
            <span title="Xem chi tiết" style="cursor:pointer; margin-right:10px;" onclick="viewAdminWebhookDetail(${globalIdx})">👁️</span>
            <span title="Xem payload" style="cursor:pointer;" onclick="viewAdminWebhookPayload(${globalIdx})">&lt;/&gt;</span>
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

function viewAdminWebhookDetail(globalIdx) {
  const filtered = admWebhookGetFilteredData();
  const item = filtered[globalIdx];
  if (!item) return;
  alert(
    `Chi tiết webhook\n\nThời gian: ${item.time}\nEndpoint: ${item.endpoint}\nHTTP Code: ${item.code}\nTrạng thái: ${item.status === "success" ? "Thành công" : "Thất bại"}\nThời gian phản hồi: ${item.responseMs} ms\nKích thước: ${item.sizeKb} KB`,
  );
}

function viewAdminWebhookPayload(globalIdx) {
  const filtered = admWebhookGetFilteredData();
  const item = filtered[globalIdx];
  if (!item) return;
  alert(`Payload — ${item.endpoint}\n\n${item.payload}`);
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

  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
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