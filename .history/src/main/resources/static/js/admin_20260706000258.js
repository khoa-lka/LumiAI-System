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
  if (tabName === "ban") renderAdminBanList();
  if (tabName === "syslog") renderAdminSysLog();
  if (tabName === "faq") renderAdminFaq();
  if (tabName === "webhook") renderAdminWebhook();
  if (tabName === "db") renderAdminDbBackups();
}

function renderAdminBanList() {
  const tbody = document.getElementById("admin-ban-tbody");
  if (!tbody) return;

  // SỬ DỤNG api.js ĐỂ GỌI DỮ LIỆU TỪ SPRING BOOT
  if (typeof API !== "undefined" && API.getAdminUsers) {
    API.getAdminUsers()
      .then((users) => {
        tbody.innerHTML = users
          .map((u) => {
            const badge =
              u.status === "Active"
                ? '<span class="status-badge status-now">Hoạt động</span>'
                : '<span class="status-badge" style="background:#e71a0f;">Bị khóa</span>';

            const action =
              u.status === "Active"
                ? `<button class="btn-admin-action delete" onclick="banUserAction('${u.id}')">Khóa (Ban)</button>`
                : `<button class="btn-admin-action edit">Mở (Unban)</button>`;

            return `<tr><td>${u.id}</td><td><b>${u.email}</b></td><td>${u.role}</td><td>${badge}</td><td>${action}</td></tr>`;
          })
          .join("");
      })
      .catch((err) => console.error("Lỗi lấy danh sách User: ", err));
  } else {
    console.warn("Chưa tìm thấy api.js. Đang dùng giao diện trống.");
  }
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

function renderAdminSysLog() {
  const tbody = document.getElementById("admin-syslog-tbody");
  if (!tbody || typeof API === "undefined") return;

  API.getSysLogs()
    .then((logs) => {
      // logs là mảng dữ liệu lấy từ Database
      tbody.innerHTML = logs
        .map(
          (l) =>
            `<tr><td>${l.time}</td><td>${l.action}</td><td>${l.user}</td><td>${l.status}</td></tr>`,
        )
        .join("");
    })
    .catch((err) => console.error("🚨 Lỗi tải SysLog:", err));
}

function renderAdminFaq() {
  const tbody = document.getElementById("admin-faq-tbody");
  if (!tbody || typeof API === "undefined") return;

  API.getFaqs()
    .then((faqs) => {
      tbody.innerHTML = faqs
        .map(
          (f) =>
            `<tr><td><b>${f.q}</b></td><td>${f.a}</td><td><button class="btn-admin-action edit">Sửa</button><button class="btn-admin-action delete">Xóa</button></td></tr>`,
        )
        .join("");
    })
    .catch((err) => console.error("🚨 Lỗi tải FAQ:", err));
}

function renderAdminWebhook() {
  const tbody = document.getElementById("admin-webhook-tbody");
  if (!tbody || typeof API === "undefined") return;

  API.getWebhooks()
    .then((hooks) => {
      tbody.innerHTML = hooks
        .map(
          (h) =>
            `<tr><td>${h.time}</td><td><b>${h.source}</b></td><td style="font-family:monospace; color:#c4c4cc;">${h.payload}</td><td>${h.http}</td></tr>`,
        )
        .join("");
    })
    .catch((err) => console.error("🚨 Lỗi tải Webhook:", err));
}

function renderAdminDbBackups() {
  const tbody = document.getElementById("admin-db-tbody");
  if (!tbody || typeof API === "undefined") return;

  API.getDbBackups()
    .then((backups) => {
      tbody.innerHTML = backups
        .map(
          (b) =>
            `<tr><td><b>${b.ver}</b></td><td>${b.date}</td><td>${b.size}</td><td>${b.type}</td><td><button class="btn-admin-action edit">Phục hồi (Restore)</button></td></tr>`,
        )
        .join("");
    })
    .catch((err) => console.error("🚨 Lỗi tải Backups:", err));
}