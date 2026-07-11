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
  if (tabName === "syslog") loadAdminSysLogs();
  if (tabName === "webhook") renderAdminWebhookPage();
  if (tabName === "db") renderAdminDbBackups();
}

let _admBanUsersCache = [];

// Dữ liệu mẫu - CHỈ dùng để xem trước giao diện khi API chưa sẵn sàng
// hoặc chưa có tài khoản nào trong DB. Khi API thật trả về dữ liệu, phần này sẽ không được dùng.


function renderAdminBanList() {
  const tbody = document.getElementById("admin-ban-tbody");
  if (!tbody) return;

  tbody.innerHTML = `
    <tr>
      <td colspan="5"
          style="text-align:center; color:var(--adm-muted); padding:24px;">
        Đang tải danh sách tài khoản...
      </td>
    </tr>
  `;

  API.getAdminUsers()
    .then((users) => {
      _admBanUsersCache = Array.isArray(users) ? users : [];

      // Giữ nguyên hàm render cũ
      renderAdminBanRows(_admBanUsersCache);
    })
    .catch((err) => {
      console.error("Lỗi tải tài khoản:", err);

      _admBanUsersCache = [];

      tbody.innerHTML = `
        <tr>
          <td colspan="5"
              style="text-align:center; color:#ff4742; padding:24px;">
            Không tải được tài khoản từ database:
            ${err.message || "Lỗi kết nối API"}
          </td>
        </tr>
      `;
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
            <select
  data-old-role="${u.roleId}"
  onchange="changeRoleAction(
    '${u.accountId}',
    this.value,
    this.dataset.oldRole,
    this
  )"
>
  <option value="4" ${Number(u.roleId) === 4 ? "selected" : ""}>
    Admin
  </option>

  <option value="1" ${Number(u.roleId) === 1 ? "selected" : ""}>
    Manager
  </option>

  <option value="2" ${Number(u.roleId) === 2 ? "selected" : ""}>
    Staff
  </option>

  <option value="3" ${Number(u.roleId) === 3 ? "selected" : ""}>
    Member
  </option>
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
function changeRoleAction(userId, roleId, oldRoleId, selectElement) {
  const newRoleId = Number(roleId);
  const previousRoleId = Number(oldRoleId);

  if (newRoleId === previousRoleId) {
    return;
  }

  API.updateUserRole(userId, newRoleId)
    .then((result) => {
      showAdminRoleSuccessPopup(
        result.oldRoleName,
        result.newRoleName
      );

      // Ghi nhận role mới để lần thay đổi tiếp theo không dùng role cũ
      if (selectElement) {
        selectElement.dataset.oldRole = String(newRoleId);
      }

      // Tải lại dữ liệu thật từ database
      renderAdminBanList();
    })
    .catch((err) => {
      // API lỗi thì trả select về quyền ban đầu
      if (selectElement) {
        selectElement.value = String(previousRoleId);
      }

      alert("Không thể cập nhật quyền: " + err.message);
    });
}


// (Tuỳ chọn) Hàm hỗ trợ khi Admin bấm nút Khóa tài khoản
let banPopupConfirmCallback = null;

function showBanPopup(type, title, message, onConfirm) {
  const popup = document.getElementById("ban-popup");
  const icon = document.getElementById("ban-popup-icon");
  const titleElement = document.getElementById("ban-popup-title");
  const messageElement = document.getElementById("ban-popup-message");
  const cancelButton = document.getElementById("ban-popup-cancel");
  const confirmButton = document.getElementById("ban-popup-confirm");

  popup.classList.remove("confirm", "success", "error");
  popup.classList.add(type);

  if (type === "success") {
    icon.textContent = "✓";
  } else if (type === "error") {
    icon.textContent = "!";
  } else {
    icon.textContent = "?";
  }

  titleElement.textContent = title;
  messageElement.textContent = message;

  banPopupConfirmCallback =
    typeof onConfirm === "function" ? onConfirm : null;

  if (banPopupConfirmCallback) {
    confirmButton.style.display = "inline-block";
    cancelButton.textContent = "Hủy";
  } else {
    confirmButton.style.display = "none";
    cancelButton.textContent = "Đóng";
  }

  popup.classList.add("open");
}

function closeBanPopup() {
  const popup = document.getElementById("ban-popup");

  if (popup) {
    popup.classList.remove("open");
  }

  banPopupConfirmCallback = null;
}

function confirmBanPopup() {
  const callback = banPopupConfirmCallback;

  closeBanPopup();

  if (callback) {
    callback();
  }
}

function banUserAction(userId) {
  const currentUser = _admBanUsersCache.find(
    (user) => String(user.accountId) === String(userId)
  );

  const isBanned =
    currentUser && currentUser.status === "Banned";

  const actionText = isBanned ? "mở khóa" : "khóa";

  showBanPopup(
    "confirm",
    isBanned ? "XÁC NHẬN MỞ KHÓA" : "XÁC NHẬN KHÓA",
    `Bạn có chắc chắn muốn ${actionText} tài khoản ID: ${userId}?`,
    function () {
      if (
        typeof API === "undefined" ||
        typeof API.banUser !== "function"
      ) {
        showBanPopup(
          "error",
          "KHÔNG THỂ THỰC HIỆN",
          "Chức năng khóa tài khoản chưa được kết nối API."
        );

        return;
      }

     API.banUser(userId)
  .then((result) => {
    const newStatus = result.status;

    const successMessage =
      newStatus === "Banned"
        ? `Đã khóa tài khoản ID: ${userId} thành công.`
        : `Đã mở khóa tài khoản ID: ${userId} thành công.`;

    // Hiện popup thành công giống popup cập nhật role
    showBanPopup(
      "success",
      "CẬP NHẬT THÀNH CÔNG",
      successMessage
    );

    // Lấy lại danh sách để chuyển trạng thái ngay
    renderAdminBanList();
  })
  .catch((error) => {
    showBanPopup(
      "error",
      "CẬP NHẬT THẤT BẠI",
      error.message || "Không thể cập nhật trạng thái tài khoản."
    );
  });
    }
  );
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
function showAdminRoleSuccessPopup(oldRoleName, newRoleName) {
  const popup = document.getElementById("admin-role-success-popup");
  const message = document.getElementById("admin-role-success-message");

  if (message) {
    message.innerHTML = `
      Đã đổi quyền tài khoản từ
      <b>${oldRoleName || "Không xác định"}</b>
      sang
      <b>${newRoleName || "Không xác định"}</b>.
    `;
  }

  if (popup) {
    popup.classList.add("open");
  }
}

function closeAdminRoleSuccessPopup() {
  const popup = document.getElementById("admin-role-success-popup");

  if (popup) {
    popup.classList.remove("open");
  }
}