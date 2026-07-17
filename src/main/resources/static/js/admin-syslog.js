/* =========================================================================
   LOGS HỆ THỐNG (ADMIN) — DỮ LIỆU TĨNH (STATIC MOCK DATA)
   Ghi chú: Toàn bộ số liệu & danh sách log trong file này là dữ liệu tĩnh,
   dùng để hoàn thiện giao diện theo mẫu tham khảo (LumiAI - Logs hệ thống).
   Khi Back-end có API logs thật, chỉ cần thay ADM_SYSLOG_DATA / ADM_SYSLOG_METRICS
   bằng dữ liệu fetch() từ server, giữ nguyên các hàm render/filter/export bên dưới.
   ========================================================================= */

/* --- 1. 4 THẺ CHỈ SỐ TỔNG QUAN --- */
const ADM_SYSLOG_METRICS = [
  // BỔ SUNG: đồng bộ nền tối đồng nhất + icon outline trắng cho cả 4 thẻ
  // (trước đây mỗi thẻ 1 màu nền/icon riêng theo loại: xanh lá/xanh dương/cam/đỏ).
  { icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l6-6 4 4 8-8"/><path d="M17 7h4v4"/></svg>', bg: "var(--adm-surface-2)", fg: "#ffffff", label: "Tổng log", value: "0", delta: "0%", trend: "up", sub: "so với 7 ngày trước" },
  { icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>', bg: "var(--adm-surface-2)", fg: "#ffffff", label: "Thông tin", value: "0", delta: "0%", trend: "up", sub: "so với 7 ngày trước" },
  { icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4 3 19h18z"/><path d="M12 10v4M12 17h.01"/></svg>', bg: "var(--adm-surface-2)", fg: "#ffffff", label: "Cảnh báo", value: "0", delta: "0%", trend: "up", sub: "so với 7 ngày trước" },
  { icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M6 6l12 12"/></svg>', bg: "var(--adm-surface-2)", fg: "#ffffff", label: "Lỗi", value: "0", delta: "0%", trend: "down", sub: "so với 7 ngày trước" },
];

/* --- 2. DỮ LIỆU LOG ĐƯỢC LẤY TỪ API --- */
const ADM_SYSLOG_DATA = [];


// Danh sách hành động (dùng để đổ vào dropdown "Tất cả hành động")
const ADM_SYSLOG_ACTIONS = [...new Set(ADM_SYSLOG_DATA.map((l) => l.action))].sort();

// Trạng thái phân trang hiện tại
let admSyslogCurrentPage = 1;
let admSyslogPageSize = 10;

/* --- 2. HÀM TIỆN ÍCH --- */
function formatAdminSysLogTime(value) {
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

function normalizeAdminSysLog(log) {
  let level = String(log.level || "").toLowerCase();

  if (!["info", "warning", "error"].includes(level)) {
    level =
      String(log.status || "").toUpperCase() === "FAILED"
        ? "error"
        : "info";
  }

  return {
    time: formatAdminSysLogTime(log.time),
    level: level,
    action: log.action || "Không xác định",
    user: log.user || "system",
    ip: log.ip || "Không xác định",
    detail: log.detail || "Không có chi tiết",
    rawTime: log.time ? new Date(log.time) : null,
  };
}

function updateAdminSysLogMetrics(currentLogs, previousLogs) {
  const countLevel = (logs, level) => {
    if (!level) return logs.length;
    return logs.filter((log) => log.level === level).length;
  };

  const levels = [null, "info", "warning", "error"];

  ADM_SYSLOG_METRICS.forEach((metric, index) => {
    const currentValue = countLevel(currentLogs, levels[index]);
    const previousValue = countLevel(previousLogs, levels[index]);

    let percent = 0;

    if (previousValue === 0) {
      percent = currentValue === 0 ? 0 : 100;
    } else {
      percent = Math.abs(
        ((currentValue - previousValue) / previousValue) * 100
      );
    }

    metric.value = currentValue.toLocaleString("vi-VN");
    metric.delta = `${percent.toFixed(1)}%`;
    metric.trend = currentValue >= previousValue ? "up" : "down";
    metric.sub = "so với 7 ngày trước";
  });
}

async function loadAdminSysLogs() {
  const tbody = document.getElementById("admin-syslog-tbody");

  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6"
            style="text-align:center; padding:24px; color:var(--adm-muted);">
          Đang tải logs hệ thống...
        </td>
      </tr>
    `;
  }

  try {
    const response = await API.getSysLogs();
    const allLogs = (Array.isArray(response) ? response : [])
      .map(normalizeAdminSysLog);

    const endDate = new Date();

    const currentStart = new Date(endDate);
    currentStart.setDate(currentStart.getDate() - 6);
    currentStart.setHours(0, 0, 0, 0);

    const previousStart = new Date(currentStart);
    previousStart.setDate(previousStart.getDate() - 7);

    const currentLogs = allLogs.filter(
      (log) =>
        log.rawTime &&
        log.rawTime >= currentStart &&
        log.rawTime <= endDate
    );

    const previousLogs = allLogs.filter(
      (log) =>
        log.rawTime &&
        log.rawTime >= previousStart &&
        log.rawTime < currentStart
    );

    ADM_SYSLOG_DATA.splice(
      0,
      ADM_SYSLOG_DATA.length,
      ...currentLogs
    );

    const actions = [
      ...new Set(ADM_SYSLOG_DATA.map((log) => log.action)),
    ].sort();

    ADM_SYSLOG_ACTIONS.splice(
      0,
      ADM_SYSLOG_ACTIONS.length,
      ...actions
    );

    updateAdminSysLogMetrics(currentLogs, previousLogs);

    const dateRange = document.getElementById("adm-syslog-date-range");

    if (dateRange) {
      dateRange.textContent =
        `${currentStart.toLocaleDateString("vi-VN")} - ` +
        `${endDate.toLocaleDateString("vi-VN")}`;
    }

    // Gọi lại toàn bộ render cũ, không sửa logic render
    renderAdminSysLogPage();
  } catch (error) {
    console.error("Lỗi tải logs hệ thống:", error);

    ADM_SYSLOG_DATA.splice(0);
    ADM_SYSLOG_ACTIONS.splice(0);

    renderAdminSysLogPage();

    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6"
              style="text-align:center; padding:24px; color:#ff4742;">
            Không tải được logs hệ thống:
            ${error.message || "Lỗi kết nối API"}
          </td>
        </tr>
      `;
    }
  }
}

const ADM_SYSLOG_LEVEL_LABEL = { info: "Thông tin", warning: "Cảnh báo", error: "Lỗi" };
const ADM_SYSLOG_LEVEL_CLASS = { info: "log-level-info", warning: "log-level-warning", error: "log-level-error" };

function admSyslogGetFilteredData() {
  const level = document.getElementById("adm-syslog-level-filter")?.value || "";
  const action = document.getElementById("adm-syslog-action-filter")?.value || "";
  const keyword = (document.getElementById("adm-syslog-search")?.value || "").toLowerCase().trim();

  return ADM_SYSLOG_DATA.filter((l) => {
    if (level && l.level !== level) return false;
    if (action && l.action !== action) return false;
    if (keyword) {
      const haystack = `${l.action} ${l.user} ${l.ip} ${l.detail}`.toLowerCase();
      if (!haystack.includes(keyword)) return false;
    }
    return true;
  });
}

/* --- 3. RENDER: 4 THẺ CHỈ SỐ --- */

function renderAdminSysLogMetrics() {
  const host = document.getElementById("adm-syslog-metrics");
  if (!host) return;
  host.innerHTML = ADM_SYSLOG_METRICS.map((m) => {
    const badgeClass = m.trend === "down" ? "ad-badge-down" : "ad-badge-up";
    const arrow = m.trend === "down" ? "↓" : "↑";
    return `
    <div class="ad-metric-card">
      <div class="ad-metric-top">
        <div class="ad-metric-icon" style="background:${m.bg}; color:${m.fg};">${m.icon}</div>
      </div>
      <div class="ad-metric-label">${m.label}</div>
      <div class="ad-metric-value">${m.value}</div>
      <div class="ad-metric-delta"><span class="${badgeClass}">${arrow} ${m.delta}</span> ${m.sub}</div>
    </div>`;
  }).join("");
}

/* --- 4. RENDER: DROPDOWN "TẤT CẢ HÀNH ĐỘNG" --- */

function renderAdminSysLogActionFilter() {
  const select = document.getElementById("adm-syslog-action-filter");
  if (!select) return;
  const current = select.value;
  select.innerHTML =
    `<option value="">Tất cả hành động</option>` +
    ADM_SYSLOG_ACTIONS.map((a) => `<option value="${a}">${a}</option>`).join("");
  select.value = current;
}

/* --- 5. RENDER: BẢNG LOG + PHÂN TRANG --- */

function renderAdminSysLogTable() {
  const tbody = document.getElementById("admin-syslog-tbody");
  if (!tbody) return;

  const filtered = admSyslogGetFilteredData();
  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / admSyslogPageSize));
  if (admSyslogCurrentPage > totalPages) admSyslogCurrentPage = totalPages;

  const startIdx = (admSyslogCurrentPage - 1) * admSyslogPageSize;
  const pageItems = filtered.slice(startIdx, startIdx + admSyslogPageSize);

  if (pageItems.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--adm-muted); padding:24px;">Không tìm thấy log nào phù hợp.</td></tr>`;
  } else {
    tbody.innerHTML = pageItems
      .map((l, idx) => {
        const globalIdx = startIdx + idx;
        const levelLabel = ADM_SYSLOG_LEVEL_LABEL[l.level] || l.level;
        const levelClass = ADM_SYSLOG_LEVEL_CLASS[l.level] || "";
        return `
        <tr>
          <td>${l.time}</td>
          <td><span class="log-level-badge ${levelClass}">${levelLabel}</span></td>
          <td>${l.action}</td>
          <td>${l.user}</td>
          <td>${l.ip}</td>
          <td>
            ${l.detail}
            <span class="adm-icon-btn" style="margin-left:8px;" title="Xem chi tiết" onclick="viewAdminSysLogDetail(${globalIdx})">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z"/><circle cx="12" cy="12" r="3"/></svg>
            </span>
          </td>
        </tr>`;
      })
      .join("");
  }

  renderAdminSysLogPagination(totalItems, totalPages);
}

function renderAdminSysLogPagination(totalItems, totalPages) {
  const host = document.getElementById("adm-syslog-pagination");
  if (!host) return;

  const startShown = totalItems === 0 ? 0 : (admSyslogCurrentPage - 1) * admSyslogPageSize + 1;
  const endShown = Math.min(admSyslogCurrentPage * admSyslogPageSize, totalItems);

  // Xây danh sách số trang (rút gọn kiểu 1 2 3 4 5 ... N khi nhiều trang)
  let pageBtns = "";
  const maxShown = 5;
  let pages = [];
  if (totalPages <= maxShown + 1) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages = [1, 2, 3, 4, 5, "...", totalPages];
  }

  pageBtns = pages
    .map((p) => {
      if (p === "...") return `<span class="adm-pagination-info">...</span>`;
      const activeClass = p === admSyslogCurrentPage ? "active" : "";
      return `<button class="adm-page-btn ${activeClass}" onclick="goToAdminSysLogPage(${p})">${p}</button>`;
    })
    .join("");

  host.innerHTML = `
    <span class="adm-pagination-info">Hiển thị ${startShown} đến ${endShown} của ${totalItems.toLocaleString("vi-VN")} kết quả</span>
    <div class="adm-pagination-controls">
      <select class="adm-page-size-select" onchange="changeAdminSysLogPageSize(this.value)">
        <option value="10" ${admSyslogPageSize === 10 ? "selected" : ""}>10 / trang</option>
        <option value="20" ${admSyslogPageSize === 20 ? "selected" : ""}>20 / trang</option>
        <option value="50" ${admSyslogPageSize === 50 ? "selected" : ""}>50 / trang</option>
      </select>
      <button class="adm-page-btn" onclick="goToAdminSysLogPage(${admSyslogCurrentPage - 1})" ${admSyslogCurrentPage <= 1 ? "disabled" : ""}>‹</button>
      ${pageBtns}
      <button class="adm-page-btn" onclick="goToAdminSysLogPage(${admSyslogCurrentPage + 1})" ${admSyslogCurrentPage >= totalPages ? "disabled" : ""}>›</button>
    </div>
  `;
}

function goToAdminSysLogPage(page) {
  admSyslogCurrentPage = page;
  renderAdminSysLogTable();
}

function changeAdminSysLogPageSize(size) {
  admSyslogPageSize = parseInt(size) || 10;
  admSyslogCurrentPage = 1;
  renderAdminSysLogTable();
}

function filterAdminSysLogTable() {
  admSyslogCurrentPage = 1;
  renderAdminSysLogTable();
}

function viewAdminSysLogDetail(globalIdx) {
  const filtered = admSyslogGetFilteredData();
  const item = filtered[globalIdx];

  if (!item) return;

  const popup = document.getElementById("syslog-detail-popup");
  const levelElement = document.getElementById("syslog-detail-level");

  if (!popup || !levelElement) {
    console.error("Không tìm thấy popup chi tiết Syslog");
    return;
  }

  document.getElementById("syslog-detail-time").textContent =
    item.time || "Không xác định";

  document.getElementById("syslog-detail-action").textContent =
    item.action || "Không xác định";

  document.getElementById("syslog-detail-user").textContent =
    item.user || "Không xác định";

  document.getElementById("syslog-detail-ip").textContent =
    item.ip || "Không xác định";

  document.getElementById("syslog-detail-description").textContent =
    item.detail || "Không có nội dung chi tiết";

  const levelLabel =
    ADM_SYSLOG_LEVEL_LABEL[item.level] || item.level || "Không xác định";

  const levelClass =
    ADM_SYSLOG_LEVEL_CLASS[item.level] || "";

  levelElement.textContent = levelLabel;

  levelElement.className =
    `log-level-badge ${levelClass}`.trim();

  popup.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeAdminSysLogDetail() {
  const popup = document.getElementById("syslog-detail-popup");

  if (popup) {
    popup.classList.remove("open");
  }

  document.body.style.overflow = "";
}

function closeSysLogDetailByOverlay(event) {
  if (event.target === event.currentTarget) {
    closeAdminSysLogDetail();
  }
}

document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    closeAdminSysLogDetail();
  }
});

/* --- 6. XUẤT CSV (client-side, không cần Back-end) --- */

function exportAdminSysLogCsv() {
  const filtered = admSyslogGetFilteredData();
  if (filtered.length === 0) {
    alert("Không có dữ liệu log nào để xuất!");
    return;
  }

  const header = ["Thời gian", "Mức độ", "Hành động", "User", "IP Address", "Chi tiết"];
  const rows = filtered.map((l) => [
    l.time,
    ADM_SYSLOG_LEVEL_LABEL[l.level] || l.level,
    l.action,
    l.user,
    l.ip,
    l.detail,
  ]);

  const csvContent = [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\r\n");

  // Thêm BOM để Excel hiển thị đúng tiếng Việt có dấu
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `logs_he_thong_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/* --- 7. HÀM KHỞI TẠO CHÍNH — gọi khi chuyển sang tab "Logs hệ thống" --- */

function renderAdminSysLogPage() {
  admSyslogCurrentPage = 1;
  renderAdminSysLogMetrics();
  renderAdminSysLogActionFilter();
  renderAdminSysLogTable();
}
/* =========================================================
   THÔNG BÁO CHUÔNG ADMIN — LẤY TỪ SYSLOG
   ========================================================= */

let ADM_BELL_LOGS = [];
let admBellRefreshTimer = null;

const ADM_BELL_LAST_SEEN_KEY = "adm_syslog_last_seen_time";

function escapeAdminBellHtml(value) {
  const element = document.createElement("div");
  element.textContent = String(value ?? "");
  return element.innerHTML;
}

async function loadAdminBellNotifications() {
  const dropdown = document.getElementById("adm-notif-dropdown");
  const badge = document.getElementById("adm-notif-count");

  if (!dropdown || !badge) return;

  try {
    const response = await API.getSysLogs();

    const allLogs = (Array.isArray(response) ? response : [])
      .map(normalizeAdminSysLog)
      .filter((log) => log.rawTime)
      .sort((a, b) => b.rawTime.getTime() - a.rawTime.getTime());

    // Chuông chỉ hiển thị 8 thao tác mới nhất
    ADM_BELL_LOGS = allLogs.slice(0, 8);

    const lastSeenTime = Number(
      localStorage.getItem(ADM_BELL_LAST_SEEN_KEY) || 0
    );

    const unreadCount = allLogs.filter(
      (log) => log.rawTime.getTime() > lastSeenTime
    ).length;

    renderAdminBellNotifications(unreadCount);
  } catch (error) {
    console.error("Lỗi tải thông báo chuông Admin:", error);

    dropdown.innerHTML = `
      <div class="adm-notif-empty">
        Không tải được thông báo hệ thống.
      </div>
    `;

    badge.style.display = "none";
  }
}

function renderAdminBellNotifications(unreadCount) {
  const dropdown = document.getElementById("adm-notif-dropdown");
  const badge = document.getElementById("adm-notif-count");

  if (!dropdown || !badge) return;

  if (unreadCount > 0) {
    badge.textContent = unreadCount > 99 ? "99+" : unreadCount;
    badge.style.display = "flex";
  } else {
    badge.textContent = "0";
    badge.style.display = "none";
  }

  if (ADM_BELL_LOGS.length === 0) {
    dropdown.innerHTML = `
      <div class="adm-notif-empty">
        Chưa có hoạt động hệ thống.
      </div>
    `;
    return;
  }

  dropdown.innerHTML = `
    <div class="adm-notif-header">
      <strong>Hoạt động mới</strong>
      <span>${unreadCount} chưa xem</span>
    </div>

    <div class="adm-notif-list">
      ${ADM_BELL_LOGS.map((log) => {
        const levelClass =
          log.level === "error"
            ? "error"
            : log.level === "warning"
              ? "warning"
              : "info";

        return `
          <div class="adm-notif-item ${levelClass}"
               onclick="openAdminBellLogs()">

            <span class="adm-notif-dot"></span>

            <div class="adm-notif-content">
              <strong>${escapeAdminBellHtml(log.action)}</strong>

              <p>${escapeAdminBellHtml(log.detail)}</p>

              <small>
                ${escapeAdminBellHtml(log.time)}
                · ${escapeAdminBellHtml(log.user)}
              </small>
            </div>
          </div>
        `;
      }).join("")}
    </div>

    <button type="button"
            class="adm-notif-view-all"
            onclick="openAdminBellLogs()">
      Xem tất cả Logs hệ thống
    </button>
  `;
}

function markAdminBellNotificationsRead() {
  const latestLog = ADM_BELL_LOGS[0];

  if (latestLog?.rawTime) {
    localStorage.setItem(
      ADM_BELL_LAST_SEEN_KEY,
      String(latestLog.rawTime.getTime())
    );
  }

  const badge = document.getElementById("adm-notif-count");

  if (badge) {
    badge.textContent = "0";
    badge.style.display = "none";
  }

  // Cập nhật dòng "chưa xem" thành 0
  renderAdminBellNotifications(0);
}

function openAdminBellLogs() {
  const dropdown = document.getElementById("adm-notif-dropdown");

  if (dropdown) {
    dropdown.classList.remove("open");
  }

  markAdminBellNotificationsRead();

  if (typeof switchAdminTab === "function") {
    switchAdminTab("syslog");
  }

  if (typeof loadAdminSysLogs === "function") {
    loadAdminSysLogs();
  }
}

document.addEventListener("DOMContentLoaded", function () {
  loadAdminBellNotifications();

  if (!admBellRefreshTimer) {
    // Cập nhật chuông sau mỗi 15 giây
    admBellRefreshTimer = setInterval(
      loadAdminBellNotifications,
      15000
    );
  }
});