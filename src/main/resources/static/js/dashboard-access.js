/* ==========================================================================
   TRUY CẬP DASHBOARD (chỉ dành cho MANAGER=1 và ADMIN=4)
   --------------------------------------------------------------------------
   - Hiện tab "TRUY CẬP DASHBOARD" trong "Tài khoản LAS" chỉ khi tài khoản
     đăng nhập có role_id = 1 (MANAGER) hoặc 4 (ADMIN).
   - Bấm tab -> popup Xác nhận / Hủy. Chỉ khi Xác nhận mới sang manager.html.
   - File nạp SAU CÙNG, không phụ thuộc vào các hàm login trùng lặp.
   ========================================================================== */
(function () {
  "use strict";

  var DASHBOARD_ROLES = [1, 4]; // 1 = MANAGER, 4 = ADMIN

  function getCurrentRoleId() {
    // Ưu tiên đọc từ dữ liệu người dùng đã đăng nhập (localStorage)
    try {
      var raw = localStorage.getItem("las_logged_in_user");
      if (raw) {
        var u = JSON.parse(raw);
        var r = u.roleId != null ? u.roleId
              : u.role_id != null ? u.role_id
              : u.role && u.role.roleId != null ? u.role.roleId
              : u.role && u.role.role_id != null ? u.role.role_id
              : null;
        if (r != null) return parseInt(r, 10);
      }
    } catch (e) {}
    // Dự phòng: đọc từ sessionStorage
    var sr = sessionStorage.getItem("roleId");
    if (sr != null && sr !== "") return parseInt(sr, 10);
    return null;
  }

  // Hiện/ẩn tab Dashboard theo quyền + cập nhật nhãn vai trò
  window.refreshDashboardTab = function () {
    var btn = document.getElementById("pro-subtab-btn-dashboard");
    if (!btn) return;
    var roleId = getCurrentRoleId();
    var allowed = DASHBOARD_ROLES.indexOf(roleId) !== -1;
    btn.style.display = allowed ? "" : "none";

    // Cập nhật nhãn vai trò trên thẻ hồ sơ cho đúng
    var star = document.getElementById("profile-star-role");
    if (star) {
      if (roleId === 1) star.innerText = "MANAGER";
      else if (roleId === 4) star.innerText = "ADMIN";
      else if (roleId === 2) star.innerText = "STAFF";
      else star.innerText = "MEMBER";
    }
  };

  // Mở popup xác nhận (chặn nếu không đủ quyền)
  window.openDashboardConfirm = function () {
    var roleId = getCurrentRoleId();
    if (DASHBOARD_ROLES.indexOf(roleId) === -1) {
      alert("Tài khoản của bạn không có quyền truy cập trang Quản trị.");
      return;
    }
    var modal = document.getElementById("dashboard-confirm-modal");
    if (modal) modal.classList.add("open");
  };

  window.closeDashboardConfirm = function () {
    var modal = document.getElementById("dashboard-confirm-modal");
    if (modal) modal.classList.remove("open");
  };

  // Chỉ khi Xác nhận mới chuyển sang trang Quản trị (theo đúng vai trò)
  window.confirmGoDashboard = function () {
    var roleId = getCurrentRoleId();
    if (DASHBOARD_ROLES.indexOf(roleId) === -1) {
      alert("Tài khoản của bạn không có quyền truy cập trang Quản trị.");
      window.closeDashboardConfirm();
      return;
    }
    // ADMIN (4) -> Admin Portal | MANAGER (1) -> Manager Dashboard
    if (roleId === 4) {
      window.location.href = "admin.html";
    } else {
      window.location.href = "manager.html";
    }
  };

  // ==========================================================================
  // 🖥️ TAB "MÁY POS" (chỉ dành cho STAFF = 2)
  // - Staff bình thường được auto-chuyển sang staff.html ngay lúc đăng nhập
  //   (xem auth.js), nút này chỉ để Staff quay lại Máy POS thủ công nếu lỡ
  //   điều hướng sang trang khác.
  // ==========================================================================
  var POS_ROLES = [2]; // 2 = STAFF

  window.refreshPosTab = function () {
    var btn = document.getElementById("pro-subtab-btn-pos");
    if (!btn) return;
    var roleId = getCurrentRoleId();
    btn.style.display = POS_ROLES.indexOf(roleId) !== -1 ? "" : "none";
  };

  window.openPosConfirm = function () {
    var roleId = getCurrentRoleId();
    if (POS_ROLES.indexOf(roleId) === -1) {
      alert("Tài khoản của bạn không có quyền truy cập Máy POS.");
      return;
    }
    var modal = document.getElementById("pos-confirm-modal");
    if (modal) modal.classList.add("open");
  };

  window.closePosConfirm = function () {
    var modal = document.getElementById("pos-confirm-modal");
    if (modal) modal.classList.remove("open");
  };

  window.confirmGoPos = function () {
    var roleId = getCurrentRoleId();
    if (POS_ROLES.indexOf(roleId) === -1) {
      alert("Tài khoản của bạn không có quyền truy cập Máy POS.");
      window.closePosConfirm();
      return;
    }
    window.location.href = "staff.html";
  };

  // Khi tải trang (kể cả khi khôi phục phiên đăng nhập cũ), cập nhật tab
  function init() {
    window.refreshDashboardTab();
    window.refreshPosTab();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      // đợi một chút để syncUserLoginSession khôi phục xong (nếu có)
      setTimeout(init, 250);
    });
  } else {
    setTimeout(init, 250);
  }
})();