// ==========================================================================
// MÃ NGUỒN XỬ LÝ LOGIC TRANG CHỦ (HOME & BOOKING FLOW) - BẢN KHÔI PHỤC HIỂN THỊ
// File: js/home.js
// ==========================================================================

let fnbQty = 0;
let globalBannerTimer = null;

// Tận dụng trực tiếp các biến toàn cục đã được state.js khai báo trước đó, không khai báo lại bằng let/const
appliedVoucherDiscount = 0;
userPastInvoices = window.userPastInvoices || [];
selectedSeats = window.selectedSeats || [];
selectedShowtime = "";
currentMovieFilter = "now_showing";
currentPriceTotal = 0;
isHoldingState = false;
timerInterval = null;
isUserLoggedInState = false;
cgvNavigationHistory = ["panel-movies"];
activeSearchKeyword = "";
selectedDateStr = "";
currentBannerIndex = 0;
totalBanners = 0;
temporaryRegisterEmail = "";

// 1. Hàm tải Banner từ Database Spring Boot
function loadBannersFromDatabase() {
  fetch("http://localhost:8080/api/banners")
    .then((response) => response.json())
    .then((banners) => {
      const carousel = document.getElementById("las-banner-carousel");
      if (!carousel || !banners || banners.length === 0) return;

      totalBanners = banners.length;
      carousel.style.width = `${totalBanners * 100}%`;

      let htmlContent = "";
      banners.forEach((b) => {
        let imgWidth = 100 / totalBanners;
        htmlContent += `<img src="${b.imageUrl || b.image_url}" alt="${b.title}" style="width: ${imgWidth}%; height: 100%; object-fit: cover;">`;
      });

      carousel.innerHTML = htmlContent;
    })
    .catch((err) => console.error("🚨 Lỗi khi tải banner từ DB: ", err));
}

function updateBannerMovement() {
  const carousel = document.getElementById("las-banner-carousel");
  if (carousel) {
    let percentage = -(currentBannerIndex * (100 / totalBanners));
    carousel.style.transform = `translateX(${percentage}%)`;
  }
}

function moveBannerRight() {
  if (totalBanners === 0) return;
  currentBannerIndex = (currentBannerIndex + 1) % totalBanners;
  updateBannerMovement();
}

function moveBannerLeft() {
  if (totalBanners === 0) return;
  currentBannerIndex = (currentBannerIndex - 1 + totalBanners) % totalBanners;
  updateBannerMovement();
}

function startAutoBannerSlider() {
  if (globalBannerTimer) clearInterval(globalBannerTimer);
  globalBannerTimer = setInterval(moveBannerRight, 3000);
}

// 🌟 ĐỒNG BỘ CỔNG KÍCH HOẠT ĐỂ UI.JS GỌI KHÔNG BỊ SẬP
window.fetchSyncData = function () {
  console.log("🚀 Đồng bộ dữ liệu phim từ Spring Boot...");

  if (typeof serverData === "undefined") {
    window.serverData = { masterSeatStore: {}, movies: [], showtimes: [] };
  }

  fetch("http://localhost:8080/api/movies")
    .then((res) => {
      if (!res.ok) throw new Error("Không thể kết nối API Spring Boot");
      return res.json();
    })
    .then((moviesList) => {
      console.log("🎯 Đã nhận danh sách phim từ Spring Boot:", moviesList);

      serverData.movies = moviesList;

      if (!serverData.showtimes || serverData.showtimes.length === 0) {
        serverData.showtimes = [
          "09:30",
          "12:15",
          "15:00",
          "17:45",
          "20:30",
          "23:15",
        ];
      }
      if (!serverData.masterSeatStore) {
        serverData.masterSeatStore = {};
      }

      const selectCombo = document.getElementById("cgv-combo-movie");
      if (selectCombo && serverData.movies && serverData.movies.length > 0) {
        selectCombo.innerHTML = "";
        serverData.movies.forEach((m) => {
          const mStatus = (m.status || "")
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "");
          if (mStatus === "nowshowing" || mStatus === "now_showing") {
            selectCombo.innerHTML += `<option value="${m.title}">${m.title}</option>`;
          }
        });
      }

      if (
        !selectedShowtime &&
        serverData.showtimes &&
        serverData.showtimes.length > 0
      ) {
        selectedShowtime = serverData.showtimes[0];
      }

      // Gọi hàm vẽ lại giao diện
      window.renderCgvInterface();
    })
    .catch((err) => {
      console.error("🚨 Lỗi kết nối API phim trang chủ:", err);
    });
};

// Khởi chạy khi tải trang
window.addEventListener("DOMContentLoaded", () => {
  const daySelect = document.getElementById("reg-birth-day");
  const monthSelect = document.getElementById("reg-birth-month");
  const yearSelect = document.getElementById("reg-birth-year");
  generateCgvDateSlider();
  renderFnbMenu();

  if (daySelect && monthSelect && yearSelect) {
    for (let i = 1; i <= 31; i++) {
      daySelect.innerHTML += `<option value="${i}">${i}</option>`;
    }
    for (let i = 1; i <= 12; i++) {
      monthSelect.innerHTML += `<option value="${i}">Tháng ${i}</option>`;
    }
    for (let i = 2026; i >= 1950; i--) {
      yearSelect.innerHTML += `<option value="${i}">${i}</option>`;
    }
  }

  loadBannersFromDatabase();
  startAutoBannerSlider();

  // 🌟 BƯỚC THẦN THÁNH: Ép hiển thị Tab phim hoạt động ngay khi trang vừa nạp xong hình hài
  if (typeof switchCgvTab === "function") {
    switchCgvTab("panel-movies", "now_showing");
  }

  if (typeof window.renderLasPromoGrid === "function") {
    window.renderLasPromoGrid();
  }

  window.fetchSyncData();
});

function generateRandomCaptcha(length = 6) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
function generateNewLoginCaptcha() {
  document.getElementById("login-captcha-text").innerText =
    generateRandomCaptcha();
}
function generateNewRegisterCaptcha() {
  document.getElementById("reg-captcha-text").innerText =
    generateRandomCaptcha();
}
function generateForgotCaptcha() {
  document.getElementById("forgot-captcha-text").innerText =
    generateRandomCaptcha();
}

function toggleRegPasswordState() {
  const passInput = document.getElementById("reg-password");
  if (passInput) {
    passInput.type = passInput.type === "password" ? "text" : "password";
  }
}

function openAuthModal() {
  document.getElementById("auth-modal").classList.add("open");
  generateNewLoginCaptcha();
  generateNewRegisterCaptcha();
}
function closeAuthModal() {
  document.getElementById("auth-modal").remove("open");
}

function renderFnbMenu() {
  const container = document.getElementById("cgv-fnb-menu");
  if (!container) return;
  container.innerHTML = "";
  fnbMenu.forEach((item, index) => {
    container.innerHTML += `
          <div style="display:flex; justify-content:space-between; align-items:center; background:#fff; border:1px solid #ddd; padding:15px; border-radius:8px; margin-bottom:12px; box-shadow: 0 2px 5px rgba(0,0,0,0.02);">
              <div style="display:flex; align-items:center; gap:15px;">
                  <div style="font-size:30px; background:#f4f2ec; width:60px; height:60px; display:flex; justify-content:center; align-items:center; border-radius:8px;">${item.icon}</div>
                  <div style="text-align:left;">
                      <div style="font-weight:bold; font-size:14px; color:#333;">${item.name}</div>
                      <div style="color:#e71a0f; font-weight:bold; font-size:14px; margin-top:5px;">${item.price.toLocaleString("vi-VN")} đ</div>
                  </div>
              </div>
              <div style="display:flex; align-items:center; gap:12px;">
                  <button style="width:30px; height:30px; border:1px solid #ccc; background:#fff; font-weight:bold; cursor:pointer; border-radius:4px; font-size: 16px;" onclick="updateComboQty(${index}, -1)">-</button>
                  <span style="font-weight:bold; width:20px; text-align:center; font-size: 16px;">${item.qty}</span>
                  <button style="width:30px; height:30px; border:1px solid #ccc; background:#fff; font-weight:bold; cursor:pointer; border-radius:4px; font-size: 16px;" onclick="updateComboQty(${index}, 1)">+</button>
              </div>
          </div>`;
  });
}

function updateComboQty(index, change) {
  fnbMenu[index].qty += change;
  if (fnbMenu[index].qty < 0) fnbMenu[index].qty = 0;

  let totalFnbItems = fnbMenu.reduce((sum, item) => sum + item.qty, 0);
  document.getElementById("sum-fnb").innerText = totalFnbItems + " Combo";

  renderFnbMenu();
  calculateCgvCart();
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

function viewMovieDetailText(title, genre) {
  document.getElementById("detail-movie-title").innerText = title;
  document.getElementById("detail-movie-genre").innerText = genre;

  if (!serverData.movies || serverData.movies.length === 0) {
    alert("Dự án đang tải dữ liệu phim từ SQL Server, vui lòng đợi vài giây!");
    return;
  }

  const targetMovie = serverData.movies.find((m) => m.title === title);
  if (targetMovie) {
    if (document.getElementById("detail-movie-duration")) {
      document.getElementById("detail-movie-duration").innerText =
        targetMovie.duration || "-";
    }
    if (document.getElementById("detail-movie-country")) {
      document.getElementById("detail-movie-country").innerText =
        targetMovie.country || "Đang cập nhật";
    }
    if (document.getElementById("detail-movie-director")) {
      document.getElementById("detail-movie-director").innerText =
        targetMovie.director || "Đang cập nhật";
    }
    if (document.getElementById("detail-movie-performer")) {
      document.getElementById("detail-movie-performer").innerText =
        targetMovie.performer || "Đang cập nhật";
    }

    const posterBox = document.getElementById("detail-movie-poster-box");
    if (posterBox) {
      let subPoster =
        targetMovie.subposterUrl ||
        targetMovie.subposter_url ||
        targetMovie.subposterurl;
      let mainPoster =
        targetMovie.mainposterUrl ||
        targetMovie.mainposter_url ||
        targetMovie.mainposterurl;
      let backupImg =
        targetMovie.img ||
        "https://www.cgv.vn/media/catalog/product/placeholder/default/cgv_title.png";
      let validPoster = subPoster || mainPoster || backupImg;

      posterBox.style.backgroundImage = `url("${validPoster}")`;
      posterBox.style.backgroundSize = "cover";
      posterBox.style.backgroundRepeat = "no-repeat";
      posterBox.style.backgroundPosition = "center";
      posterBox.innerHTML = "";
    }

    const synopsisBox = document.getElementById("detail-movie-synopsis");
    if (synopsisBox) {
      synopsisBox.innerText =
        targetMovie.synopsis || "Chưa có tóm tắt cho bộ phim điện ảnh này.";
    }
  }

  const bookBtn = document.getElementById("btn-detail-book-now");
  if (bookBtn) {
    bookBtn.onclick = () => {
      quickBookMovie(title);
    };
  }
  switchCgvTab("panel-movie-detail");
}

function openCheckoutReview() {
  const currentMovie = document.getElementById("cgv-combo-movie").value;
  let fnbHtml = fnbMenu
    .filter((i) => i.qty > 0)
    .map(
      (i) =>
        `<p>+ ${i.name} (x${i.qty}): ${(i.price * i.qty).toLocaleString("vi-VN")} đ</p>`,
    )
    .join("");
  document.getElementById("review-invoice-content").innerHTML = `
      <p><strong>Phim:</strong> ${currentMovie}</p>
      <p><strong>Suất chiếu:</strong> ${selectedDateStr} | ${selectedShowtime}</p>
      <p><strong>Ghế:</strong> ${selectedSeats.join(", ")}</p>
      <p><strong>Bắp nước:</strong></p>
      ${fnbHtml || "<p>Không có</p>"}
      <hr style="margin: 10px 0;">
      <p><strong>Tổng cộng (Chưa giảm):</strong> ${currentPriceTotal.toLocaleString("vi-VN")} đ</p>
  `;
  appliedVoucherDiscount = 0;
  document.getElementById("voucher-input").value = "";
  document.getElementById("review-final-total").innerText =
    currentPriceTotal.toLocaleString("vi-VN") + " đ";
  document.getElementById("checkout-review-modal").classList.add("open");
}

function closeCheckoutReview() {
  document.getElementById("checkout-review-modal").classList.remove("open");
  appliedVoucherDiscount = 0;
  calculateCgvCart();
}

function applyVoucher() {
  const code = document
    .getElementById("voucher-input")
    .value.trim()
    .toUpperCase();
  if (code === "LAS20") {
    appliedVoucherDiscount = 0.2;
    alert("Áp dụng thành công Voucher giảm 20%!");
  } else {
    appliedVoucherDiscount = 0;
    alert("Mã Voucher không hợp lệ hoặc đã hết hạn!");
  }
  const finalTotal = currentPriceTotal * (1 - appliedVoucherDiscount);
  document.getElementById("review-final-total").innerText =
    finalTotal.toLocaleString("vi-VN") + " đ";
  calculateCgvCart();
}

function processToPaymentGateway() {
  closeCheckoutReview();
  const finalTotal = currentPriceTotal * (1 - appliedVoucherDiscount);
  document.getElementById("qr-total-price").innerText =
    finalTotal.toLocaleString("vi-VN") + " đ";
  const qrData = `Thanh toan ve LAS - So tien: ${finalTotal} VND`;
  document.getElementById("bank-qr-img").src =
    `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;
  document.getElementById("payment-redirect-modal").classList.add("open");
}

function closePaymentModal() {
  document.getElementById("payment-redirect-modal").classList.remove("open");
}

function executeFinalCheckout() {
  const currentMovie = document.getElementById("cgv-combo-movie").value;
  const currentEmail = document.getElementById("profile-field-email")
    ? document.getElementById("profile-field-email").value
    : "Hoang2026@gmail.com";

  fetch("http://localhost:8080/api/seats/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      movie: currentMovie,
      showtime: selectedShowtime,
      seats: selectedSeats,
      email: currentEmail,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      document
        .getElementById("payment-redirect-modal")
        .classList.remove("open");
      if (data.success) {
        const lasTicketId = data.ticketId.replace("CGV-", "LAS-");
        const invoiceObj = {
          id: lasTicketId,
          movie: currentMovie,
          date: selectedDateStr,
          time: selectedShowtime,
          seats: [...selectedSeats],
          fnb: fnbMenu.filter((i) => i.qty > 0).map((i) => ({ ...i })),
          total: currentPriceTotal * (1 - appliedVoucherDiscount),
          status: "Đã thanh toán (VNPAY)",
        };
        userPastInvoices.unshift(invoiceObj);

        alert("Giao dịch thành công! Vé đã được xuất.");
        resetHoldState();
        selectedSeats = [];
        fnbMenu.forEach((i) => (i.qty = 0));
        renderFnbMenu();
        calculateCgvCart();
        renderTransactionHistory();
        switchCgvTab("panel-profile");
        switchProfileSubTab("lichsu");
      }
    });
}

function cancelCurrentTransaction() {
  if (
    confirm("Bạn có chắc chắn muốn hủy giao dịch và bỏ giữ các ghế này không?")
  ) {
    const currentMovie = document.getElementById("cgv-combo-movie").value;
    fetch("http://localhost:8080/api/seats/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        movie: currentMovie,
        showtime: selectedShowtime,
        seats: selectedSeats,
      }),
    }).then(() => {
      resetHoldState();
      selectedSeats = [];
      fnbMenu.forEach((i) => (i.qty = 0));
      renderFnbMenu();
      calculateCgvCart();
      window.renderCgvInterface();
      alert("Đã hủy giao dịch và giải phóng ghế!");
    });
  }
}

function renderTransactionHistory() {
  const historyZone = document.getElementById("cgv-invoice-zone");
  if (userPastInvoices.length === 0) {
    historyZone.innerHTML =
      '<p style="color:#777; font-size: 13px;">Bạn chưa thực hiện giao dịch mua vé trực tuyến nào gần đây.</p>';
    return;
  }

  historyZone.innerHTML = "";
  userPastInvoices.forEach((inv) => {
    historyZone.innerHTML += `
          <div style="border: 1px solid #ccc; padding: 15px; margin-bottom: 10px; background: white; display: flex; justify-content: space-between; align-items: center;">
              <div>
                  <h4 style="margin: 0 0 5px 0; color: var(--cgv-red);">${inv.movie}</h4>
                  <p style="margin: 0; font-size: 13px; color: #555;">Mã ĐH: <b>${inv.id}</b> | Ngày: ${inv.date} | Trạng thái: <span style="color: green;">${inv.status}</span></p>
              </div>
              <button onclick="viewHistoryDetail('${inv.id}')" style="background: var(--cgv-gold); border: none; padding: 8px 15px; cursor: pointer; font-weight: bold; border-radius: 4px;">Xem Chi Tiết</button>
          </div>
      `;
  });
}

function viewHistoryDetail(invoiceId) {
  const inv = userPastInvoices.find((i) => i.id === invoiceId);
  if (!inv) return;
  let fnbHtml = inv.fnb.map((i) => `<li>${i.name} x${i.qty}</li>`).join("");
  document.getElementById("history-detail-content").innerHTML = `
      <p><strong>Mã vé:</strong> <span style="color:red;">${inv.id}</span></p>
      <p><strong>Phim:</strong> ${inv.movie}</p>
      <p><strong>Suất:</strong> ${inv.time} ngày ${inv.date}</p>
      <hr style="margin: 10px 0;">
      <p><strong>🎟️ Vé ghế ngồi:</strong> ${inv.seats.join(", ")}</p>
      <p><strong>🍿 Bắp nước:</strong></p>
      <ul>${fnbHtml || "<li>Không có</li>"}</ul>
      <hr style="margin: 10px 0;">
      <p style="font-size: 16px; text-align: right;"><strong>Thành tiền: <span style="color:red;">${inv.total.toLocaleString("vi-VN")} đ</span></strong></p>
  `;
  document.getElementById("history-detail-modal").classList.add("open");
}

function closeHistoryDetailModal() {
  document.getElementById("history-detail-modal").classList.remove("open");
}

function executeMovieRealTimeSearch() {
  const inputField = document.getElementById("movie-search-input");
  if (inputField) {
    activeSearchKeyword = inputField.value.trim().toLowerCase();
    window.renderCgvInterface();
  }
}

function selectCgvBookingDate(dateStr) {
  selectedDateStr = dateStr;
  generateCgvDateSlider();
  selectedSeats = [];
  window.renderCgvInterface();
}

function handleCgvLogout(e) {
  e.stopPropagation();
  document.getElementById("logout-confirm-modal").classList.add("open");
}
function closeLogoutConfirmModal() {
  document.getElementById("logout-confirm-modal").classList.remove("open");
}
function confirmCgvLogoutAction() {
  isUserLoggedInState = false;
  closeLogoutConfirmModal();
  const authLinkBox = document.getElementById("top-bar-auth-link");
  authLinkBox.removeAttribute("style");
  authLinkBox.onclick = openAuthModal;
  authLinkBox.innerHTML = `<span class="sub-nav-icon">👤</span> ĐĂNG NHẬP/ ĐĂNG KÝ`;
  document.getElementById("top-bar-ticket-link").innerHTML =
    `<span class="sub-nav-icon">🎬</span> VÉ CỦA TÔI`;
  switchCgvTab("panel-movies", "now_showing");
}

function handleTicketViewAccess() {
  if (!isUserLoggedInState) {
    alert("Vui lòng đăng nhập hệ thống!");
    openAuthModal();
  } else {
    switchCgvTab("panel-profile");
    switchProfileSubTab("lichsu");
  }
}

function handleProfileTabAccess() {
  if (!isUserLoggedInState) {
    openAuthModal();
  } else {
    switchCgvTab("panel-profile");
  }
}

function submitCgvLogin() {
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

  fetch("http://localhost:8080/api/login/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: user, password: pass }),
  })
    .then((res) => {
      if (!res.ok) {
        return res.json().then((err) => {
          throw new Error(err.message || "Thất bại!");
        });
      }
      return res.json();
    })
    .then((resData) => {
      if (resData.status === "success") {
        isUserLoggedInState = true;
        let uData = resData.data;

        alert(`Chào mừng thành viên: ${uData.fullName} đăng nhập thành công!`);
        closeAuthModal();

        const authLinkBox = document.getElementById("top-bar-auth-link");
        authLinkBox.onclick = () => switchCgvTab("panel-profile");
        authLinkBox.style.cursor = "pointer";
        authLinkBox.innerHTML = `
            <span class="sub-nav-icon">👤</span> XIN CHÀO, ${uData.fullName.toUpperCase()}!
              <span onclick="handleCgvLogout(event)" style="color: #0066cc; margin-left: 8px; cursor: pointer; text-decoration: underline; font-weight: bold;">THOÁT</span>
          `;
        document.getElementById("top-bar-ticket-link").innerHTML =
          `<span class="sub-nav-icon">🎬</span> LỊCH SỬ GIAO DỊCH`;

        let roleString = "Khách hàng thành viên";
        if (uData.roleId === 1) roleString = "Quản lý hệ thống (ADMIN)";
        if (uData.roleId === 2) roleString = "Nhân viên cụm rạp (STAFF)";

        if (document.getElementById("profile-summary-avatar")) {
          document.getElementById("profile-summary-avatar").innerText =
            uData.fullName.split(" ").pop().substring(0, 2).toUpperCase();
        }

        const welcomeNameBox = document.getElementById("profile-welcome-name");
        if (welcomeNameBox)
          welcomeNameBox.innerText = `Xin chào ${uData.fullName},`;

        const starRoleBox = document.getElementById("profile-star-role");
        if (starRoleBox)
          starRoleBox.innerText =
            uData.roleId === 1 ? "MANAGER / ADMIN" : "MEMBER";

        document.getElementById("profile-field-name").value = uData.fullName;
        document.getElementById("profile-field-phone").value =
          uData.phoneNumber;
        document.getElementById("profile-field-email").value = uData.email;
        if (document.getElementById("profile-field-role")) {
          document.getElementById("profile-field-role").value = roleString;
        }

        switchCgvTab("panel-profile");
      }
    })
    .catch((err) => alert("🚨 Lỗi đăng nhập: " + err.message));
}

function submitCgvRegister() {
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

  fetch("http://localhost:8080/api/register/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: name,
      phone: phone,
      email: email,
      password: password,
      birthDay: birthDay,
      birthMonth: birthMonth,
      birthYear: birthYear,
    }),
  })
    .then((res) => {
      if (!res.ok) {
        return res.json().then((err) => {
          throw new Error(err.message || "Đăng ký thất bại!");
        });
      }
      return res.json();
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
      }
    })
    .catch((err) => alert("🚨 Lỗi đăng ký: " + err.message));
}

function switchMovieFilterTab(filter) {
  const mainTitle = document.getElementById("tab-title-now");
  const subTitle = document.getElementById("tab-title-coming");
  currentMovieFilter = filter;
  const bcCurrentTextEl = document.getElementById("bc-current-text");

  if (filter === "now_showing") {
    if (mainTitle) mainTitle.className = "tab-title-main";
    if (subTitle) subTitle.className = "tab-title-sub";
    if (bcCurrentTextEl) bcCurrentTextEl.innerText = "Phim Đang Chiếu";
  } else {
    if (mainTitle) mainTitle.className = "tab-title-sub";
    if (subTitle) subTitle.className = "tab-title-main";
    if (bcCurrentTextEl) bcCurrentTextEl.innerText = "Phim Sắp Chiếu";
  }
  window.renderCgvInterface();
}

function quickBookMovie(movieTitle) {
  switchCgvTab("panel-booking");
  const selectCombo = document.getElementById("cgv-combo-movie");
  if (selectCombo) {
    selectCombo.value = movieTitle;
    onMovieOrTimeChange();
  }
}

function selectTime(t) {
  if (isHoldingState) return alert("Hóa đơn đã khóa thanh toán!");
  selectedShowtime = t;
  selectedSeats = [];
  calculateCgvCart();
  window.renderCgvInterface();
}

function calculateCgvCart() {}

function onMovieOrTimeChange() {
  resetHoldState();
  selectedSeats = [];
  calculateCgvCart();
  window.renderCgvInterface();
}

function switchCgvTab(panelId, filterType = "now_showing") {
  if (cgvNavigationHistory[cgvNavigationHistory.length - 1] !== panelId) {
    cgvNavigationHistory.push(panelId);
  }

  const bcBackBtnEl = document.getElementById("bc-back-btn");
  if (bcBackBtnEl) {
    bcBackBtnEl.style.display =
      cgvNavigationHistory.length > 1 ? "inline-block" : "none";
  }

  document
    .querySelectorAll(".cgv-panel")
    .forEach((p) => p.classList.remove("active"));

  const targetPanel = document.getElementById(panelId);
  if (targetPanel) {
    targetPanel.classList.add("active");
  }

  const parentBc = document.getElementById("bc-parent-text");
  const currentBc = document.getElementById("bc-current-text");

  if (panelId === "panel-movies") {
    const lnkMoviesEl = document.getElementById("lnk-movies");
    if (lnkMoviesEl) lnkMoviesEl.classList.add("active");
    switchMovieFilterTab(filterType);
    if (document.getElementById("payment-sticky-bar"))
      document.getElementById("payment-sticky-bar").style.display = "none";
  }

  if (panelId === "panel-booking") {
    if (parentBc) parentBc.innerText = "Đặt Vé Trực Tuyến";
    if (currentBc) currentBc.innerText = "Chọn Suất Chiếu & Ghế Ngồi";
    if (document.getElementById("payment-sticky-bar"))
      document.getElementById("payment-sticky-bar").style.display = "block";
    generateCgvDateSlider();
  } else if (panelId !== "panel-booking") {
    if (document.getElementById("payment-sticky-bar"))
      document.getElementById("payment-sticky-bar").style.display = "none";
  }

  if (panelId === "panel-profile") {
    if (parentBc) parentBc.innerText = "Thành Viên";
    if (currentBc) currentBc.innerText = "Tài Khoản LAS";
    switchProfileSubTab("chung");
  }
  window.renderCgvInterface();
}

function handleBreadcrumbBack() {
  if (cgvNavigationHistory.length <= 1) return;
  cgvNavigationHistory.pop();
  const prevPage = cgvNavigationHistory[cgvNavigationHistory.length - 1];
  switchCgvTab(prevPage);
  cgvNavigationHistory.pop();
}

// 🌟 ĐĂNG KÝ PHẠM VI WINDOW TOÀN CỤC CHO HÀM VẼ GIAO DIỆN CHÍNH
window.renderCgvInterface = function () {
  const movieZone = document.getElementById("cgv-movie-list");
  const selectCombo = document.getElementById("cgv-combo-movie");

  let activeMovieTitle = selectCombo
    ? selectCombo.value ||
      (selectCombo.options[0] ? selectCombo.options[0].value : "")
    : "";
  const safeMovies = (serverData && serverData.movies) || [];
  const targetMovieObj = safeMovies.find((m) => m.title === activeMovieTitle);

  // 1. Tự động bóc tách lịch chiếu thực tế từ Database Spring Boot sang mảng giờ
  if (
    targetMovieObj &&
    targetMovieObj.showtimes &&
    targetMovieObj.showtimes.length > 0
  ) {
    serverData.showtimes = targetMovieObj.showtimes.map((st) => {
      const fullTimeStr = st.startTime || st.start_time || "";
      // Nếu chuỗi datetime có khoảng trắng (2026-06-24 11:00:00) thì cắt lấy "11:00"
      return fullTimeStr.includes(" ")
        ? fullTimeStr.split(" ")[1].substring(0, 5)
        : fullTimeStr.substring(0, 5);
    });
  } else {
    // Dự phòng mảng giờ mặc định nếu bộ phim đó chưa được cài đặt lịch chiếu trong DB
    serverData.showtimes = [
      "09:30",
      "12:15",
      "15:00",
      "17:45",
      "20:30",
      "23:15",
    ];
  }

  if (!selectedShowtime && serverData.showtimes.length > 0) {
    selectedShowtime = serverData.showtimes[0];
  }

  // 2. Tự động kích hoạt ma trận 40 ghế rạp trống (A1 -> D10) nếu dữ liệu ghế rạp đang trống rỗng
  if (!serverData.masterSeatStore) serverData.masterSeatStore = {};
  if (activeMovieTitle && selectedShowtime) {
    if (!serverData.masterSeatStore[activeMovieTitle])
      serverData.masterSeatStore[activeMovieTitle] = {};
    if (
      !serverData.masterSeatStore[activeMovieTitle][selectedShowtime] ||
      Object.keys(
        serverData.masterSeatStore[activeMovieTitle][selectedShowtime],
      ).length === 0
    ) {
      let activeSeatMap = {};
      ["A", "B", "C", "D"].forEach((row) => {
        for (let i = 1; i <= 10; i++) {
          activeSeatMap[`${row}${i}`] = { status: "available" };
        }
      });
      serverData.masterSeatStore[activeMovieTitle][selectedShowtime] =
        activeSeatMap;
    }
  }
  // ========================================================================

  // Khối 1: Vẽ danh sách phim lên trang chủ
  if (movieZone) {
    movieZone.innerHTML = "";
    let rankCounter = 1;
    const safeMovies = (serverData && serverData.movies) || [];

    safeMovies.forEach((m) => {
      const movieStatus = (m.status || "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
      const filterStatus = (currentMovieFilter || "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");

      if (
        movieStatus === filterStatus ||
        movieStatus.includes(filterStatus) ||
        filterStatus.includes(movieStatus)
      ) {
        const titleStr = m.title || "Chưa có tên";
        const genreStr = m.genre || "Hành động";

        const matchesKeyword =
          titleStr.toLowerCase().includes(activeSearchKeyword) ||
          genreStr.toLowerCase().includes(activeSearchKeyword);

        if (activeSearchKeyword === "" || matchesKeyword) {
          let ribbonColor = "ribbon-blue";
          if (rankCounter === 1) ribbonColor = "ribbon-red";
          if (rankCounter === 2) ribbonColor = "ribbon-orange";

          let isNowShowing =
            movieStatus.includes("now") || movieStatus.includes("chieu");
          let actionBtnHTML = isNowShowing
            ? `<button class="btn-cgv-buy-ticket-spec" onclick="quickBookMovie('${titleStr}')">🎟️ MUA VÉ</button>`
            : `<button class="btn-cgv-buy-ticket-spec" style="background-color:#555; cursor:not-allowed;" disabled>📋 SẮP CHIẾU</button>`;

          let cleanImgUrl =
            m.mainposter_url ||
            m.mainposterUrl ||
            m.mainposterurl ||
            m.img ||
            "https://www.cgv.vn/media/catalog/product/placeholder/default/cgv_title.png";
          let displayAge =
            m.age_rating === 0 ||
            m.ageRating === 0 ||
            m.age_rating === "0" ||
            m.ageRating === "0"
              ? "P"
              : `T${m.age_rating || m.ageRating || "16"}`;

          movieZone.innerHTML += `
                    <div class="movie-spec-card">
                        <div class="poster-wrapper-box">
                            <span class="age-label-badge">${displayAge}</span>
                            <div class="rank-ribbon ${ribbonColor}">${rankCounter}</div>
                            <div class="poster-main-body-img" onclick="viewMovieDetailText('${titleStr}', '${genreStr}')" style="background: #111; width: 100%; height: 100%;">
                                <img src="${cleanImgUrl}" alt="${titleStr}" style="width: 100%; height: 100%; object-fit: cover; display: block;">
                            </div>
                        </div>
                        <div class="movie-spec-info-text">
                            <h3 class="movie-spec-title" onclick="viewMovieDetailText('${titleStr}', '${genreStr}')">${titleStr}</h3>
                            <p>Thể loại: <b>${genreStr}</b></p>
                        </div>
                        <div class="movie-spec-action-zone">${actionBtnHTML}</div>
                    </div>
          `;
          rankCounter++;
        }
      }
    });
    console.log(
      "👉 Đã vẽ thành công " +
        (rankCounter - 1) +
        " bộ phim lên màn hình giao diện trang chủ!",
    );
  }

  // Khối 2: Đổ dữ liệu vào ô select đặt vé nhanh
  if (selectCombo) {
    const currentMovie =
      selectCombo.value ||
      (selectCombo.options[0] ? selectCombo.options[0].value : "");
    const sumMovieTitleEl = document.getElementById("sum-movie-title");
    if (sumMovieTitleEl) sumMovieTitleEl.innerText = currentMovie || "-";
  }

  // Khối 3: Vẽ lưới suất chiếu
  const timeGrid = document.getElementById("cgv-showtime-grid");
  if (timeGrid && serverData && serverData.showtimes) {
    timeGrid.innerHTML = "";
    serverData.showtimes.forEach((t) => {
      const activeClass = t === selectedShowtime ? "active" : "";
      timeGrid.innerHTML += `<div class="showtime-btn ${activeClass}" onclick="selectTime('${t}')">${t}</div>`;
    });
  }
  const sumShowtimeEl = document.getElementById("sum-showtime");
  if (sumShowtimeEl) sumShowtimeEl.innerText = selectedShowtime || "-";

  // Khối 4: Sơ đồ ghế ngồi đặt vé
  const seatGrid = document.getElementById("cgv-seat-grid");
  if (seatGrid && selectCombo) {
    seatGrid.innerHTML = "";
    const currentMovie =
      selectCombo.value ||
      (selectCombo.options[0] ? selectCombo.options[0].value : "");
    const activeSeatMap =
      (serverData &&
        serverData.masterSeatStore &&
        serverData.masterSeatStore[currentMovie]?.[selectedShowtime]) ||
      {};

    Object.keys(activeSeatMap).forEach((id) => {
      const s = activeSeatMap[id];
      let seatType = "Standard";
      if (id.startsWith("C")) seatType = "VIP";
      if (id.startsWith("D")) seatType = "Sweetbox";

      const div = document.createElement("div");
      div.className = `cgv-seat ${seatType} ${s.status}`;
      div.innerText = id;

      if (selectedSeats.includes(id)) div.classList.add("selected");

      if (!isHoldingState && s.status === "available") {
        div.onclick = () => {
          if (selectedSeats.includes(id))
            selectedSeats = selectedSeats.filter((x) => x !== id);
          else selectedSeats.push(id);
          calculateCgvCart();
          window.renderCgvInterface();
        };
      }
      seatGrid.appendChild(div);
    });
  }
};

window.calculateCgvCart = function () {
  const sumSeatsEl = document.getElementById("sum-seats");
  if (sumSeatsEl)
    sumSeatsEl.innerText = selectedSeats.join(", ") || "Chưa chọn";

  let total = 0;
  let totalFnbItems = 0;

  selectedSeats.forEach((id) => {
    if (id.startsWith("C"))
      total += 110000; // Giá VIP
    else if (id.startsWith("D"))
      total += 250000; // Giá Sweetbox
    else total += 90000; // Giá Thường
  });

  if (typeof fnbMenu !== "undefined") {
    fnbMenu.forEach((item) => {
      total += item.qty * item.price;
      totalFnbItems += item.qty;
    });
  }

  const sumFnbEl = document.getElementById("sum-fnb");
  if (sumFnbEl) sumFnbEl.innerText = totalFnbItems + " Combo";

  currentPriceTotal = total;
  let finalTotal = currentPriceTotal * (1 - appliedVoucherDiscount);

  const sumTotalEl = document.getElementById("sum-total");
  if (sumTotalEl)
    sumTotalEl.innerText = finalTotal.toLocaleString("vi-VN") + " đ";
};

// --- 5. ĐIỀU HƯỚNG ĐA BƯỚC ĐẶT VÉ (STEP FLOW CONTROLLER) ---
window.goToBookingStep = function (step) {
  document
    .querySelectorAll(".booking-step")
    .forEach((el) => el.classList.remove("active"));
  const currentStepEl = document.getElementById("booking-step-" + step);
  if (currentStepEl) currentStepEl.classList.add("active");

  const mainBtn = document.getElementById("btn-main-action");
  const backBtn = document.querySelector(".btn-flow-back");
  const rightColumn = document.querySelector(".right-invoice-sticky-column");

  if (step === 1) {
    if (rightColumn) rightColumn.style.display = "block";
    if (mainBtn) {
      mainBtn.innerText = "Tiếp Tục";
      mainBtn.style.background = "#e71a0f";
    }
    if (backBtn) {
      backBtn.innerText = "←";
      backBtn.setAttribute("onclick", "window.goHomeFromBc()");
    }
  } else if (step === 2) {
    if (mainBtn) {
      mainBtn.innerText = "Đến Thanh Toán";
      mainBtn.style.background = "#e71a0f";
    }
    if (backBtn) {
      backBtn.innerText = "← Quay Lại";
      backBtn.setAttribute("onclick", "window.goToBookingStep(1)");
    }
  } else if (step === 3) {
    if (mainBtn) {
      mainBtn.innerText = "Thanh Toán Ngay";
      mainBtn.style.background = "#10B981";
    }
    if (backBtn) {
      backBtn.innerText = "← Chọn F&B";
      backBtn.setAttribute("onclick", "window.goToBookingStep(2)");
    }

    const currentMovie = document.getElementById("cgv-combo-movie")
      ? document.getElementById("cgv-combo-movie").value
      : "";
    let fnbHtml = fnbMenu
      .filter((i) => i.qty > 0)
      .map(
        (i) =>
          `<p>+ ${i.name} (x${i.qty}): ${(i.price * i.qty).toLocaleString("vi-VN")} đ</p>`,
      )
      .join("");

    const reviewInvoiceContentEl = document.getElementById(
      "review-invoice-content",
    );
    if (reviewInvoiceContentEl) {
      reviewInvoiceContentEl.innerHTML = `
            <p><strong>Phim:</strong> ${currentMovie}</p>
            <p><strong>Suất chiếu:</strong> ${selectedDateStr} | ${selectedShowtime}</p>
            <p><strong>Ghế:</strong> ${selectedSeats.join(", ")}</p>
            <p><strong>Bắp nước:</strong></p>${fnbHtml || "<p>Không có</p>"}
            <hr style="margin: 10px 0;">
            <p style="font-size: 16px;"><strong>Tổng cộng (Chưa giảm): <span style="color:#e71a0f;">${currentPriceTotal.toLocaleString("vi-VN")} đ</span></strong></p>
        `;
    }
  } else if (step === 4) {
    if (rightColumn) rightColumn.style.display = "none";
  }
  window.currentBookingStep = step;
  const bookingPanel = document.getElementById("panel-booking");
  if (bookingPanel)
    bookingPanel.scrollIntoView({ behavior: "smooth", block: "start" });
};

window.handleMainAction = function () {
  if (!isUserLoggedInState) {
    alert(
      "Vui lòng đăng nhập tài khoản thành viên hệ thống để tiến hành mua vé!",
    );
    openAuthModal();
    return;
  }

  if (window.currentBookingStep === 1) {
    if (selectedSeats.length === 0)
      return alert("Vui lòng chọn ít nhất một chiếc ghế rạp trống!");
    if (!isHoldingState) {
      isHoldingState = true;
      const holdTimerEl = document.getElementById("hold-timer");
      if (holdTimerEl) holdTimerEl.style.display = "flex";
      window.startCountdown(Date.now() + 5 * 60 * 1000); // Khóa giữ ghế rạp 5 phút
    }
    window.goToBookingStep(2);
  } else if (window.currentBookingStep === 2) {
    window.goToBookingStep(3);
  } else if (window.currentBookingStep === 3) {
    window.processToPaymentGateway();
  }
};

// --- 6. LIÊN KẾT CÁC HÀM SỰ KIỆN TƯƠNG TÁC GIAO DIỆN ---
window.selectTime = function (t) {
  if (isHoldingState)
    return alert("Hóa đơn đã được khóa giữ để thực hiện cổng thanh toán!");
  selectedShowtime = t;
  selectedSeats = [];
  window.calculateCgvCart();
  window.renderCgvInterface();
};

window.onMovieOrTimeChange = function () {
  window.resetHoldState();
  selectedSeats = [];
  window.calculateCgvCart();
  window.renderCgvInterface();
};

window.quickBookMovie = function (movieTitle) {
  window.switchCgvTab("panel-booking");
  const selectCombo = document.getElementById("cgv-combo-movie");
  if (selectCombo) {
    selectCombo.value = movieTitle;
    window.onMovieOrTimeChange();
  }
};

window.selectPaymentGatewayType = function (type, element) {
  window.selectedPaymentGateway = type;
  document
    .querySelectorAll(".payment-option-row")
    .forEach((row) => row.classList.remove("active"));
  element.classList.add("active");
};

window.applyVoucher = function () {
  const code = document
    .getElementById("voucher-input")
    .value.trim()
    .toUpperCase();
  if (code === "LAS20") {
    appliedVoucherDiscount = 0.2;
    alert("Áp dụng thành công Voucher giảm giá 20% tổng hóa đơn vé!");
  } else {
    appliedVoucherDiscount = 0;
    alert("Mã Voucher không chính xác hoặc đã hết thời gian áp dụng!");
  }
  window.calculateCgvCart();
  window.goToBookingStep(3); // Cập nhật hiển thị số tiền mới ngoài hóa đơn
};

// --- 7. TÍCH HỢP CỔNG THANH TOÁN VIETQR VÀ XUẤT VÉ ĐIỆN TỬ ---
window.processToPaymentGateway = function () {
  const finalTotal = currentPriceTotal * (1 - appliedVoucherDiscount);

  if (window.selectedPaymentGateway === "qr") {
    const bankId = "ICB";
    const accountNo = "101879388698";
    const accountName = "NGUYEN BAO HOANG";
    const qrData = `LAS CINEMAS THANH TOAN VE`;

    const qrImg = document.getElementById("bank-qr-img");
    if (qrImg) {
      qrImg.src = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact.png?amount=${finalTotal}&addInfo=${encodeURIComponent(qrData)}&accountName=${encodeURIComponent(accountName)}`;
    }

    // Giả lập sau quét mã thành công, tự động xuất vé sau 3.5 giây
    alert(
      "Hệ thống đang kết nối cổng VietQR tự động rà soát giao dịch... Vui lòng đợi trong giây lát!",
    );
    setTimeout(() => {
      window.executeFinalCheckout();
    }, 3500);
  } else {
    alert(
      `Đang kết nối an toàn đến ví điện tử ${window.selectedPaymentGateway.toUpperCase()}...`,
    );
    window.executeFinalCheckout();
  }
};

window.executeFinalCheckout = function () {
  const currentMovie = document.getElementById("cgv-combo-movie").value;
  const currentEmail = document.getElementById("profile-field-email")
    ? document.getElementById("profile-field-email").value
    : "VienNguyen2026@gmail.com";

  const lasTicketId = "LAS-" + Math.floor(100000 + Math.random() * 900000);
  const invoiceObj = {
    id: lasTicketId,
    movie: currentMovie,
    date: selectedDateStr,
    time: selectedShowtime,
    seats: [...selectedSeats],
    fnb: fnbMenu.filter((i) => i.qty > 0).map((i) => ({ ...i })),
    total: currentPriceTotal * (1 - appliedVoucherDiscount),
    status: "Đã thanh toán trực tuyến",
  };
  userPastInvoices.unshift(invoiceObj);

  let fnbTicketHtml = invoiceObj.fnb
    .map((i) => `<li>${i.name} x${i.qty}</li>`)
    .join("");
  const beautifulTicketHTML = `
      <div style="text-align: center; margin-bottom: 25px;">
          <h2 style="color: #10B981; margin-bottom: 10px; font-size: 26px;">🎟️ ĐẶT VÉ ĐIỆN TỬ THÀNH CÔNG!</h2>
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${invoiceObj.id}" style="border: 2px solid #222; padding: 6px; background:#fff;">
          <p style="color: #444; font-weight: bold; font-size: 13px; margin-top: 12px;">LAS Cinemas đã gửi một bản sao hóa đơn vé qua Email của bạn.</p>
      </div>
      <div style="background: #fdfcf7; padding: 25px; border: 2px dashed #cca23b; border-radius: 8px; text-align: left; max-width: 500px; margin: 0 auto; box-sizing: border-box; color:#222;">
          <p><strong>Mã tra cứu vé:</strong> <span style="color:#e71a0f; font-size: 20px; font-family: monospace; font-weight:bold;">${invoiceObj.id}</span></p>
          <p><strong>Tên bộ phim:</strong> <b>${invoiceObj.movie}</b></p>
          <p><strong>Suất chiếu rạp:</strong> Suất ${invoiceObj.time} | Ngày ${invoiceObj.date}</p>
          <hr style="margin: 15px 0; border: none; border-top: 1px dashed #ccc;">
          <p><strong>🎟️ Vị trí ghế ngồi:</strong> <span style="color:#e71a0f; font-weight:bold;">${invoiceObj.seats.join(", ")}</span></p>
          <p><strong>🍿 Dịch vụ kèm theo:</strong></p><ul>${fnbTicketHtml || "<li>Không có dịch vụ ăn kèm</li>"}</ul>
          <hr style="margin: 15px 0; border: none; border-top: 1px dashed #ccc;">
          <p style="font-size: 18px; text-align: right; margin: 0;">Tổng tiền: <span style="color:#10B981; font-weight:bold;">${invoiceObj.total.toLocaleString("vi-VN")} đ</span></p>
      </div>
      <div style="margin-top: 35px; text-align: center;">
          <button class="btn-cgv-submit" style="width: auto; padding: 12px 35px; background: #333; color:#fff; border:none; border-radius:4px; font-weight:bold; cursor:pointer;" onclick="window.goHomeFromBc()">HOÀN TẤT & QUAY VỀ</button>
      </div>
  `;

  const finalResultDiv = document.getElementById("final-ticket-result");
  if (finalResultDiv) {
    finalResultDiv.innerHTML = beautifulTicketHTML;
    window.goToBookingStep(4);
  }

  window.resetHoldState();
  selectedSeats = [];
  fnbMenu.forEach((i) => (i.qty = 0));
  window.renderFnbMenu();
  window.calculateCgvCart();
  window.renderCgvInterface();
};

window.cancelCurrentTransaction = function () {
  if (
    confirm(
      "Bạn có chắc chắn muốn hủy bỏ tiến trình giao dịch và giải phóng các ghế đang giữ này không?",
    )
  ) {
    window.resetHoldState();
    selectedSeats = [];
    fnbMenu.forEach((i) => (i.qty = 0));
    window.renderFnbMenu();
    window.calculateCgvCart();
    window.renderCgvInterface();
    alert("Đã hủy bỏ giao dịch thành công. Vị trí ghế rạp đã được giải phóng!");
  }
};

// --- 8. BỘ ĐẾM NGƯỢC THỜI GIAN VÀ KHỞI TẠO NỀN TẢNG ---
window.startCountdown = function (expiresAt) {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    const remain = expiresAt - Date.now();
    if (remain <= 0) {
      clearInterval(timerInterval);
      alert(
        "Đã hết thời gian giữ ghế quy định (5 phút)! Hệ thống tự động giải phóng vị trí phòng rạp.",
      );
      window.resetHoldState();
      selectedSeats = [];
      window.calculateCgvCart();
      window.renderCgvInterface();
      window.goToBookingStep(1);
    } else {
      const minutes = Math.floor(remain / 60000);
      const seconds = Math.floor((remain % 60000) / 1000);
      const timerStr = document.getElementById("timer-string");
      if (timerStr)
        timerStr.innerText = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }
  }, 1000);
};

window.resetHoldState = function () {
  clearInterval(timerInterval);
  isHoldingState = false;
  const holdTimerEl = document.getElementById("hold-timer");
  if (holdTimerEl) holdTimerEl.style.display = "none";
  const mainBtn = document.getElementById("btn-main-action");
  if (mainBtn) {
    mainBtn.innerText = "Tiếp tục";
    mainBtn.style.background = "#e71a0f";
  }
  window.currentBookingStep = 1;
};

// ==========================================================================
// MẢNG DỮ LIỆU TIN TỨC & ƯU ĐÃI ĐỘNG (CÓ THỂ LẤY TỪ BACKEND HOẶC MOCK TẠM)
// ==========================================================================
window.lasPromoList = [
  {
    id: "promo1",
    title: "Đeo Phone Chắc Tay - Nhận Quà Khủng Liền Tay",
    date: "05/06/2026 - 10/06/2026",
    image:
      "https://www.cgv.vn/media/catalog/product/cache/1/image/1800x/71252117777b696995f019344547b749/p/h/phong_ve_uu_dai_240x350_1_.jpg",
    content:
      "Chào mừng quý khách đến với ngày hội phụ kiện tại LAS Cinemas! Chỉ cần mang theo điện thoại có ốp lưng độc lạ khi mua vé xem phim, bạn sẽ có cơ hội bốc thăm trúng thưởng các phần quà công nghệ cực khủng như tai nghe không dây, sạc dự phòng thông minh và hàng ngàn voucher bắp nước miễn phí.<br><br><b>Điều kiện áp dụng:</b> Áp dụng cho mọi hội viên LAS đặt vé trực tuyến hoặc trực tiếp tại quầy trong khung thời gian diễn ra sự kiện.",
  },
  {
    id: "promo2",
    title: "Xem Phim Doraemon Nhận Ngay Móc Khóa Xinh Xắn",
    date: "06/06/2026 - 12/06/2026",
    image: "DORAEMON KEYCHAIN", // Sử dụng text nếu không có ảnh gốc
    content:
      "Siêu phẩm hoạt hình Doraemon đã chính thức đổ bộ! Khi mua combo bắp nước bất kỳ kèm theo 02 vé xem phim Doraemon phiên bản điện ảnh mới nhất, quý khách sẽ được tặng ngay 01 chiếc móc khóa Doraemon giới hạn độc quyền từ nhà phát hành.<br><br><b>Lưu ý:</b> Số lượng quà tặng có hạn, chương trình có thể kết thúc sớm hơn dự kiến nếu hết quà tại quầy.",
  },
  {
    id: "promo3",
    title: "Đổi Điểm LAS Rewards Nhận Voucher Giảm 25% Vexere",
    date: "05/06/2026 - 22/07/2026",
    image: "VEXERE VOUCHER 25%",
    content:
      "Sự kết hợp bùng nổ giữa LAS Cinemas và Vexere! Chỉ với 50 điểm thưởng tích lũy trên hệ thống LAS Rewards, bạn có thể đổi lấy ngay mã giảm giá giảm 25% (tối đa 50.000đ) khi đặt vé xe khách trực tuyến trên nền tảng Vexere.<br><br><b>Cách thức nhận mã:</b> Vào mục Đổi quà trên ứng dụng, chọn Voucher Vexere và bấm Xác nhận.",
  },
];

// Hàm tự động vẽ danh sách ưu đãi động ra ngoài trang chủ
// Tìm hàm này và sửa lại 2 dòng đầu hàm như sau:
window.renderLasPromoGrid = function () {
  // 🌟 FIX: Chỉ lấy duy nhất khung chứa của Tab Tin Tức, không lấy khung EVENT trang chủ nữa
  const promoNewsContainer = document.getElementById("cgv-event-grid-news");

  // Cào dữ liệu động trực tiếp từ Database SQL Server qua Spring Boot
  fetch("http://localhost:8080/api/promos")
    .then((res) => {
      if (!res.ok) throw new Error("Không thể kết nối API ưu đãi");
      return res.json();
    })
    .then((promosList) => {
      console.log("🎁 Đã nhận danh sách ưu đãi động từ Database:", promosList);

      window.lasPromoList = promosList;

      // 🌟 FIX: Chỉ xóa rỗng khung bên tab Tin tức trước khi vẽ
      if (promoNewsContainer) promoNewsContainer.innerHTML = "";

      window.lasPromoList.forEach((item) => {
        let validImg =
          item.imageUrl || item.image_url || item.image || item.img || "";
        validImg = validImg.trim();

        let dateString = `${item.startDate || item.start_date || "05/06/2026"} - ${item.endDate || item.end_date || "12/06/2026"}`;

        let imgHTML =
          validImg.startsWith("http") ||
          validImg.includes("/") ||
          validImg.includes(".")
            ? `<div class="news-card-img-holder" style="background-image: url('${validImg}'); background-size: cover; background-position: center; height: 200px; width: 100%; display: block;"></div>`
            : `<div class="news-card-img-holder" style="background: #a1dbf1; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #0c6291; font-size: 14px; height: 200px; width: 100%; text-align: center; padding: 0 10px; box-sizing: border-box;">${validImg || "LAS CINEMA"}</div>`;

        let cardHTML = `
          <div class="news-promo-card" onclick="window.viewPromoDetailText('${item.id}')" style="cursor: pointer; background: #fff; border: 1px solid #ddd; border-radius: 6px; overflow: hidden; transition: transform 0.2s; display: block; margin-bottom: 10px;">
              ${imgHTML}
              <div style="padding: 15px; text-align: left;">
                  <div class="news-card-date" style="color: #666; font-size: 12px; margin-bottom: 5px;">📅 ${dateString}</div>
                  <div class="news-card-title-text" style="font-weight: bold; font-size: 14px; color: #111; line-height: 1.4;">${item.title || "Chương trình ưu đãi"}</div>
              </div>
          </div>
        `;

        // 🌟 FIX: Chỉ đổ thẻ card vào khung Tab Tin tức, giữ nguyên vẹn mục EVENT thô ngoài trang chủ
        if (promoNewsContainer) promoNewsContainer.innerHTML += cardHTML;
      });
    })
    .catch((err) =>
      console.error("🚨 Lỗi khi kéo dữ liệu ưu đãi từ SQL Server: ", err),
    );
};

// ==========================================================================
// 🌟 THAY THẾ HOÀN TOÀN HÀM VIEWPROMODETAILTEXT CŨ THÀNH BẢN PRO NÀY:
// ==========================================================================
window.viewPromoDetailText = function (promoId) {
  if (!window.lasPromoList) return;

  // Tìm kiếm đối tượng bài viết ưu đãi khớp với ID click chuột
  const targetPromo = window.lasPromoList.find(
    (p) => String(p.id) === String(promoId),
  );
  if (!targetPromo) return;

  // 1. Đồng bộ Tiêu đề bài viết khuyên mãi
  const titleEl = document.getElementById("detail-promo-title");
  if (titleEl) {
    titleEl.innerText = targetPromo.title || "Chương trình ưu đãi đặc biệt";
  }

  // 2. Bọc giáp lỗi hiển thị ngày tháng (Quét sạch mọi kiểu đặt tên của Java & SQL)
  const dateEl = document.getElementById("detail-promo-date");
  if (dateEl) {
    let start = targetPromo.startDate || targetPromo.start_date || "";
    let end = targetPromo.endDate || targetPromo.end_date || "";
    if (start && end) {
      dateEl.innerText = "Thời gian áp dụng: " + start + " đến " + end;
    } else if (targetPromo.date) {
      dateEl.innerText = "Thời gian áp dụng: " + targetPromo.date;
    } else {
      dateEl.innerText = "Thời gian áp dụng: Đang diễn ra trong tháng";
    }
  }

  // 3. Đổ nội dung mô tả chi tiết chương trình ưu đãi rạp phim
  const contentEl = document.getElementById("detail-promo-content");
  if (contentEl) {
    contentEl.innerHTML =
      targetPromo.content || "Chưa có nội dung mô tả chi tiết chương trình.";
  }

  // 4. FIX TRIỆT ĐỂ LỖI POSTER: Vẽ ảnh full kích thước, xóa sạch chữ "IMAGE" thô
  // Tìm khối số 4 xử lý ảnh trong hàm window.viewPromoDetailText và sửa lại như sau:
  // 4. FIX TRIỆT ĐỂ LỖI POSTER: Sử dụng thẻ img trực tiếp để lấy trọn vẹn 100% hình ảnh không bị cắt tỉa
  const imgBoxEl = document.getElementById("detail-promo-img-box");
  if (imgBoxEl) {
    let validImg =
      targetPromo.imageUrl ||
      targetPromo.image_url ||
      targetPromo.image ||
      targetPromo.img ||
      "";
    validImg = validImg.trim();

    if (
      validImg.startsWith("http") ||
      validImg.includes("/") ||
      validImg.includes(".")
    ) {
      imgBoxEl.style.background = "none";
      imgBoxEl.style.backgroundImage = "none";

      // Sử dụng chiều rộng 100% của khung trái (360px) và để height tự động tính toán theo tỉ lệ đứng
      imgBoxEl.innerHTML = `<img src="${validImg}" style="width: 100%; height: auto; display: block; object-fit: cover;">`;
    } else {
      imgBoxEl.style.background = "#a1dbf1";
      imgBoxEl.style.display = "flex";
      imgBoxEl.style.alignItems = "center";
      imgBoxEl.style.justifyContent = "center";
      imgBoxEl.style.color = "#0c6291";
      imgBoxEl.style.fontWeight = "bold";
      imgBoxEl.style.minHeight = "450px"; // Tạo chiều cao giả lập đứng nếu không có ảnh
      imgBoxEl.innerHTML = `<b>${validImg || "LAS CINEMA"}</b>`;
    }
  }

  // Kích hoạt điều hướng nhảy chuyển phân vùng hiển thị Tab Panel
  window.switchCgvTab("panel-news-detail");
};

window.addEventListener("DOMContentLoaded", () => {
  window.renderLasPromoGrid();
});

function generateCgvDateSlider() {
  const container = document.getElementById("cgv-dynamic-date-slider");
  if (!container) return;
  container.innerHTML = "";

  container.style.display = "flex";
  container.style.gap = "10px";
  container.style.overflowX = "auto";
  container.style.paddingBottom = "10px";
  const daysOfWeek = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  const now = new Date(2026, 5, 8);
  for (let i = 0; i < 30; i++) {
    const targetDate = new Date(2026, 5, 8);
    targetDate.setDate(now.getDate() + i);

    const month = (targetDate.getMonth() + 1).toString().padStart(2, "0");
    const dateNum = targetDate.getDate().toString().padStart(2, "0");
    const dayName = daysOfWeek[targetDate.getDay()];
    const fullDateId = `2026-${month}-${dateNum}`;

    if (i === 0 && !selectedDateStr) {
      selectedDateStr = fullDateId;
    }
    const bg = selectedDateStr === fullDateId ? "#111" : "#fff";
    const color = selectedDateStr === fullDateId ? "#fff" : "#555";
    const border = selectedDateStr === fullDateId ? "#111" : "#ccc";
    container.innerHTML += `
          <div style="flex: 0 0 auto; min-width: 60px; background:${bg}; color:${color}; border:2px solid ${border}; border-radius:6px; cursor:pointer; text-align:center; padding: 10px 5px; box-sizing: border-box; transition: all 0.2s;"
          onclick="selectCgvBookingDate('${fullDateId}')">
              <div style="font-size:11px; margin-bottom: 2px;">${dayName}</div>
              <div style="font-size:22px; font-weight:bold; line-height: 1;">${dateNum}</div>
              <div style="font-size:11px; margin-top: 3px;">Th ${month}</div>
          </div>
      `;
  }
}

function startCountdown(expiresAt) {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    const remain = expiresAt - Date.now();
    if (remain <= 0) {
      clearInterval(timerInterval);
      alert("Hết thời gian giữ ghế 5 phút!");
      resetHoldState();
      selectedSeats = [];
      calculateCgvCart();
    } else {
      const minutes = Math.floor(remain / 60000);
      const seconds = Math.floor((remain % 60000) / 1000);
      document.getElementById("timer-string").innerText =
        `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }
  }, 1000);
}

function resetHoldState() {
  clearInterval(timerInterval);
  isHoldingState = false;
  document.getElementById("hold-timer").style.display = "none";
  document.getElementById("btn-main-action").innerText =
    "Giữ Ghế Tạm Temporarily";
  document.getElementById("btn-main-action").style.background = "#e71a0f";
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
    input.style.border = "1px solid var(--cgv-red)";
    input.style.background = "#fff";
  });
  document.getElementById("btn-save-profile").style.display = "block";
}

function openOtpModal() {
  document.getElementById("otp-modal").classList.add("open");
}
function closeOtpModal() {
  document.getElementById("otp-modal").classList.remove("open");
}

function submitOtpVerification() {
  const otpInput = document.getElementById("otp-input-field").value.trim();
  if (!otpInput) return alert("Vui lòng nhập mã OTP gồm 6 chữ số!");
  if (!temporaryRegisterEmail)
    return alert("Hệ thống không tìm thấy email đăng ký hợp lệ!");
  fetch("http://localhost:8080/api/register/verify-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: temporaryRegisterEmail, otp: otpInput }),
  })
    .then((res) => {
      if (!res.ok) {
        return res.json().then((err) => {
          throw new Error(err.message || "Xác thực thất bại!");
        });
      }
      return res.json();
    })
    .then((resData) => {
      if (resData.status === "success") {
        alert(resData.message);
        closeOtpModal();
        openAuthModal();
        toggleAuthTab("login");
      }
    })
    .catch((err) => alert("❌ Lỗi OTP: " + err.message));
}

function saveUpdatedProfileInformationData() {
  document.querySelectorAll(".profile-readonly-input").forEach((input) => {
    input.setAttribute("readonly", true);
    input.style.border = "1px solid #ccc";
    input.style.background = "#f4f2ec";
  });
  document.getElementById("btn-save-profile").style.display = "none";
  alert("Cập nhật thông tin tài khoản mới thành công!");
}

let currentForgotIdentifier = "";

function openForgotModal() {
  document.getElementById("forgot-modal").classList.add("open");
  document.getElementById("forgot-step-1").style.display = "block";
  document.getElementById("forgot-step-2").style.display = "none";
  document.getElementById("forgot-identifier").value = "";
  document.getElementById("forgot-otp-input").value = "";
  document.getElementById("forgot-new-password").value = "";
}

function closeForgotModal() {
  document.getElementById("forgot-modal").classList.remove("open");
}

// Gọi API gửi OTP
function requestForgotOtp() {
  const identifier = document.getElementById("forgot-identifier").value.trim();
  if (!identifier) return alert("Vui lòng nhập Email hoặc Số điện thoại!");

  fetch("http://localhost:8080/api/forgot-password/request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: identifier }),
  })
    .then((res) =>
      res.json().then((data) => ({ status: res.status, body: data })),
    )
    .then((res) => {
      if (res.status === 200) {
        alert(res.body.message + "\n(Hãy kiểm tra Console của Spring Boot)");
        currentForgotIdentifier = identifier;
        // Chuyển sang Bước 2
        document.getElementById("forgot-step-1").style.display = "none";
        document.getElementById("forgot-step-2").style.display = "block";
      } else {
        alert("Lỗi: " + res.body.message);
      }
    })
    .catch((err) => alert("Lỗi kết nối Server!"));
}

// Gọi API Đổi mật khẩu
function submitNewPassword() {
  const otp = document.getElementById("forgot-otp-input").value.trim();
  const newPassword = document.getElementById("forgot-new-password").value;

  if (!otp || !newPassword)
    return alert("Vui lòng điền đầy đủ OTP và Mật khẩu mới!");

  fetch("http://localhost:8080/api/forgot-password/reset", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      identifier: currentForgotIdentifier,
      otp: otp,
      newPassword: newPassword,
    }),
  })
    .then((res) =>
      res.json().then((data) => ({ status: res.status, body: data })),
    )
    .then((res) => {
      if (res.status === 200) {
        alert(res.body.message);
        closeForgotModal();
        openAuthModal(); // Mở lại bảng đăng nhập cho khách login
        toggleAuthTab("login");
      } else {
        alert("Lỗi: " + res.body.message);
      }
    })
    .catch((err) => alert("Lỗi kết nối Server!"));
}

window.switchCgvTab = switchCgvTab;
window.handleBreadcrumbBack = handleBreadcrumbBack;
window.quickBookMovie = quickBookMovie;
window.viewMovieDetailText = viewMovieDetailText;
window.selectTime = selectTime;
window.executeMovieRealTimeSearch = executeMovieRealTimeSearch;
window.selectCgvBookingDate = selectCgvBookingDate;
window.switchMovieFilterTab = switchMovieFilterTab;
window.handleAuthModalAccess = openAuthModal;
window.closeAuthModal = closeAuthModal;
window.toggleAuthTab = toggleAuthTab;
window.submitCgvLogin = submitCgvLogin;
window.submitCgvRegister = submitCgvRegister;
window.toggleRegPasswordState = toggleRegPasswordState;
window.generateNewLoginCaptcha = generateNewLoginCaptcha;
window.generateNewRegisterCaptcha = generateNewRegisterCaptcha;
window.openOtpModal = openOtpModal;
window.closeOtpModal = closeOtpModal;
window.submitOtpVerification = submitOtpVerification;
window.handleProfileTabAccess = handleProfileTabAccess;
window.handleTicketViewAccess = handleTicketViewAccess;
window.switchProfileSubTab = switchProfileSubTab;
window.activateEditableFormFields = activateEditableFormFields;
window.saveUpdatedProfileInformationData = saveUpdatedProfileInformationData;
window.handleCgvLogout = handleCgvLogout;
window.closeLogoutConfirmModal = closeLogoutConfirmModal;
window.confirmCgvLogoutAction = confirmCgvLogoutAction;
window.openCheckoutReview = openCheckoutReview;
window.closeCheckoutReview = closeCheckoutReview;
window.applyVoucher = applyVoucher;
window.processToPaymentGateway = processToPaymentGateway;
window.closePaymentModal = closePaymentModal;
window.executeFinalCheckout = executeFinalCheckout;
window.cancelCurrentTransaction = cancelCurrentTransaction;
window.viewHistoryDetail = viewHistoryDetail;
window.closeHistoryDetailModal = closeHistoryDetailModal;
window.updateComboQty = updateComboQty;
window.moveBannerLeft = moveBannerLeft;
window.moveBannerRight = moveBannerRight;

function goHomeFromBc() {
  cgvNavigationHistory = ["panel-movies"];
  switchCgvTab("panel-movies", "now_showing");
}
window.goHomeFromBc = goHomeFromBc;
