/* =========================================================================
   LOGS HỆ THỐNG (ADMIN) — DỮ LIỆU TĨNH (STATIC MOCK DATA)
   Ghi chú: Toàn bộ số liệu & danh sách log trong file này là dữ liệu tĩnh,
   dùng để hoàn thiện giao diện theo mẫu tham khảo (LumiAI - Logs hệ thống).
   Khi Back-end có API logs thật, chỉ cần thay ADM_SYSLOG_DATA / ADM_SYSLOG_METRICS
   bằng dữ liệu fetch() từ server, giữ nguyên các hàm render/filter/export bên dưới.
   ========================================================================= */

/* --- 1. 4 THẺ CHỈ SỐ TỔNG QUAN --- */
const ADM_SYSLOG_METRICS = [
  { icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l6-6 4 4 8-8"/><path d="M17 7h4v4"/></svg>', bg: "rgba(34,197,94,0.16)", fg: "#4ade80", label: "Tổng log", value: "8.652", delta: "18.7%", trend: "up", sub: "so với 7 ngày trước" },
  { icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>', bg: "rgba(59,130,246,0.16)", fg: "#60a5fa", label: "Thông tin", value: "6.125", delta: "15.3%", trend: "up", sub: "so với 7 ngày trước" },
  { icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4 3 19h18z"/><path d="M12 10v4M12 17h.01"/></svg>', bg: "rgba(245,158,11,0.16)", fg: "#f59e0b", label: "Cảnh báo", value: "1.842", delta: "8.9%", trend: "up", sub: "so với 7 ngày trước" },
  { icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M6 6l12 12"/></svg>', bg: "rgba(239,68,68,0.16)", fg: "#f87171", label: "Lỗi", value: "685", delta: "7.9%", trend: "down", sub: "so với 7 ngày trước" },
];

/* --- 2. DANH SÁCH LOG MẪU (đại diện, phân trang & lọc hoạt động thật trên tập này) --- */
const ADM_SYSLOG_DATA = [
  { time: "09/07/2026 14:32:21", level: "info", action: "Đăng nhập thành công", user: "nguyenbaohuy", ip: "192.168.1.10", detail: "Đăng nhập vào hệ thống từ Chrome trên Windows" },
  { time: "09/07/2026 14:31:05", level: "info", action: "Tạo tài khoản người dùng", user: "nguyenbaohuy", ip: "192.168.1.10", detail: "Tạo tài khoản mới: tranthib@example.com" },
  { time: "09/07/2026 14:30:12", level: "warning", action: "Thay đổi vai trò người dùng", user: "nguyenbaohuy", ip: "192.168.1.10", detail: "Thay đổi vai trò của user_id: 15 thành Editor" },
  { time: "09/07/2026 14:29:47", level: "info", action: "Cập nhật thông tin người dùng", user: "nguyenbaohuy", ip: "192.168.1.10", detail: "Cập nhật thông tin user_id: 12" },
  { time: "09/07/2026 14:28:33", level: "error", action: "Lỗi kết nối database", user: "system", ip: "192.168.1.15", detail: "Không thể kết nối đến database chính" },
  { time: "09/07/2026 14:27:19", level: "info", action: "Sao lưu database", user: "system", ip: "192.168.1.15", detail: "Backup database thành công: backup_20260709_142719.sql" },
  { time: "09/07/2026 14:25:08", level: "warning", action: "Đăng nhập thất bại", user: "unknown", ip: "192.168.1.99", detail: "Sai mật khẩu 5 lần liên tiếp" },
  { time: "09/07/2026 14:24:36", level: "info", action: "Webhook endpoint được gọi", user: "system", ip: "192.168.1.20", detail: "POST /webhook/chat - Status: 200" },
  { time: "09/07/2026 14:23:11", level: "info", action: "Cập nhật cấu hình hệ thống", user: "nguyenbaohuy", ip: "192.168.1.10", detail: "Cập nhật cấu hình thông báo email" },
  { time: "09/07/2026 14:21:54", level: "error", action: "Lỗi gửi email", user: "system", ip: "192.168.1.15", detail: "Không gửi được email đến user: test@example.com" },
  { time: "09/07/2026 13:58:02", level: "info", action: "Đăng nhập thành công", user: "tranthib", ip: "192.168.1.22", detail: "Đăng nhập vào hệ thống từ Safari trên macOS" },
  { time: "09/07/2026 13:47:15", level: "warning", action: "Khóa tài khoản người dùng", user: "nguyenbaohuy", ip: "192.168.1.10", detail: "Khóa tài khoản user_id: 31 do vi phạm điều khoản" },
  { time: "09/07/2026 13:30:44", level: "info", action: "Tạo suất chiếu mới", user: "manager_vien", ip: "192.168.1.30", detail: "Tạo suất chiếu phim 'Lầu Chú Hỏa' - Phòng 1 - 19:45" },
  { time: "09/07/2026 13:12:09", level: "error", action: "Lỗi xử lý thanh toán", user: "system", ip: "192.168.1.15", detail: "Timeout khi gọi cổng thanh toán VNPAY - Mã GD: 88231" },
  { time: "09/07/2026 12:55:37", level: "info", action: "Xuất báo cáo doanh thu", user: "nguyenbaohuy", ip: "192.168.1.10", detail: "Xuất file CSV báo cáo doanh thu tháng 06/2026" },
  { time: "09/07/2026 12:40:21", level: "warning", action: "Dung lượng ổ đĩa thấp", user: "system", ip: "192.168.1.15", detail: "Ổ đĩa lưu trữ log còn lại dưới 15% dung lượng" },
  { time: "09/07/2026 12:20:03", level: "info", action: "Đăng xuất", user: "tranthib", ip: "192.168.1.22", detail: "Người dùng đăng xuất khỏi hệ thống" },
  { time: "09/07/2026 11:58:59", level: "info", action: "Cập nhật giá vé", user: "manager_vien", ip: "192.168.1.30", detail: "Cập nhật giá vé phòng IMAX: 120.000đ → 130.000đ" },
  { time: "09/07/2026 11:33:12", level: "error", action: "Lỗi đồng bộ ghế ngồi", user: "system", ip: "192.168.1.15", detail: "Xung đột dữ liệu ghế tại suất chiếu #4521" },
  { time: "09/07/2026 11:10:48", level: "info", action: "Thêm phim mới", user: "manager_vien", ip: "192.168.1.30", detail: "Thêm phim mới: 'Cô bé PONYO'" },
  { time: "09/07/2026 10:47:26", level: "warning", action: "Nhiều lần thử đặt vé thất bại", user: "khachhang02", ip: "192.168.1.88", detail: "Thử đặt vé thất bại 4 lần do hết ghế" },
  { time: "09/07/2026 10:22:14", level: "info", action: "Cập nhật kho F&B", user: "manager_vien", ip: "192.168.1.30", detail: "Nhập thêm 100 ly bắp rang bơ vào kho" },
  { time: "09/07/2026 10:05:37", level: "info", action: "Đăng nhập thành công", user: "nguyenbaohuy", ip: "192.168.1.10", detail: "Đăng nhập vào hệ thống từ Chrome trên Windows" },
  { time: "09/07/2026 09:48:03", level: "error", action: "Lỗi kết nối API bên thứ ba", user: "system", ip: "192.168.1.15", detail: "Không thể kết nối tới dịch vụ gửi SMS OTP" },
  { time: "09/07/2026 09:30:51", level: "info", action: "Tạo khuyến mãi mới", user: "manager_vien", ip: "192.168.1.30", detail: "Tạo mã khuyến mãi: CINE20 - Giảm 20%" },
  { time: "08/07/2026 22:14:09", level: "info", action: "Sao lưu database", user: "system", ip: "192.168.1.15", detail: "Backup database thành công: backup_20260708_221409.sql" },
  { time: "08/07/2026 21:50:33", level: "warning", action: "Phát hiện đăng nhập lạ", user: "system", ip: "203.113.65.2", detail: "Đăng nhập từ địa chỉ IP nước ngoài chưa từng ghi nhận" },
  { time: "08/07/2026 20:37:41", level: "info", action: "Cập nhật thông tin người dùng", user: "khachhang05", ip: "192.168.1.91", detail: "Cập nhật số điện thoại liên hệ" },
  { time: "08/07/2026 19:59:12", level: "error", action: "Lỗi gửi vé điện tử", user: "system", ip: "192.168.1.15", detail: "Không gửi được vé điện tử qua email cho đơn #99213" },
  { time: "08/07/2026 19:20:05", level: "info", action: "Tạo suất chiếu mới", user: "manager_vien", ip: "192.168.1.30", detail: "Tạo suất chiếu phim 'Deadpool & Wolverine' - Phòng 1 - 20:00" },
  { time: "08/07/2026 18:44:38", level: "info", action: "Đăng nhập thành công", user: "tranthib", ip: "192.168.1.22", detail: "Đăng nhập vào hệ thống từ Safari trên macOS" },
  { time: "08/07/2026 18:02:57", level: "warning", action: "Thay đổi vai trò người dùng", user: "nguyenbaohuy", ip: "192.168.1.10", detail: "Thay đổi vai trò của user_id: 8 thành Manager" },
  { time: "08/07/2026 17:31:20", level: "info", action: "Xuất báo cáo doanh thu", user: "nguyenbaohuy", ip: "192.168.1.10", detail: "Xuất file CSV báo cáo doanh thu tuần 27/2026" },
  { time: "08/07/2026 16:48:16", level: "error", action: "Lỗi kết nối database", user: "system", ip: "192.168.1.15", detail: "Mất kết nối tạm thời đến database chính trong 45 giây" },
  { time: "08/07/2026 16:10:44", level: "info", action: "Webhook endpoint được gọi", user: "system", ip: "192.168.1.20", detail: "POST /webhook/booking - Status: 200" },
  { time: "08/07/2026 15:22:07", level: "info", action: "Đăng xuất", user: "manager_vien", ip: "192.168.1.30", detail: "Người dùng đăng xuất khỏi hệ thống" },
  { time: "08/07/2026 14:59:31", level: "warning", action: "Đăng nhập thất bại", user: "unknown", ip: "192.168.1.77", detail: "Sai mật khẩu 3 lần liên tiếp" },
  { time: "08/07/2026 14:20:19", level: "info", action: "Tạo tài khoản người dùng", user: "nguyenbaohuy", ip: "192.168.1.10", detail: "Tạo tài khoản mới: lehoang.c@example.com" },
  { time: "08/07/2026 13:45:52", level: "info", action: "Cập nhật cấu hình hệ thống", user: "nguyenbaohuy", ip: "192.168.1.10", detail: "Bật chế độ bảo trì tạm thời cho module thanh toán" },
  { time: "08/07/2026 13:08:03", level: "error", action: "Lỗi xử lý thanh toán", user: "system", ip: "192.168.1.15", detail: "Giao dịch bị từ chối bởi ngân hàng phát hành thẻ" },
];

// Danh sách hành động (dùng để đổ vào dropdown "Tất cả hành động")
const ADM_SYSLOG_ACTIONS = [...new Set(ADM_SYSLOG_DATA.map((l) => l.action))].sort();

// Trạng thái phân trang hiện tại
let admSyslogCurrentPage = 1;
let admSyslogPageSize = 10;

/* --- 2. HÀM TIỆN ÍCH --- */

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
        <div class="ad-metric-icon" style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.14); color:#fff;">${m.icon}</div>
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
            <span title="Xem chi tiết" style="cursor:pointer; margin-left:8px; opacity:0.8;" onclick="viewAdminSysLogDetail(${globalIdx})"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg></span>
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
  alert(
    `Chi tiết log\n\nThời gian: ${item.time}\nMức độ: ${ADM_SYSLOG_LEVEL_LABEL[item.level]}\nHành động: ${item.action}\nUser: ${item.user}\nIP: ${item.ip}\n\n${item.detail}`,
  );
}

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