// js/auth.js

// --- 1. QUẢN LÝ MODAL ---
// Tìm hàm openAuthModal() ở đầu file auth.js và sửa thành:
function openAuthModal() {
  document.getElementById("auth-modal").classList.add("open");

  // 🚀 ĐÃ SỬA: Chủ động gọi trực tiếp hàm sinh mã ngay khi mở Modal
  if (typeof generateNewLoginCaptcha === "function") generateNewLoginCaptcha();
  if (typeof generateNewRegisterCaptcha === "function")
    generateNewRegisterCaptcha();
}
function closeAuthModal() {
  document.getElementById("auth-modal").classList.remove("open");
}

function toggleAuthTab(type) {
  document.getElementById("tab-login-btn").classList.remove("active");
  document.getElementById("tab-register-btn").classList.remove("active");
  document.getElementById("form-login-panel").classList.remove("active");
  document.getElementById("form-register-panel").classList.remove("active");

  if (type === "login") {
    document.getElementById("tab-login-btn").classList.add("active");
    document.getElementById("form-login-panel").classList.add("active");
  } else if (type === "register") {
    document.getElementById("tab-register-btn").classList.add("active");
    document.getElementById("form-register-panel").classList.add("active");
  }
}

// --- 2. XÁC THỰC NGƯỜI DÙNG ---
function submitCgvLogin(event) {
  if (event) event.preventDefault();
  const user = document.getElementById("auth-username").value.trim();
  const pass = document.getElementById("auth-password").value;
  const captchaInput = document.getElementById("login-captcha").value.trim();
  const currentLoginCaptcha =
    document.getElementById("login-captcha-text").innerText;

  if (!user || !pass)
    return alert("Vui lòng nhập đầy đủ tài khoản và mật khẩu!");
  if (captchaInput.toUpperCase() !== currentLoginCaptcha.toUpperCase()) {
    return alert("Mã bảo vệ Captcha không chính xác!");
  }

  // 🚀 SỬ DỤNG api.js THAY VÌ FETCH THÔ
  API.login({ identifier: user, password: pass })
    .then((resData) => {
      if (resData.status === "success") {
        isUserLoggedInState = true;
        let uData = resData.data;
        localStorage.setItem("las_logged_in_user", JSON.stringify(uData));
        sessionStorage.removeItem("pendingBooking");
        localStorage.setItem(
          "las_user_invoices",
          JSON.stringify(userPastInvoices || []),
        );

        console.log("Saved:", localStorage.getItem("las_logged_in_user"));

        // 1. Lưu thông tin đăng nhập vào bộ nhớ trình duyệt
        sessionStorage.setItem("isLoggedIn", "true");
        sessionStorage.setItem("accountId", uData.accountId);
        sessionStorage.setItem("fullName", uData.fullName);
        sessionStorage.setItem("roleId", uData.roleId);
        window.currentLoggedInId = uData.accountId;

        // 2. KIỂM TRA QUYỀN VÀ ĐIỀU HƯỚNG
        if (uData.roleId === 4 || uData.roleId === 1) {
          // Nếu là Manager (4) hoặc Admin (1) -> Chuyển sang trang Quản trị
          alert(
            `Xin chào Quản lý: ${uData.fullName}. Đang chuyển hướng đến Portal...`,
          );
          window.location.href = "manager.html";
          return;
        }
        else if (uData.roleId === 2) {
          alert(
            `Xin chào Admin: ${uData.fullName}. Đang chuyển hướng đến Portal...`,
          );
          window.location.href = "admin.html";
          return;
        }
         else if (  uData.roleId === 3) {
          // Nếu là Khách hàng (Member) -> Ở lại trang chủ và cập nhật giao diện
          alert(
            `Chào mừng thành viên: ${uData.fullName} đăng nhập thành công!`,
          );
          closeAuthModal();

          const authLinkBox = document.getElementById("top-bar-auth-link");
          authLinkBox.onclick = () => switchCgvTab("panel-profile");
          authLinkBox.style.cursor = "pointer";
          authLinkBox.innerHTML = `
              <span class="sub-nav-icon">👤</span> XIN CHÀO, ${uData.fullName.toUpperCase()}! 
              <span onclick="confirmLogoutAction(event)" style="color: #0066cc; margin-left: 8px; cursor: pointer; text-decoration: underline; font-weight: bold;">THOÁT</span>
          `;
          document.getElementById("top-bar-ticket-link").innerHTML =
            `<span class="sub-nav-icon">🎬</span> LỊCH SỬ GIAO DỊCH`;

          let roleString = "Khách hàng thành viên";
          if (uData.roleId === 2) roleString = "Admin";
          if (uData.roleId === 4) roleString = "Nhân viên cụm rạp (STAFF)";

          if (document.getElementById("profile-summary-avatar")) {
            document.getElementById("profile-summary-avatar").innerText =
              uData.fullName.split(" ").pop().substring(0, 2).toUpperCase();
          }

          const welcomeNameBox = document.getElementById(
            "profile-welcome-name",
          );
          if (welcomeNameBox)
            welcomeNameBox.innerText = `Xin chào ${uData.fullName},`;

          const starRoleBox = document.getElementById("profile-star-role");
          if (starRoleBox) starRoleBox.innerText = "MEMBER";

          document.getElementById("profile-field-name").value = uData.fullName;
          document.getElementById("profile-field-phone").value =
            uData.phoneNumber;
          document.getElementById("profile-field-email").value = uData.email;

          if (document.getElementById("profile-field-role")) {
            document.getElementById("profile-field-role").value = roleString;
          }

          // ==========================================================================
          // 🚀 ĐOẠN ĐÃ SỬA ĐÈ: Ép nạp nóng dữ liệu thật từ DB lên 3 ô select dropdown
          // trước khi thực hiện chuyển tab để triệt tiêu trạng thái hiển thị mặc định 2026
          // ==========================================================================
          if (uData.dateOfBirth) {
            const [year, month, day] = uData.dateOfBirth.split("-");
            if (document.getElementById("profile-birth-day"))
              document.getElementById("profile-birth-day").value =
                parseInt(day);
            if (document.getElementById("profile-birth-month"))
              document.getElementById("profile-birth-month").value =
                parseInt(month);
            if (document.getElementById("profile-birth-year"))
              document.getElementById("profile-birth-year").value =
                parseInt(year);

            // Đồng bộ luôn ô input text bọc lót nếu giao diện của team có dùng
            if (document.getElementById("profile-field-birth")) {
              document.getElementById("profile-field-birth").value =
                `${day}/${month}/${year}`;
            }
          }

          // Nhảy sang tab Profile của khách hàng an toàn
          switchCgvTab("panel-profile");
        }
      } else {
        alert("Đăng nhập thất bại: " + resData.message);
      }
    })
    .catch((err) => alert("🚨 Lỗi đăng nhập: " + err.message));
}

function submitCgvRegister(event) {
  if (event) event.preventDefault();
  const name = document.getElementById("reg-name").value.trim();
  const phone = document.getElementById("reg-phone").value.trim();
  const email = document.getElementById("reg-email").value.trim();
  const password = document.getElementById("reg-password").value;
  const captchaInput = document.getElementById("reg-captcha").value.trim();
  const currentRegCaptcha =
    document.getElementById("reg-captcha-text").innerText;

  const birthDay = document.getElementById("reg-birth-day").value;
  const birthMonth = document.getElementById("reg-birth-month").value;
  const birthYear = document.getElementById("reg-birth-year").value;

  if (
    !name ||
    !phone ||
    !email ||
    !password ||
    !birthDay ||
    !birthMonth ||
    !birthYear
  ) {
    return alert("Vui lòng điền đầy đủ thông tin và chọn ngày sinh!");
  }
  if (captchaInput.toUpperCase() !== currentRegCaptcha.toUpperCase()) {
    return alert("Mã xác thực Captcha đăng ký không khớp!");
  }

  // 🚀 SỬ DỤNG api.js THAY VÌ FETCH THÔ
  API.register({
    name: name,
    phone: phone,
    email: email,
    password: password,
    birthDay: birthDay,
    birthMonth: birthMonth,
    birthYear: birthYear,
  })
    .then((resData) => {
      if (resData.status === "success") {
        alert(
          resData.message +
            "\nHãy kiểm tra màn hình Console của Spring Boot để lấy mã OTP nhé!",
        );
        temporaryRegisterEmail = resData.email;
        closeAuthModal();
        openOtpModal();
      } else {
        alert("Đăng ký thất bại: " + resData.message);
      }
    })
    .catch((err) => alert("🚨 Lỗi đăng ký: " + err.message));
}

function submitOtpVerification() {
  const otpInput = document.getElementById("otp-input-field").value.trim();

  if (!otpInput) return alert("Vui lòng nhập mã OTP gồm 6 chữ số!");
  if (!temporaryRegisterEmail)
    return alert("Hệ thống không tìm thấy email đăng ký hợp lệ!");

  // 🚀 SỬ DỤNG api.js THAY VÌ FETCH THÔ
  API.verifyOtp({ email: temporaryRegisterEmail, otp: otpInput })
    .then((resData) => {
      if (resData.status === "success") {
        alert(resData.message);
        closeOtpModal();
        openAuthModal();
        toggleAuthTab("login");
      } else {
        alert("Xác thực thất bại: " + resData.message);
      }
    })
    .catch((err) => alert("❌ Lỗi OTP: " + err.message));
}

// --- 3. QUẢN LÝ HỒ SƠ ---
function saveUpdatedProfileInformationData() {
  const newName = document.getElementById("profile-field-name").value.trim();
  const newPhone = document.getElementById("profile-field-phone").value.trim();
  const newEmail = document.getElementById("profile-field-email").value.trim();

  const d = document.getElementById("profile-birth-day").value;
  const m = document.getElementById("profile-birth-month").value;
  const y = document.getElementById("profile-birth-year").value;
  const newBirth = `${y}-${m.toString().padStart(2, "0")}-${d.toString().padStart(2, "0")}`;

  const accountId = window.currentLoggedInId || 2;

  // 🚀 SỬ DỤNG api.js THAY VÌ FETCH THÔ
  API.updateProfile({
    accountId: accountId,
    fullName: newName,
    phone: newPhone,
    email: newEmail,
    dateOfBirth: newBirth,
  })
    .then((resData) => {
      if (resData.status === "success") {
        alert(resData.message);

        document
          .querySelectorAll(".profile-readonly-input")
          .forEach((input) => {
            input.setAttribute("readonly", true);
            input.setAttribute("disabled", true);
            input.style.border = "1px solid #ccc";
            input.style.background = "#f4f2ec";
          });
        document.getElementById("btn-save-profile").style.display = "none";

        // Tra cứu lại thông tin bằng API
        API.getProfile(accountId).then((profileRes) => {
          if (profileRes.status === "success") {
            const updatedData = profileRes.data;
            document.getElementById("profile-welcome-name").innerText =
              `Xin chào ${updatedData.fullName},`;

            const [year, month, day] = updatedData.dateOfBirth.split("-");
            document.getElementById("profile-birth-day").value = parseInt(day);
            document.getElementById("profile-birth-month").value =
              parseInt(month);
            document.getElementById("profile-birth-year").value =
              parseInt(year);

            if (document.getElementById("profile-field-birth")) {
              document.getElementById("profile-field-birth").value =
                `${day}/${month}/${year}`;
            }
          }
        });
      } else {
        alert("❌ Không thể lưu: " + resData.message);
      }
    })
    .catch((err) => alert("🚨 Lỗi kết nối cập nhật hồ sơ: " + err.message));
}

function handleProfileTabAccess() {
  if (!isUserLoggedInState) {
    openAuthModal();
  } else {
    switchCgvTab("panel-profile");
  }
}

function switchProfileSubTab(sub) {
  document
    .querySelectorAll(".arrow-btn")
    .forEach((b) => b.classList.remove("active"));
  ["chung", "chitiet", "matma", "the", "diem", "lichsu"].forEach((p) => {
    const panel = document.getElementById("pro-panel-" + p);
    if (panel) panel.classList.remove("active");
  });
  const currentBtn = document.getElementById("pro-subtab-btn-" + sub);
  const currentPanel = document.getElementById("pro-panel-" + sub);
  if (currentBtn) currentBtn.classList.add("active");
  if (currentPanel) currentPanel.classList.add("active");
}

function activateEditableFormFields() {
  document.querySelectorAll(".profile-readonly-input").forEach((input) => {
    input.removeAttribute("readonly");
    input.removeAttribute("disabled");
    input.style.border = "1px solid var(--cgv-red)";
    input.style.background = "#fff";
  });
  document.getElementById("btn-save-profile").style.display = "block";
}

// --- 4. TIỆN ÍCH KHÁC ---
function confirmLogoutAction(e) {
  if (e) e.stopPropagation();
  if (confirm("Bạn có chắc chắn muốn đăng xuất?")) {
    sessionStorage.clear();
    isUserLoggedInState = false;
    location.reload();
  }
}

function openOtpModal() {
  document.getElementById("otp-modal").classList.add("open");
}
function closeOtpModal() {
  document.getElementById("otp-modal").classList.remove("open");
}

function generateRandomCaptcha(length = 6) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Cập nhật Captcha
// Tìm cụm hàm Captcha ở cuối file auth.js và thay thế toàn bộ bằng đoạn này:
function generateNewLoginCaptcha() {
  const el = document.getElementById("login-captcha-text");
  if (el) {
    el.innerText = generateRandomCaptcha();
  }
}

function generateNewRegisterCaptcha() {
  const el = document.getElementById("reg-captcha-text");
  if (el) {
    el.innerText = generateRandomCaptcha();
  }
}

function generateForgotCaptcha() {
  const el = document.getElementById("forgot-captcha-text");
  if (el) {
    el.innerText = generateRandomCaptcha();
  }
}

// 🚀 ĐÃ THÊM: Ép trình duyệt đưa hàm ra phạm vi window tối cao, dẹp bỏ hoàn toàn lỗi undefined nút bấm
window.generateNewLoginCaptcha = generateNewLoginCaptcha;
window.generateNewRegisterCaptcha = generateNewRegisterCaptcha;
