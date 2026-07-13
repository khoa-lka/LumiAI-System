// js/auth.js
function getAuthFormGuard() {
  if (!window.authFormGuard) {
    window.authFormGuard = {
      registerDirty: false,
      registerSubmitting: false,

      profileEditing: false,
      profileDirty: false,
      profileSubmitting: false,

      lastLeaveAttempt: 0,
    };
  }

  return window.authFormGuard;
}

// Khởi tạo ngay khi file auth.js được load
getAuthFormGuard();
function canLeaveAuthForm(formType) {
  const guard = getAuthFormGuard();
  const isRegister = formType === "register";

  const isSubmitting = isRegister
    ? guard.registerSubmitting
    : guard.profileSubmitting;

  const isEditing = isRegister
    ? guard.registerDirty
    : guard.profileEditing || guard.profileDirty;

  // API đang thực hiện thì không cho rời
  if (isSubmitting) {
    window.showCgvToast(
      isRegister
        ? "Hệ thống đang xử lý đăng ký. Vui lòng chờ hoàn tất!"
        : "Hệ thống đang cập nhật thông tin. Vui lòng chờ hoàn tất!",
      "error",
    );

    return false;
  }

  // Không có thao tác dang dở
  if (!isEditing) {
    return true;
  }

  const now = Date.now();

  // Bấm lần thứ hai trong 3 giây thì cho rời
  if (now - guard.lastLeaveAttempt <= 3000) {
    guard.lastLeaveAttempt = 0;

    if (isRegister) {
      guard.registerDirty = false;
    } else {
      guard.profileEditing = false;
      guard.profileDirty = false;
    }

    return true;
  }

  guard.lastLeaveAttempt = now;

  window.showCgvToast(
    isRegister
      ? "Bạn đang nhập thông tin đăng ký. Bấm lại lần nữa trong 3 giây để rời khỏi!"
      : "Bạn đang chỉnh sửa thông tin. Bấm lại lần nữa trong 3 giây để rời khỏi!",
    "error",
  );

  return false;
}

window.canLeaveAuthForm = canLeaveAuthForm;
// --- 1. QUẢN LÝ MODAL ---
// Tìm hàm openAuthModal() ở đầu file auth.js và sửa thành:
function openAuthModal() {
  document.getElementById("auth-modal").classList.add("open");

  // 🚀 ĐÃ SỬA: Chủ động gọi trực tiếp hàm sinh mã ngay khi mở Modal
  if (typeof generateNewLoginCaptcha === "function") generateNewLoginCaptcha();
  if (typeof generateNewRegisterCaptcha === "function")
    generateNewRegisterCaptcha();
}
function closeAuthModal(forceClose = false) {
  const registerPanel = document.getElementById("form-register-panel");

  const isRegisterActive = registerPanel?.classList.contains("active");

  if (!forceClose && isRegisterActive && !canLeaveAuthForm("register")) {
    return;
  }

  document.getElementById("auth-modal")?.classList.remove("open");
}

function toggleAuthTab(type, forceChange = false) {
  const registerPanel = document.getElementById("form-register-panel");

  const leavingRegister =
    registerPanel?.classList.contains("active") && type !== "register";

  if (!forceChange && leavingRegister && !canLeaveAuthForm("register")) {
    return;
  }
  document.getElementById("tab-login-btn")?.classList.remove("active");
  document.getElementById("tab-register-btn")?.classList.remove("active");
  document.getElementById("form-login-panel").classList.remove("active");
  document.getElementById("form-register-panel").classList.remove("active");

  if (type === "login") {
    document.getElementById("tab-login-btn")?.classList.add("active");
    document.getElementById("form-login-panel").classList.add("active");
  } else if (type === "register") {
    document.getElementById("tab-register-btn")?.classList.add("active");
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
    return window.showCgvToast(
      "Vui lòng nhập đầy đủ tài khoản và mật khẩu!",
      "error",
    );
  if (captchaInput.toUpperCase() !== currentLoginCaptcha.toUpperCase()) {
    return window.showCgvToast("Mã bảo vệ Captcha không chính xác!", "error");
  }

  // 🚀 SỬ DỤNG api.js THAY VÌ FETCH THÔ
  sessionStorage.clear();

  localStorage.removeItem("las_logged_in_user");
  localStorage.removeItem("las_user_invoices");
  localStorage.removeItem("las_current_booking_cache");

  window.currentLoggedInId = null;

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
        const accountId = uData.accountId || uData.account_id;

        sessionStorage.setItem("isLoggedIn", "true");
        sessionStorage.setItem("accountId", String(accountId));
        sessionStorage.setItem("fullName", uData.fullName || "");
        sessionStorage.setItem("roleId", String(uData.roleId));

        window.currentLoggedInId = accountId;
        // STAFF (roleId = 2): đăng nhập xong vào thẳng Máy POS, không cần
        // đi qua giao diện trang chủ như khách hàng/Manager/Admin.
        if (Number(uData.roleId) === 2) {
          closeAuthModal();
          window.showCgvToast(
            `Chào mừng ${uData.fullName}! Đang chuyển sang Máy POS...`,
            "success",
          );
          setTimeout(() => {
            window.location.href = "/staff.html";
          }, 600);
          return;
        }

        // 2. ĐIỀU HƯỚNG: Tất cả vai trò đều vào HOME sau đăng nhập.
        //    Manager(1) và Admin(4) truy cập Dashboard CHỦ ĐỘNG qua tab
        //    "TRUY CẬP DASHBOARD" (Manager -> manager.html, Admin -> admin.html).
        {
          closeAuthModal();
          window.showCgvToast(
            `Chào mừng ${uData.fullName} đăng nhập thành công!`,
            "success",
          );

          setTimeout(() => {
            window.location.reload();
          }, 800);

          const authLinkBox = document.getElementById("top-bar-auth-link");
          authLinkBox.onclick = () => switchCgvTab("panel-profile");
          authLinkBox.style.cursor = "pointer";
          authLinkBox.innerHTML = `
              <span class="sub-nav-icon"></span> XIN CHÀO, ${uData.fullName.toUpperCase()}! 
              <span onclick="handleCgvLogout(event)" style="color: #5b9dff; margin-left: 8px; cursor: pointer; text-decoration: underline; font-weight: bold;">THOÁT</span>
          `;
          document.getElementById("top-bar-ticket-link").innerHTML =
            `<span class="sub-nav-icon"></span> LỊCH SỬ GIAO DỊCH`;

          let roleString = "Khách hàng thành viên";
          if (uData.roleId === 1) roleString = "Quản lý (MANAGER)";
          if (uData.roleId === 2) roleString = "Nhân viên cụm rạp (STAFF)";
          if (uData.roleId === 4) roleString = "Quản trị viên (ADMIN)";

          if (document.getElementById("profile-summary-avatar")) {
            document.getElementById("profile-summary-avatar").innerText =
              uData.fullName.split(" ").pop().substring(0, 2).toUpperCase();
          }

          const welcomeNameBox = document.getElementById(
            "profile-welcome-name",
          );
          if (welcomeNameBox) welcomeNameBox.innerText = uData.fullName;

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

          // Cập nhật hiển thị tab "Truy cập Dashboard" theo quyền
          if (window.refreshDashboardTab) window.refreshDashboardTab();

          // Nhảy sang tab Profile của khách hàng an toàn
          switchCgvTab("panel-profile");
        }
      } else {
        window.showCgvToast("Đăng nhập thất bại: " + resData.message, "error");
      }
    })
    .catch((err) =>
      window.showCgvToast("Lỗi đăng nhập: " + err.message, "error"),
    );
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
  const agreementChecked =
    document.getElementById("reg-agreement")?.checked || false;

  // Kiểm tra họ tên
  if (!name) {
    document.getElementById("reg-name")?.focus();

    return window.showCgvToast("Vui lòng nhập họ và tên!", "error");
  }

  if (!/^[\p{L}\s]+$/u.test(name)) {
    document.getElementById("reg-name")?.focus();

    return window.showCgvToast(
      "Họ tên chỉ được chứa chữ cái và khoảng trắng!",
      "error",
    );
  }

  if (name.length < 2 || name.length > 50) {
    document.getElementById("reg-name")?.focus();

    return window.showCgvToast("Họ tên phải có từ 2 đến 50 ký tự!", "error");
  }

  // Kiểm tra số điện thoại
  if (!phone) {
    document.getElementById("reg-phone")?.focus();

    return window.showCgvToast("Vui lòng nhập số điện thoại!", "error");
  }

  if (!/^0\d{9}$/.test(phone)) {
    document.getElementById("reg-phone")?.focus();

    return window.showCgvToast(
      "Số điện thoại phải gồm 10 chữ số và bắt đầu bằng số 0!",
      "error",
    );
  }

  // Kiểm tra Email
  if (!email) {
    document.getElementById("reg-email")?.focus();

    return window.showCgvToast("Vui lòng nhập địa chỉ Gmail!", "error");
  }

  const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;

  if (!gmailRegex.test(email)) {
    document.getElementById("reg-email")?.focus();

    return window.showCgvToast(
      "Email phải đúng định dạng Gmail, ví dụ: example@gmail.com",
      "error",
    );
  }

  // Kiểm tra mật khẩu
  if (!password) {
    document.getElementById("reg-password")?.focus();

    return window.showCgvToast("Vui lòng nhập mật khẩu!", "error");
  }

  if (password.length < 6 || password.length > 25) {
    document.getElementById("reg-password")?.focus();

    return window.showCgvToast("Mật khẩu phải có từ 6 đến 25 ký tự!", "error");
  }

  // Kiểm tra ngày sinh
  if (!birthDay) {
    document.getElementById("reg-birth-day")?.focus();

    return window.showCgvToast("Vui lòng chọn ngày sinh!", "error");
  }

  if (!birthMonth) {
    document.getElementById("reg-birth-month")?.focus();

    return window.showCgvToast("Vui lòng chọn tháng sinh!", "error");
  }

  if (!birthYear) {
    document.getElementById("reg-birth-year")?.focus();

    return window.showCgvToast("Vui lòng chọn năm sinh!", "error");
  }

  const birthDate = new Date(
    Number(birthYear),
    Number(birthMonth) - 1,
    Number(birthDay),
  );

  const isValidBirthDate =
    birthDate.getFullYear() === Number(birthYear) &&
    birthDate.getMonth() === Number(birthMonth) - 1 &&
    birthDate.getDate() === Number(birthDay);

  if (!agreementChecked) {
    document.getElementById("reg-agreement")?.focus();

    return window.showCgvToast(
      "Bạn phải đồng ý với điều khoản và chính sách trước khi đăng ký!",
      "error",
    );
  }

  if (!isValidBirthDate) {
    return window.showCgvToast("Ngày tháng năm sinh không hợp lệ!", "error");
  }

  const today = new Date();

  if (birthDate > today) {
    return window.showCgvToast(
      "Ngày sinh không được nằm trong tương lai!",
      "error",
    );
  }

  if (captchaInput.toUpperCase() !== currentRegCaptcha.toUpperCase()) {
    return window.showCgvToast(
      "Mã xác thực Captcha đăng ký không khớp!",
      "error",
    );
  }

  window.authFormGuard.registerSubmitting = true;
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
        window.authFormGuard.registerDirty = false;

        window.showCgvToast(resData.message, "success");

        temporaryRegisterEmail = resData.email;

        closeAuthModal(true);
        openOtpModal();
      } else {
        window.showCgvToast("Đăng ký thất bại: " + resData.message, "error");
      }
    })
    .catch((err) => {
      window.showCgvToast("Lỗi đăng ký: " + err.message, "error");
    })
    .finally(() => {
      window.authFormGuard.registerSubmitting = false;
    });
}

function resendRegisterOtp() {
  if (!temporaryRegisterEmail) {
    return window.showCgvToast(
      "Không tìm thấy Email cần gửi lại OTP!",
      "error",
    );
  }

  fetch("/api/register/resend-otp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: temporaryRegisterEmail,
    }),
  })
    .then(async (response) => {
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Không thể gửi lại OTP!");
      }

      return data;
    })
    .then((data) => {
      window.showCgvToast(data.message || "Đã gửi lại OTP mới!", "success");
    })
    .catch((error) => {
      window.showCgvToast("Gửi lại OTP thất bại: " + error.message, "error");
    });
}

window.resendRegisterOtp = resendRegisterOtp;

function submitOtpVerification() {
  const otpInput = document.getElementById("otp-input-field").value.trim();

  if (!otpInput)
    return window.showCgvToast("Vui lòng nhập mã OTP gồm 6 chữ số!", "error");
  if (!temporaryRegisterEmail)
    return window.showCgvToast(
      "Hệ thống không tìm thấy email đăng ký hợp lệ!",
      "error",
    );

  // 🚀 SỬ DỤNG api.js THAY VÌ FETCH THÔ
  API.verifyOtp({ email: temporaryRegisterEmail, otp: otpInput })
    .then((resData) => {
      if (resData.status === "success") {
        window.showCgvToast(resData.message, "success");
        closeOtpModal();
        openAuthModal();
        toggleAuthTab("login");
      } else {
        window.showCgvToast("Xác thực thất bại: " + resData.message, "error");
      }
    })
    .catch((err) => window.showCgvToast("Lỗi OTP: " + err.message, "error"));
}

// --- 3. QUẢN LÝ HỒ SƠ ---
function saveUpdatedProfileInformationData() {
  const newName = document.getElementById("profile-field-name").value.trim();
  const newPhone = document.getElementById("profile-field-phone").value.trim();
  const newEmail = document.getElementById("profile-field-email").value.trim();

  const d = document.getElementById("profile-birth-day").value;
  const m = document.getElementById("profile-birth-month").value;
  const y = document.getElementById("profile-birth-year").value;

  // ===== VALIDATION GIỐNG ĐĂNG KÝ =====
  if (!newName || !newPhone || !newEmail || !d || !m || !y) {
    return window.showCgvToast(
      "Vui lòng điền đầy đủ họ tên, số điện thoại, email và ngày sinh!",
      "error",
    );
  }

  if (newName.length < 2 || newName.length > 50) {
    return window.showCgvToast("Họ tên phải từ 2 đến 50 ký tự!", "error");
  }

  const nameRegex = /^[\p{L}\s]+$/u;
  if (!nameRegex.test(newName)) {
    return window.showCgvToast(
      "Họ tên chỉ được chứa chữ cái và khoảng trắng!",
      "error",
    );
  }

  const phoneRegex = /^0\d{9}$/;
  if (!phoneRegex.test(newPhone)) {
    return window.showCgvToast(
      "Số điện thoại phải gồm 10 chữ số và bắt đầu bằng số 0!",
      "error",
    );
  }

  const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;
  if (!gmailRegex.test(newEmail)) {
    return window.showCgvToast(
      "Email phải đúng định dạng Gmail, ví dụ: example@gmail.com",
      "error",
    );
  }

  const birthDate = new Date(Number(y), Number(m) - 1, Number(d));
  const today = new Date();

  const isValidBirthDate =
    birthDate.getFullYear() === Number(y) &&
    birthDate.getMonth() === Number(m) - 1 &&
    birthDate.getDate() === Number(d);

  if (!isValidBirthDate) {
    return window.showCgvToast("Ngày tháng năm sinh không hợp lệ!", "error");
  }

  if (birthDate >= today) {
    return window.showCgvToast(
      "Ngày sinh không được lớn hơn hoặc bằng ngày hiện tại!",
      "error",
    );
  }

  const age = today.getFullYear() - birthDate.getFullYear();
  if (age < 6) {
    return window.showCgvToast(
      "Tuổi tài khoản phải từ 6 tuổi trở lên!",
      "error",
    );
  }

  const newBirth = `${y}-${m.toString().padStart(2, "0")}-${d.toString().padStart(2, "0")}`;
  const cachedUser = JSON.parse(
    localStorage.getItem("las_logged_in_user") || "{}",
  );

  const accountId =
    window.currentLoggedInId ||
    sessionStorage.getItem("accountId") ||
    cachedUser.accountId ||
    cachedUser.account_id;

  if (!accountId) {
    return window.showCgvToast(
      "Không xác định được tài khoản đang đăng nhập!",
      "error",
    );
  }
  const guard = getAuthFormGuard();
  guard.profileSubmitting = true;
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
        const guard = getAuthFormGuard();

        guard.profileSubmitting = false;
        guard.profileEditing = false;
        guard.profileDirty = false;
        guard.lastLeaveAttempt = 0;

        window.showCgvToast(
          resData.message || "Cập nhật thông tin thành công!",
          "success",
        );

        document
          .querySelectorAll(".profile-readonly-input")
          .forEach((input) => {
            input.setAttribute("readonly", true);

            if (input.tagName === "SELECT") {
              input.setAttribute("disabled", true);
            }

            input.style.border = "1px solid rgba(255,255,255,0.15)";
            input.style.background = "#1c1c21";
            input.style.color = "#f4f4f5";
          });

        const saveButton = document.getElementById("btn-save-profile");

        if (saveButton) {
          saveButton.style.display = "none";
        }

        // Giữ đoạn API.getProfile(...) cũ của bạn ở đây
      } else {
        window.showCgvToast("Không thể lưu: " + resData.message, "error");
      }
    })
    .catch((err) => {
      window.showCgvToast("Lỗi cập nhật hồ sơ: " + err.message, "error");
    })
    .finally(() => {
      getAuthFormGuard().profileSubmitting = false;
    });
}

function handleProfileTabAccess() {
  if (!isUserLoggedInState) {
    openAuthModal();
  } else {
    switchCgvTab("panel-profile");
  }
}

function switchProfileSubTab(sub, forceChange = false) {
  const guard =
    typeof getAuthFormGuard === "function"
      ? getAuthFormGuard()
      : window.authFormGuard;

  const leavingGeneralInformation =
    sub !== "chung" &&
    Boolean(
      guard?.profileEditing || guard?.profileDirty || guard?.profileSubmitting,
    );

  console.log("[PROFILE SUB TAB]", {
    sub,
    forceChange,
    leavingGeneralInformation,
    guard,
  });

  if (
    !forceChange &&
    leavingGeneralInformation &&
    typeof window.canLeaveAuthForm === "function" &&
    !window.canLeaveAuthForm("profile")
  ) {
    console.log("[PROFILE SUB TAB] Đã chặn chuyển tab");

    return false;
  }

  document.querySelectorAll(".arrow-btn").forEach((button) => {
    button.classList.remove("active");
  });

  ["chung", "lichsu", "dashboard"].forEach((name) => {
    const panel = document.getElementById("pro-panel-" + name);

    if (panel) {
      panel.classList.remove("active");
    }
  });

  const currentButton = document.getElementById("pro-subtab-btn-" + sub);

  const currentPanel = document.getElementById("pro-panel-" + sub);

  if (currentButton) {
    currentButton.classList.add("active");
  }

  if (currentPanel) {
    currentPanel.classList.add("active");
  }

  if (
    sub === "lichsu" &&
    typeof window.renderTransactionHistory === "function"
  ) {
    window.renderTransactionHistory();
  }

  return true;
}

window.switchProfileSubTab = switchProfileSubTab;

window.switchProfileSubTab = switchProfileSubTab;

function activateEditableFormFields() {
  const guard = getAuthFormGuard();

  guard.profileEditing = true;
  guard.profileDirty = false;
  guard.lastLeaveAttempt = 0;

  document.querySelectorAll(".profile-readonly-input").forEach((input) => {
    input.removeAttribute("readonly");
    input.removeAttribute("disabled");

    input.style.border = "1px solid #ff6b35";
    input.style.background = "#0b0b0e";
    input.style.color = "#f4f4f5";

    // Tránh gắn listener nhiều lần
    if (input.dataset.profileGuardBound === "true") {
      return;
    }

    const eventName =
      input.tagName === "SELECT" || input.type === "checkbox"
        ? "change"
        : "input";

    input.addEventListener(eventName, function () {
      getAuthFormGuard().profileDirty = true;
    });

    input.dataset.profileGuardBound = "true";
  });

  const saveButton = document.getElementById("btn-save-profile");

  if (saveButton) {
    saveButton.style.display = "block";
  }

  window.showCgvToast("Bạn đang ở chế độ chỉnh sửa thông tin.", "success");
}

// --- 4. TIỆN ÍCH KHÁC ---
function confirmLogoutAction(e) {
  if (e) e.stopPropagation();

  if (!confirm("Bạn có chắc chắn muốn đăng xuất?")) return;

  sessionStorage.clear();

  localStorage.removeItem("las_logged_in_user");
  localStorage.removeItem("las_user_invoices");
  localStorage.removeItem("las_current_booking_cache");

  window.currentLoggedInId = null;

  isUserLoggedInState = false;

  location.reload();
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

document.addEventListener("DOMContentLoaded", function () {
  const registerFields = [
    "reg-name",
    "reg-phone",
    "reg-email",
    "reg-password",
    "reg-birth-day",
    "reg-birth-month",
    "reg-birth-year",
    "reg-captcha",
    "reg-agreement",
  ];

  registerFields.forEach((id) => {
    const element = document.getElementById(id);

    if (!element) return;

    const eventName =
      element.tagName === "SELECT" || element.type === "checkbox"
        ? "change"
        : "input";

    element.addEventListener(eventName, function () {
      window.authFormGuard.registerDirty = true;
    });
  });
});

// 🚀 ĐÃ THÊM: Ép trình duyệt đưa hàm ra phạm vi window tối cao, dẹp bỏ hoàn toàn lỗi undefined nút bấm
window.generateNewLoginCaptcha = generateNewLoginCaptcha;
window.generateNewRegisterCaptcha = generateNewRegisterCaptcha;

if (!window.__profileNavigationGuardBound) {
  window.__profileNavigationGuardBound = true;

  document.addEventListener(
    "click",
    function (event) {
      const guard =
        typeof getAuthFormGuard === "function"
          ? getAuthFormGuard()
          : window.authFormGuard;

      if (!guard) {
        return;
      }

      const profileInProgress =
        guard.profileEditing || guard.profileDirty || guard.profileSubmitting;

      // Không chỉnh sửa thì không cần chặn
      if (!profileInProgress) {
        return;
      }

      // Chỉ xử lý những phần tử có khả năng điều hướng/thực hiện hành động
      const actionElement = event.target.closest(
        `
          a,
          button,
          [onclick],
          .nav-link,
          .sub-nav-item,
          .dropdown-item,
          .arrow-btn,
          .logo,
          .bc-back-btn
        `,
      );

      if (!actionElement) {
        return;
      }

      // Cho phép bấm nút Lưu
      if (
        actionElement.id === "btn-save-profile" ||
        actionElement.closest("#btn-save-profile")
      ) {
        return;
      }

      // Cho phép tiếp tục nhập/chọn dữ liệu trong form
      if (actionElement.matches("input, select, textarea, option, label")) {
        return;
      }

      const inlineAction = actionElement.getAttribute("onclick") || "";

      // Cho phép chính nút Chỉnh sửa
      if (inlineAction.includes("activateEditableFormFields")) {
        return;
      }

      console.log("[GLOBAL PROFILE GUARD]", {
        clickedElement: actionElement,
        profileEditing: guard.profileEditing,
        profileDirty: guard.profileDirty,
        profileSubmitting: guard.profileSubmitting,
      });

      if (
        typeof window.canLeaveAuthForm === "function" &&
        !window.canLeaveAuthForm("profile")
      ) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        console.log("[GLOBAL PROFILE GUARD] Đã chặn thao tác điều hướng");
      }
    },
    true,
  );
}
