// ==========================================================================
// MÃ NGUỒN XỬ LÝ GIAO DIỆN QUẢN TRỊ VIÊN (ADMIN)
// File: js/admin.js
// ==========================================================================


function switchAdminTab(tabName) {
  document
    .querySelectorAll(".admin-nav-item")
    .forEach((item) => item.classList.remove("active"));

  const activeNav = document.getElementById("nav-admin-" + tabName);
  if (activeNav) activeNav.classList.add("active");

  document
    .querySelectorAll(".admin-tab-section")
    .forEach((section) => (section.style.display = "none"));

  const activeTab = document.getElementById("admin-tab-" + tabName);
  if (activeTab) activeTab.style.display = "block";

  // Gọi hàm load dữ liệu tương ứng khi chuyển tab
  if (tabName === "dashboard") renderAdminDashboard();
  if (tabName === "ban") renderAdminBanList();
  if (tabName === "syslog") renderAdminSysLogPage();
  if (tabName === "webhook") renderAdminWebhookPage();
  if (tabName === "db") renderAdminDbBackups();
}

let _admBanUsersCache = [];

// Dữ liệu mẫu - CHỈ dùng để xem trước giao diện khi API chưa sẵn sàng
// hoặc chưa có tài khoản nào trong DB. Khi API thật trả về dữ liệu, phần này sẽ không được dùng.
const ADM_BAN_MOCK_USERS = [
  { accountId: "USR-001", email: "hoang.nguyen@las.vn", roleId: 1, status: "Active" },
  { accountId: "USR-002", email: "nhanvien1@las.vn", roleId: 3, status: "Active" },
  { accountId: "USR-003", email: "khachhang_scam@gmail.com", roleId: 3, status: "Banned" },
  { accountId: "USR-004", email: "tranthi.b@las.vn", roleId: 3, status: "Active" },
  { accountId: "USR-005", email: "admin2@las.vn", roleId: 2, status: "Active" },
];

function renderAdminBanList() {
  const tbody = document.getElementById("admin-ban-tbody");
  API.getAdminUsers()
    .then((users) => {
      _admBanUsersCache = (users && users.length) ? users : ADM_BAN_MOCK_USERS;
      renderAdminBanRows(_admBanUsersCache, !users || !users.length);
    })
    .catch(() => {
      _admBanUsersCache = ADM_BAN_MOCK_USERS;
      renderAdminBanRows(_admBanUsersCache, true);
    });
}

function renderAdminBanRows(users, isMock) {
  const tbody = document.getElementById("admin-ban-tbody");
  if (!users.length) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--adm-muted); padding:24px;">Không tìm thấy tài khoản phù hợp.</td></tr>`;
    return;
  }

  const mockNotice = isMock
    ? `<tr><td colspan="5" style="text-align:center; color:var(--adm-gold); background:rgba(229,169,59,0.08); padding:10px; font-size:12px; font-style:italic;">
         ⚠ Đang hiển thị DỮ LIỆU MẪU (chưa kết nối được API /admin/users) - chỉ để xem trước giao diện.
       </td></tr>`
    : "";

  tbody.innerHTML = mockNotice + users.map((u) => {
      const status = u.status || "Active";
      const badge = status === "Active"
          ? '<span class="status-badge">Hoạt động</span>'
          : '<span class="status-badge" style="background:#e71a0f;">Bị khóa</span>';

      return `<tr>
          <td>${u.accountId}</td>
          <td>${u.email}</td>
          <td>
            <select onchange="changeRoleAction('${u.accountId}', this.value)">
                <option value="2" ${u.roleId === 2 ? 'selected' : ''}>Admin</option>
                <option value="1" ${u.roleId === 1 ? 'selected' : ''}>Manager</option>
                <option value="3" ${u.roleId === 3 ? 'selected' : ''}>Member</option>
            </select>
          </td>
          <td>${badge}</td>
          <td>
            <button class="btn-admin-action ${status === 'Active' ? 'delete' : 'edit'}"
                    onclick="banUserAction('${u.accountId}')">
                ${status === 'Active' ? 'Khóa (Ban)' : 'Mở (Unban)'}
            </button>
          </td>
      </tr>`;
    }).join("");
}

function filterAdminBanList() {
  const keyword = (document.getElementById("adm-ban-search").value || "").trim().toLowerCase();
  const statusFilter = document.getElementById("adm-ban-status-filter").value;

  const filtered = _admBanUsersCache.filter((u) => {
    const status = u.status || "Active";
    const matchStatus = !statusFilter || status === statusFilter;
    const matchKeyword = !keyword ||
      String(u.accountId).toLowerCase().includes(keyword) ||
      (u.email || "").toLowerCase().includes(keyword);
    return matchStatus && matchKeyword;
  });

  renderAdminBanRows(filtered);
}

// Hàm xử lý sự kiện
function changeRoleAction(userId, roleId) {
    API.updateUserRole(userId, parseInt(roleId))
        .then(() => { alert("Đã đổi quyền!"); renderAdminBanList(); })
        .catch(err => alert(err.message));
}



// (Tuỳ chọn) Hàm hỗ trợ khi Admin bấm nút Khóa tài khoản
function banUserAction(userId) {
  if (confirm(`Bạn có chắc chắn muốn khóa tài khoản ID: ${userId}?`)) {
    if (typeof API !== "undefined" && API.banUser) {
      API.banUser(userId)
        .then((res) => {
          alert("Đã khóa tài khoản thành công!");
          renderAdminBanList(); // Tải lại bảng
        })
        .catch((err) => alert("Lỗi khi khóa: " + err.message));
    }
  }
}

// ---------------------------------------------------------
// CÁC HÀM DƯỚI ĐÂY TẠM THỜI DÙNG DỮ LIỆU MẪU (HARD-CODE)
// Sau này em viết API xong thì thay bằng API.get...() nhé!
// ---------------------------------------------------------

// Hàm renderAdminSysLog cũ (gọi API.getSysLogs()) đã được thay thế bằng
// renderAdminSysLogPage() trong file js/admin-syslog.js — dùng dữ liệu tĩnh
// theo đúng yêu cầu giao diện tham khảo (LumiAI). Khi Back-end có API logs
// thật, xem ghi chú đầu file js/admin-syslog.js để nối lại dữ liệu.


// Hàm renderAdminWebhook cũ (gọi API.getWebhooks()) đã được thay thế bằng
// renderAdminWebhookPage() trong file js/admin-webhook.js — dùng dữ liệu tĩnh
// theo đúng yêu cầu giao diện tham khảo (LumiAI).

const ADM_DB_MOCK_BACKUPS = [
  { ver: "LAS_DB_v1.0.2", date: "19/06/2026 23:59", size: "145.2 MB", type: "Tự động" },
  { ver: "LAS_DB_v1.0.1", date: "18/06/2026 15:30", size: "144.8 MB", type: "Thủ công" },
];

function renderAdminDbBackups() {
  const tbody = document.getElementById("admin-db-tbody");
  if (!tbody || typeof API === "undefined") return;

  API.getDbBackups()
    .then((backups) => {
      renderAdminDbRows((backups && backups.length) ? backups : ADM_DB_MOCK_BACKUPS, !backups || !backups.length);
    })
    .catch((err) => {
      console.error("🚨 Lỗi tải Backups:", err);
      renderAdminDbRows(ADM_DB_MOCK_BACKUPS, true);
    });
}

function renderAdminDbRows(backups, isMock) {
  const tbody = document.getElementById("admin-db-tbody");
  const mockNotice = isMock
    ? `<tr><td colspan="5" style="text-align:center; color:var(--adm-gold); background:rgba(229,169,59,0.08); padding:10px; font-size:12px; font-style:italic;">
         ⚠ Đang hiển thị DỮ LIỆU MẪU (chưa kết nối được API backups) - chỉ để xem trước giao diện.
       </td></tr>`
    : "";

  tbody.innerHTML = mockNotice + backups
    .map(
      (b) =>
        `<tr><td><b>${b.ver}</b></td><td>${b.date}</td><td>${b.size}</td><td>${b.type}</td><td><button class="btn-admin-action edit" onclick="restoreBackupAction('${b.ver}')">Phục hồi (Restore)</button></td></tr>`,
    )
    .join("");
}

function restoreBackupAction(ver) {
  if (confirm(`Bạn có chắc chắn muốn phục hồi cơ sở dữ liệu về bản "${ver}"? Dữ liệu hiện tại có thể bị ghi đè.`)) {
    if (typeof API !== "undefined" && API.restoreBackup) {
      API.restoreBackup(ver)
        .then(() => { alert("Phục hồi thành công!"); renderAdminDbBackups(); })
        .catch((err) => alert("Lỗi khi phục hồi: " + err.message));
    } else {
      alert("Chức năng phục hồi chưa được kết nối API thật (đang ở chế độ xem trước giao diện).");
    }
  }
}

function createManualBackupAction() {
  if (typeof API !== "undefined" && API.createBackup) {
    API.createBackup()
      .then(() => { alert("Đã tạo bản sao lưu thủ công!"); renderAdminDbBackups(); })
      .catch((err) => alert("Lỗi khi tạo bản sao lưu: " + err.message));
  } else {
    alert("Chức năng tạo bản sao lưu chưa được kết nối API thật (đang ở chế độ xem trước giao diện).");
  }
}