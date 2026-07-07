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

// ==========================================================================
// 🌟 THẦN CHÚ KHÔI PHỤC SESSION: Ép tài khoản luôn luôn đăng nhập khi Reload
// ==========================================================================
window.syncUserLoginSession = function () {
  const cachedUser = localStorage.getItem("las_logged_in_user");
  if (cachedUser) {
    isUserLoggedInState = true;
    const uData = JSON.parse(cachedUser);

    // Điền thông tin giao diện thanh điều hướng (Giữ nguyên logic UI)
    const authLinkBox = document.getElementById("top-bar-auth-link");
    if (authLinkBox) {
      authLinkBox.onclick = () => switchCgvTab("panel-profile");
      authLinkBox.style.cursor = "pointer";
      authLinkBox.innerHTML = `
          <span class="sub-nav-icon"></span> XIN CHÀO, ${uData.fullName.toUpperCase()}!
          <span onclick="handleCgvLogout(event)" style="color: #5b9dff; margin-left: 8px; cursor: pointer; text-decoration: underline; font-weight: bold;">THOÁT</span>
      `;
    }
    if (document.getElementById("top-bar-ticket-link")) {
      document.getElementById("top-bar-ticket-link").innerHTML =
        `<span class="sub-nav-icon"></span> LỊCH SỬ GIAO DỊCH`;
    }

    // 🚀 ĐỒNG BỘ DỮ LIỆU ĐÃ ĐƯỢC CHUẨN HÓA TỪ DATABASE
    const accountId = uData.account_id || uData.accountId;
    if (accountId) {
      fetch(`http://localhost:8080/api/bookings/user/${accountId}`)
        .then((res) => {
          if (!res.ok) throw new Error("Thất bại khi lấy dữ liệu từ DB");
          return res.json();
        })
        .then((dbBookings) => {
          // Map chính xác các thuộc tính sạch từ backend trả về
          window.userPastInvoices = dbBookings.map((b) => ({
            id: "BK-" + b.bookingId,
            movie: b.movieTitle, // Lấy từ kết quả JOIN movie
            date: new Date(b.bookingDate).toLocaleDateString("vi-VN"), // Ngày đặt thực tế trong DB
            time: b.showStartTime, // Giờ chiếu thực tế lấy từ bảng showtime chứ không lấy biến tạm b.js
            seats: b.reservedSeats ? b.reservedSeats.split(", ") : [], // Mảng ghế thật trích từ ticket + seat
            fnb: [], // Có thể bổ sung orderdetail food sau nếu cần
            total: b.totalMoney,
            status:
              b.paymentStatus === "SUCCESS" || b.paymentStatus === "COMPLETELY"
                ? "Đã thanh toán"
                : "Chờ xử lý",
          }));

          // Gọi hàm render hiển thị giao diện lịch sử trong Profile
          if (typeof renderTransactionHistory === "function") {
            renderTransactionHistory();
          }
        })
        .catch((err) =>
          console.error(
            "🚨 Lỗi nghiêm trọng khi đồng bộ phiên làm việc từ DB:",
            err,
          ),
        );
    }
  }
};

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
// Khởi chạy khi tải trang và phục hồi trạng thái từ LocalStorage tránh lỗi refresh mất biến
window.addEventListener("DOMContentLoaded", () => {
  const daySelect = document.getElementById("reg-birth-day");
  const monthSelect = document.getElementById("reg-birth-month");
  const yearSelect = document.getElementById("reg-birth-year");
  generateCgvDateSlider();
  renderFnbMenu();

  if (daySelect && monthSelect && yearSelect) {
    for (let i = 1; i <= 31; i++)
      daySelect.innerHTML += `<option value="${i}">${i}</option>`;
    for (let i = 1; i <= 12; i++)
      monthSelect.innerHTML += `<option value="${i}">Tháng ${i}</option>`;
    for (let i = 2026; i >= 1950; i--)
      yearSelect.innerHTML += `<option value="${i}">${i}</option>`;
  }

  loadBannersFromDatabase();
  startAutoBannerSlider();

  if (typeof switchCgvTab === "function")
    switchCgvTab("panel-movies", "now_showing");
  window.fetchSyncData();

  // 🌟 KHÓA TRÌ HOÃN 150MS: Đợi các file JS khác nạp xong giao diện mặc định rồi mới khôi phục Đăng Nhập
  setTimeout(() => {
    window.syncUserLoginSession();

    // ĐÓN KẾT QUẢ VNPAY-CALLBACK TRẢ VỀ ĐỂ ĐIỀU HƯỚNG BƯỚC 4
  }, 150);
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
    const inCart = item.qty > 0;
    const bullets = (item.items || []).map((t) => `<li>${t}</li>`).join("");
    const control = inCart
      ? `<div class="fnb-stepper">
            <button class="fnb-step-btn" onclick="updateComboQty(${index}, -1)">−</button>
            <span class="fnb-step-qty">×${item.qty}</span>
            <button class="fnb-step-btn fnb-step-plus" onclick="updateComboQty(${index}, 1)">+</button>
         </div>`
      : `<button class="fnb-add-btn" onclick="updateComboQty(${index}, 1)">＋ Thêm vào đơn</button>`;
    container.innerHTML += `
      <div class="fnb-card ${inCart ? "fnb-card-active" : ""}">
        <div class="fnb-card-head">
          <div class="fnb-card-icon">${item.icon}</div>
          ${item.popular ? `<span class="fnb-tag-popular">Phổ biến</span>` : ""}
          <span class="fnb-card-price">${item.price.toLocaleString("vi-VN")}đ</span>
        </div>
        <h4 class="fnb-card-title">${item.name}</h4>
        ${item.desc ? `<p class="fnb-card-desc">${item.desc}</p>` : ""}
        ${bullets ? `<ul class="fnb-card-list">${bullets}</ul>` : ""}
        <div class="fnb-card-action">${control}</div>
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
  const fnbItems = fnbMenu.filter((i) => i.qty > 0);
  let fnbHtml = fnbItems
    .map(
      (i) =>
        `<div class="inv-fnb"><span>${i.name} × ${i.qty}</span><span>${(i.price * i.qty).toLocaleString("vi-VN")} đ</span></div>`,
    )
    .join("");
  document.getElementById("review-invoice-content").innerHTML = `
      <div class="inv-review">
        <div class="inv-line"><span class="inv-k">🎬 Phim</span><span class="inv-v">${currentMovie || "—"}</span></div>
        <div class="inv-line"><span class="inv-k">🕐 Suất chiếu</span><span class="inv-v">${selectedDateStr} | ${selectedShowtime}</span></div>
        <div class="inv-line"><span class="inv-k">💺 Ghế</span><span class="inv-v">${selectedSeats.join(", ") || "—"}</span></div>
        <div class="inv-line"><span class="inv-k">🍿 Bắp nước</span><span class="inv-v">${fnbItems.length ? "" : "Không có"}</span></div>
        ${fnbHtml}
        <div class="inv-total"><span>Tổng cộng (chưa giảm)</span><span class="inv-total-amt">${currentPriceTotal.toLocaleString("vi-VN")} đ</span></div>
      </div>
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

function closePaymentModal() {
  document.getElementById("payment-redirect-modal").classList.remove("open");
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
      '<p style="color:#9a9aa3; font-size: 13px;">Bạn chưa thực hiện giao dịch mua vé trực tuyến nào gần đây.</p>';
    return;
  }

  historyZone.innerHTML = "";
  userPastInvoices.forEach((inv) => {
    // 🌟 FIX LỖI TÀNG HÌNH: Ép màu chữ sáng trên nền tối thay vì màu mặc định của trình duyệt
    const movieName = inv.movie ? inv.movie : "Vé xem phim LAS Cinemas";
    const isPaid = inv.status === "Đã thanh toán";
    const statusClass = isPaid ? "history-badge-success" : "history-badge-pending";
    historyZone.innerHTML += `
          <div class="history-card-item">
              <div class="history-card-icon">🎬</div>
              <div class="history-card-main">
                  <div class="history-card-top-row">
                      <h4 class="history-card-title">${movieName}</h4>
                      <span class="history-badge ${statusClass}">${inv.status}</span>
                  </div>
                  <div class="history-card-meta">
                      <span>Mã ĐH: <b>${inv.id}</b></span>
                      <span>📅 ${inv.date}</span>
                      ${inv.time ? `<span>🕐 ${inv.time}</span>` : ""}
                      ${inv.seats && inv.seats.length ? `<span>💺 ${inv.seats.join(", ")}</span>` : ""}
                  </div>
              </div>
              <div class="history-card-side">
                  <b class="history-card-total">${(inv.total || 0).toLocaleString("vi-VN")} đ</b>
                  <button class="history-card-btn" onclick="viewHistoryDetail('${inv.id}')">Xem chi tiết</button>
              </div>
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
  // 🌟 DỌN SẠCH LOCALSTORAGE KHI THOÁT
  localStorage.removeItem("las_logged_in_user");
  localStorage.removeItem("las_user_invoices");
  localStorage.removeItem("las_current_booking_cache");
  const authLinkBox = document.getElementById("top-bar-auth-link");
  authLinkBox.removeAttribute("style");
  authLinkBox.onclick = openAuthModal;
  authLinkBox.innerHTML = `<span class="sub-nav-icon"></span> ĐĂNG NHẬP/ ĐĂNG KÝ`;
  document.getElementById("top-bar-ticket-link").innerHTML =
    `<span class="sub-nav-icon"></span> LỊCH SỬ GIAO DỊCH`;
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
localStorage.setItem("las_logged_in_user", JSON.stringify(uData));
        sessionStorage.setItem("roleId", uData.roleId);

        // 🌟 ĐIỀU HƯỚNG DỰA TRÊN ROLE
        if (uData.roleId === 2) {
          window.location.href = "admin.html";
          return; // Dừng hàm ngay lập tức
        } else if (uData.roleId === 1) {
          window.location.href = "manager.html";
          return; // Dừng hàm ngay lập tức
        }
        alert(`Chào mừng thành viên: ${uData.fullName} đăng nhập thành công!`);
        closeAuthModal();

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
        if (uData.roleId === 1) roleString = "Quản lý hệ thống (ADMIN)";
        if (uData.roleId === 2) roleString = "Nhân viên cụm rạp (STAFF)";

        if (document.getElementById("profile-summary-avatar")) {
          document.getElementById("profile-summary-avatar").innerText =
            uData.fullName.split(" ").pop().substring(0, 2).toUpperCase();
        }

        const welcomeNameBox = document.getElementById("profile-welcome-name");
        if (welcomeNameBox)
          welcomeNameBox.innerText = uData.fullName;

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
        // 🌟 GHIM LẠI LÊN Ổ CỨNG TRÌNH DUYỆT:
        localStorage.setItem("las_logged_in_user", JSON.stringify(uData));
        localStorage.setItem(
          "las_user_invoices",
          JSON.stringify(userPastInvoices),
        );
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

function onMovieOrTimeChange() {
  resetHoldState();
  selectedSeats = [];
  calculateCgvCart();

  // ❌ KHÔNG render lại toàn bộ UI nữa
  // window.renderCgvInterface();
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
    // 🌟 PHÒNG THỦ: Ép quy trình đặt vé luôn luôn hiển thị Bước 1 (Chọn ghế) khi truy cập tab Đặt Vé
    if (
      !window.isVnpayReturn &&
      typeof window.resetBookingWizard === "function"
    ) {
      window.resetBookingWizard();
    }

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

  if (
    !selectedShowtime &&
    serverData.showtimes.length > 0 &&
    !window.currentSelectedShowtimeId
  ) {
    selectedShowtime = serverData.showtimes[0];
  }

  // 2. Tự động kích hoạt ma trận 40 ghế rạp trống (A1 -> D10) nếu dữ liệu ghế rạp đang trống rỗng
  if (!serverData.masterSeatStore) serverData.masterSeatStore = {};
  const seatKey = window.currentSelectedShowtimeId || selectedShowtime;

  if (activeMovieTitle && seatKey) {
    if (!serverData.masterSeatStore[activeMovieTitle])
      serverData.masterSeatStore[activeMovieTitle] = {};
    if (
      !serverData.masterSeatStore[activeMovieTitle][seatKey] ||
      Object.keys(serverData.masterSeatStore[activeMovieTitle][seatKey])
        .length === 0
    ) {
      let activeSeatMap = {};
      ["A", "B", "C", "D"].forEach((row) => {
        for (let i = 1; i <= 10; i++) {
          activeSeatMap[`${row}${i}`] = { status: "available" };
        }
      });
      serverData.masterSeatStore[activeMovieTitle][seatKey] = activeSeatMap;
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
                            <span class="status-pill-badge ${isNowShowing ? "status-pill-showing" : "status-pill-soon"}">${isNowShowing ? "Đang chiếu" : "Sắp chiếu"}</span>
                            <div class="rank-ribbon ${ribbonColor}">${rankCounter}</div>
                            <div class="poster-main-body-img" onclick="viewMovieDetailText('${titleStr}', '${genreStr}')" style="background: #111; width: 100%; height: 100%;">
                                <img src="${cleanImgUrl}" alt="${titleStr}" style="width: 100%; height: 100%; object-fit: cover; display: block;">
                            </div>
                        </div>
                        <div class="movie-spec-info-text">
                            <h3 class="movie-spec-title" onclick="viewMovieDetailText('${titleStr}', '${genreStr}')">${titleStr}</h3>
                            <p>Thể loại: <b>${genreStr}</b></p>
                            ${m.duration ? `<p class="movie-spec-duration">⏱ ${m.duration} phút</p>` : ""}
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
    const seatKey = window.currentSelectedShowtimeId || selectedShowtime;

    const activeSeatMap =
      serverData.masterSeatStore[currentMovie]?.[seatKey] || {};

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
      mainBtn.style.background = "#ff6b35";
    }
    if (backBtn) {
      backBtn.innerText = "←";
      backBtn.setAttribute("onclick", "window.goHomeFromBc()");
    }
  } else if (step === 2) {
    if (mainBtn) {
      mainBtn.innerText = "Đến Thanh Toán";
      mainBtn.style.background = "#ff6b35";
    }
    if (backBtn) {
      backBtn.innerText = "←";
      backBtn.setAttribute("onclick", "window.goToBookingStep(1)");
    }
  } else if (step === 3) {
    if (mainBtn) {
      mainBtn.innerText = "Thanh Toán Ngay";
      mainBtn.style.background = "#10B981";
    }
    if (backBtn) {
      backBtn.innerText = "←";
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
      const _fnbItems = fnbMenu.filter((i) => i.qty > 0);
      const _fnbRows = _fnbItems
        .map(
          (i) =>
            `<div class="inv-fnb"><span>${i.name} × ${i.qty}</span><span>${(i.price * i.qty).toLocaleString("vi-VN")} đ</span></div>`,
        )
        .join("");
      reviewInvoiceContentEl.innerHTML = `
            <div class="inv-review">
              <div class="inv-line"><span class="inv-k">🎬 Phim</span><span class="inv-v">${currentMovie || "—"}</span></div>
              <div class="inv-line"><span class="inv-k">🕐 Suất chiếu</span><span class="inv-v">${selectedDateStr} | ${selectedShowtime}</span></div>
              <div class="inv-line"><span class="inv-k">💺 Ghế</span><span class="inv-v">${selectedSeats.join(", ") || "—"}</span></div>
              <div class="inv-line"><span class="inv-k">🍿 Bắp nước</span><span class="inv-v">${_fnbItems.length ? "" : "Không có"}</span></div>
              ${_fnbRows}
              <div class="inv-total"><span>Tổng cộng (chưa giảm)</span><span class="inv-total-amt">${currentPriceTotal.toLocaleString("vi-VN")} đ</span></div>
            </div>
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
  if (window.currentBookingStep === 1) {
    if (selectedSeats.length === 0) {
      alert("Vui lòng chọn ít nhất một ghế ngồi trước khi tiếp tục!");
      return;
    }

    // 🌟 ÉP BUỘC ĐĂNG NHẬP: Nếu chưa đăng nhập thì chặn đứng tiến trình và mở bảng Login lập tức
    if (!isUserLoggedInState) {
      alert(
        "Vui lòng đăng nhập tài khoản thành viên LAS Cinemas trước khi tiến hành chọn bắp nước và đặt vé!",
      );
      if (typeof window.handleAuthModalAccess === "function") {
        window.handleAuthModalAccess(); // Mở bảng đăng nhập/đăng ký
      }
      return;
    }

    window.goToBookingStep(2);
  } else if (window.currentBookingStep === 2) {
    window.goToBookingStep(3);
  } else if (window.currentBookingStep === 3) {
    if (typeof window.processToPaymentGateway === "function") {
      window.processToPaymentGateway();
    }
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
  // 🌟 FIX HOÀN TIỀN/BĂNG HÌNH: Giải phóng giỏ hàng cũ và ép giao diện đặt vé quay ngược về Bước 1 (Chọn ghế)
  selectedSeats = [];
  currentPriceTotal = 0;
  appliedVoucherDiscount = 0;
  window.calculateCgvCart();
  window.goToBookingStep(1);

  window.switchCgvTab("panel-booking");
  const selectCombo = document.getElementById("cgv-combo-movie");
  if (selectCombo) {
    selectCombo.value = movieTitle;
    window.onMovieOrTimeChange();
  }
};

// ==========================================================================
// 🌟 XỬ LÝ SỰ KIỆN TÍCH CHỌN PHƯƠNG THỨC THANH TOÁN ONLINE
// ==========================================================================
window.selectPaymentGatewayType = function (type, element) {
  window.selectedPaymentGateway = type;
  console.log("💳 Người dùng chọn phương thức:", type);

  const allRows = document.querySelectorAll(".payment-option-row");
  allRows.forEach((row) => {
    row.classList.remove("active");
    const circle = row.querySelector(".option-check-circle");
    if (circle) {
      circle.style.borderColor = "#ccc";
      circle.style.color = "transparent";
    }
  });

  if (element) {
    element.classList.add("active");
    const circle = element.querySelector(".option-check-circle");
    if (circle) {
      circle.style.borderColor = "#ff6b35";
      circle.style.color = "#ff6b35";
    }
  }
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
// ==========================================================================
// 🌟 HÀM RẼ NHÁNH THANH TOÁN TOÀN DIỆN (SỬA LỖI ĐÈ HÀM & HIỂN THỊ VNPAY)
// ==========================================================================

/*window.processToPaymentGateway = function () {
  if (!window.selectedPaymentGateway) window.selectedPaymentGateway = "qr";

  const finalTotal = currentPriceTotal * (1 - appliedVoucherDiscount);

  // 🚀 TRƯỜNG HỢP 1: THANH TOÁN QUA VNPAY (QR HOẶC ATM) -> CHUYỂN HƯỚNG TRÌNH DUYỆT
  if (
    window.selectedPaymentGateway === "vnpay_qr" ||
    window.selectedPaymentGateway === "vnpay_atm"
  ) {
    let bankCodeParam = "ALL";
    if (window.selectedPaymentGateway === "vnpay_qr") bankCodeParam = "VNPAYQR";
    if (window.selectedPaymentGateway === "vnpay_atm") bankCodeParam = "VNBANK";

    console.log(
      "✈️ Gọi API Spring Boot sinh Link VNPAY Sandbox, số tiền:",
      finalTotal,
    );

    fetch(
      `http://localhost:8080/api/payment/create-vnpay-url?amount=${finalTotal}&bankCode=${bankCodeParam}`,
    )
      .then((res) => {
        if (!res.ok)
          throw new Error("Không thể kết nối cổng API tạo hóa đơn VNPAY!");
        return res.json();
      })
      .then((data) => {
        if (data && data.paymentUrl) {
          alert(
            "Hệ thống chuyển hướng an toàn sang cổng bảo mật VNPAY Sandbox...",
          );
          const bookingCache = {
            movie: document.getElementById("cgv-combo-movie").value,
            showtime: selectedShowtime,
            seats: [...selectedSeats],
            date: selectedDateStr,
            fnb: fnbMenu.filter((i) => i.qty > 0).map((i) => ({ ...i })),
            total: currentPriceTotal * (1 - appliedVoucherDiscount),
          };
          localStorage.setItem(
            "las_current_booking_cache",
            JSON.stringify(bookingCache),
          );

          window.location.href = data.paymentUrl; // 🚀 CHUYỂN HƯỚNG BÌNH THƯỜNG
        }
      })
      .catch((err) => alert("Lỗi kết nối cổng VNPAY: " + err.message));

    // 🚀 TRƯỜNG HỢP 2: THANH TOÁN CHUYỂN KHOẢN TIÊU CHUẨN (VIETQR) -> BUNG MODAL POPUP
  } else if (window.selectedPaymentGateway === "qr") {
    const modalTitle = document.querySelector("#payment-redirect-modal h2");
    if (modalTitle) modalTitle.innerHTML = "Thanh Toán Chuyển Khoản VietQR";

    const qrPriceText = document.getElementById("qr-total-price");
    if (qrPriceText)
      qrPriceText.innerText = finalTotal.toLocaleString("vi-VN") + " đ";

    const bankId = "NCB";
    const accountNo = "9704198526191432198";
    const accountName = "NGUYEN VAN A";
    const qrData = `LAS CINEMAS THANH TOAN VE`;

    const qrImg = document.getElementById("bank-qr-img");
    if (qrImg) {
      qrImg.src = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact.png?amount=${finalTotal}&addInfo=${encodeURIComponent(qrData)}&accountName=${encodeURIComponent(accountName)}`;
    }
    document.getElementById("payment-redirect-modal").classList.add("open");
  }
};*/

window.executeFinalCheckout = function () {
  const cachedBooking = localStorage.getItem("las_current_booking_cache");
  const pending = JSON.parse(localStorage.getItem("pending_booking"));

  let currentMovie = pending
    ? pending.movie
    : document.getElementById("cgv-combo-movie").value;
  let ticketSeats = pending ? [...pending.seats] : [...selectedSeats];

  let ticketShowtime = pending ? pending.showtime : selectedShowtime;
  let ticketDate = selectedDateStr;
  let ticketFnb = fnbMenu.filter((i) => i.qty > 0).map((i) => ({ ...i }));
  let ticketTotal = currentPriceTotal * (1 - appliedVoucherDiscount);

  if (cachedBooking) {
    const bData = JSON.parse(cachedBooking);
    currentMovie = bData.movie;
    ticketSeats = bData.seats;
    ticketShowtime = bData.showtime;
    ticketDate = bData.date;
    ticketFnb = bData.fnb;
    ticketTotal = bData.total;
  }

  // 🌟 TUYỆT CHIÊU BẢO VỆ: Lấy email trực tiếp từ ổ cứng lưu trữ chứ không lấy từ ô Input giao diện nữa
  let currentEmail = "VienNguyen2026@gmail.com";
  const cachedUser = localStorage.getItem("las_logged_in_user");
  if (cachedUser) {
    currentEmail = JSON.parse(cachedUser).email;
  }

  console.log(
    "📥 Đang gửi lệnh lưu hóa đơn vé xuống Database SQL Server cho Email:",
    currentEmail,
  );

  fetch("http://localhost:8080/api/seats/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      movie: currentMovie,
      showtime: ticketShowtime,
      seats: ticketSeats,
      email: currentEmail,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      // Sinh mã hóa đơn hiển thị rạp phim ngẫu nhiên
      const lasTicketId = "LAS-" + Math.floor(100000 + Math.random() * 900000);
      console.log("currentPriceTotal =", currentPriceTotal);
      console.log("appliedVoucherDiscount =", appliedVoucherDiscount);
      const invoiceObj = {
        id: lasTicketId,
        movie: currentMovie,
        date: ticketDate,
        time: ticketShowtime,
        seats: [...ticketSeats],
        fnb: ticketFnb,
        total: ticketTotal,
        status: "Đã thanh toán (VNPAY)",
      };

      userPastInvoices.unshift(invoiceObj);
      localStorage.setItem(
        "las_user_invoices",
        JSON.stringify(userPastInvoices),
      );

      let fnbTicketHtml = invoiceObj.fnb
        .map((i) => `<li>${i.name} × ${i.qty}</li>`)
        .join("");
      const seatBadgesH = invoiceObj.seats
        .map((s) => `<span class="bc-seat-badge">${s}</span>`)
        .join("");

      const beautifulTicketHTML = `
          <div class="bc-confirm">
            <div class="bc-hero">
              <div class="bc-check">✓</div>
              <h2 class="bc-title">Đặt Vé Thành Công!</h2>
              <p class="bc-subtitle">Vé xem phim của bạn đã được đặt thành công.</p>
              <div class="bc-id-pill">Mã vé: ${invoiceObj.id}</div>
            </div>
            <div class="bc-card">
              <div class="bc-card-head">🎫 Thông tin vé</div>
              <div class="bc-movie">${invoiceObj.movie}</div>
              <div class="bc-meta">
                <span>📅 ${invoiceObj.date}</span>
                <span>🕐 ${invoiceObj.time}</span>
                <span>💺 ${invoiceObj.seats.length} ghế</span>
              </div>
              <div class="bc-section-label">Ghế đã chọn</div>
              <div class="bc-seats">${seatBadgesH}</div>
              <div class="bc-section-label">Bắp nước</div>
              <ul class="bc-fnb">${fnbTicketHtml || "<li>Không có</li>"}</ul>
              <div class="bc-qr-row">
                <img class="bc-qr" src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(invoiceObj.id)}" alt="QR vé">
                <div class="bc-qr-note">Xuất trình mã QR này tại quầy soát vé.<br>Bản sao đã được gửi vào Email của bạn.</div>
              </div>
              <div class="bc-total-row">
                <span>Đã thanh toán</span>
                <span class="bc-total-amt">${invoiceObj.total.toLocaleString("vi-VN")} đ</span>
              </div>
            </div>
            <div class="bc-info-box">
              <div class="bc-info-title">ℹ️ Thông tin quan trọng</div>
              <ul>
                <li>Vui lòng đến rạp trước giờ chiếu ít nhất 15 phút.</li>
                <li>Mang theo giấy tờ tùy thân (CCCD) nếu phim giới hạn độ tuổi.</li>
                <li>Không mang đồ ăn, thức uống bên ngoài vào rạp.</li>
                <li>Vé không hoàn/đổi trong vòng 2 giờ trước suất chiếu.</li>
              </ul>
            </div>
            <div class="bc-actions">
              <button class="bc-btn bc-btn-primary" onclick="window.print()">⬇ Tải / In vé</button>
              <button class="bc-btn bc-btn-ghost" onclick="window.goHomeFromBc()">Về trang chủ</button>
            </div>
          </div>
      `;

      const finalResultDiv = document.getElementById("final-ticket-result");
      if (finalResultDiv) {
        finalResultDiv.innerHTML = beautifulTicketHTML;
      }

      // 🚀 CHUYỂN TAB VÀ NHẢY BƯỚC 4 MƯỢT MÀ KHÔNG BỊ CHẶN LẠI NỮA
      window.switchCgvTab("panel-booking");
      window.goToBookingStep(4);

      // Giải phóng giỏ hàng tạm sau khi đã xuất vé điện tử thành công
      localStorage.removeItem("las_current_booking_cache");
      localStorage.removeItem("pending_booking");
      selectedSeats = [];
      fnbMenu.forEach((i) => (i.qty = 0));
      window.renderFnbMenu();
      window.calculateCgvCart();
      window.renderCgvInterface();
      window.renderTransactionHistory();
    })
    .catch((err) => {
      console.error("🚨 Lỗi lưu Database hóa đơn:", err);
      alert(
        "Hệ thống đã nhận tiền thanh toán VNPAY, tuy nhiên Server CSDL SQL Server gặp lỗi rò rỉ đồng bộ. Vui lòng liên hệ Admin!",
      );
    });
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
    mainBtn.style.background = "#ff6b35";
  }
  window.currentBookingStep = 1;
};
// ==========================================================================
// 🌟 HÀM RESET TOÀN BỘ QUY TRÌNH ĐẶT VÉ VỀ TRẠNG THÁI BAN ĐẦU
// ==========================================================================
window.resetBookingWizard = function () {
  console.log(
    "🔄 Đang dọn dẹp trạng thái hóa đơn cũ để chuẩn bị mua vé mới...",
  );

  // 1. Reset các biến lưu trữ đặt vé toàn cục về trạng thái trống
  selectedSeats = [];
  currentPriceTotal = 0;
  appliedVoucherDiscount = 0;
  selectedShowtime = "";
  fnbQty = 0;
  window.selectedPaymentGateway = "qr"; // Trả về cổng VietQR mặc định ban đầu

  // 2. Quét sạch class "active" để ép giao diện các bước đặt vé (Booking Steps) quay lại Bước 1
  const allSteps = document.querySelectorAll(".booking-step");
  allSteps.forEach((step, index) => {
    if (index === 0) {
      step.classList.add("active"); // Hiện lại phân vùng chọn ghế ngồi
    } else {
      step.classList.remove("active"); // Ẩn hoàn toàn các bước Combo, Thanh toán và Hóa Đơn Thành Công
    }
  });

  // 3. Đưa biến kiểm soát bước hiện tại của rạp phim về lại Step 1
  window.currentBookingStep = 1;

  // 4. Xóa chữ trong ô nhập mã giảm giá Voucher
  const voucherInput = document.getElementById("voucher-input");
  if (voucherInput) voucherInput.value = "";

  // 5. Tắt bộ đếm ngược khóa giữ ghế rạp 5 phút tránh bị thông báo hết giờ liên tục
  window.resetHoldState();
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
window.renderLasPromoGrid = function () {
  const promoNewsContainer = document.getElementById("cgv-event-grid-news");
  // 🚀 Cào dữ liệu động trực tiếp từ Database SQL Server qua Spring Boot
  fetch("http://localhost:8080/api/promos")
    .then((res) => {
      if (!res.ok) throw new Error("Không thể kết nối API ưu đãi");
      return res.json();
    })
    .then((promosList) => {
      console.log("🎁 Đã nhận danh sách ưu đãi động từ Database:", promosList);
      window.lasPromoList = promosList;
      // Xóa rỗng phân vùng chứa của Tab Tin tức trước khi vẽ động
      if (promoNewsContainer) promoNewsContainer.innerHTML = "";
      window.lasPromoList.forEach((item) => {
        // Quét sạch các trường hợp đặt tên cột từ Spring Boot đẩy lên Frontend
        let validImg =
          item.imageUrl || item.image_url || item.image || item.img || "";
        validImg = validImg.trim();
        // Định dạng chuỗi hiển thị khoảng thời gian diễn ra sự kiện
        let dateString = `${item.startDate || item.start_date || "05/06/2026"} - ${item.endDate || item.end_date || "12/06/2026"}`;
        // 🚀 THẦN CHÚ BẮN THẺ <IMG> TRỰC TIẾP: Triệt tiêu hoàn toàn lỗi sập co rúm khung hình của thẻ div cũ
        let imgHTML =
          validImg.startsWith("http") ||
          validImg.includes("/") ||
          validImg.includes(".")
            ? `<img src="${validImg}" class="news-card-img-holder" style="width: 100%; height: 200px; object-fit: cover; display: block;" onerror="this.onerror=null; this.src='https://www.cgv.vn/media/catalog/product/placeholder/default/cgv_title.png';">`
            : `<div class="news-card-img-holder" style="background: #a1dbf1; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #0c6291; font-size: 14px; height: 200px; width: 100%; text-align: center; padding: 0 10px; box-sizing: border-box;">${validImg || "LAS CINEMA"}</div>`;
        // Tạo cấu trúc thẻ card chuẩn chỉ ăn khớp layout hai phân vùng
        let cardHTML = `
          <div class="news-promo-card" onclick="window.viewPromoDetailText('${item.id}')" style="cursor: pointer; background: #17171b; border: 1px solid rgba(255,255,255,0.12); border-radius: 6px; overflow: hidden; transition: transform 0.2s; display: block; box-shadow: 0 2px 8px rgba(0,0,0,0.02);">
              ${imgHTML}
              <div style="padding: 15px; text-align: left;">
                  <div class="news-card-date" style="color: #a8a8b3; font-size: 12px; margin-bottom: 5px;">📅 ${dateString}</div>
                  <div class="news-card-title-text" style="font-weight: bold; font-size: 14px; color: #f4f4f5; line-height: 1.4;">${item.title || "Chương trình ưu đãi"}</div>
              </div>
          </div>
        `;

        if (promoNewsContainer) promoNewsContainer.innerHTML += cardHTML;
      });
    })
    .catch((err) =>
      console.error("🚨 Lỗi khi kéo dữ liệu ưu đãi từ SQL Server: ", err),
    );
};

// Hàm kích hoạt nhảy sang tab chi tiết ưu đãi và đổ dữ liệu
window.viewPromoDetailText = function (promoId) {
  // Đồng bộ ép kiểu dữ liệu về chuỗi hoặc số để so sánh khớp với ID dưới DB gửi lên
  const targetPromo = window.lasPromoList.find(
    (p) => String(p.id) === String(promoId),
  );
  if (!targetPromo) return;

  document.getElementById("detail-promo-title").innerText = targetPromo.title;
  document.getElementById("detail-promo-date").innerText =
    "Thời gian áp dụng: " +
    (targetPromo.startDate || targetPromo.start_date) +
    " đến " +
    (targetPromo.endDate || targetPromo.end_date);
  document.getElementById("detail-promo-content").innerHTML =
    targetPromo.content;

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
      // 🚀 THẦN CHÚ ÉP STYLE: Giải phóng hoàn toàn chiều cao cố định, cố định độ rộng bài viết đứng
      imgBoxEl.style.width = "340px"; // Độ rộng lý tưởng cho poster đứng trên giao diện máy tính
      imgBoxEl.style.height = "auto"; // Cho phép chiều cao tự bung theo tỉ lệ 9:16 nguyên bản
      imgBoxEl.style.flexShrink = "0"; // Không cho phép cột chữ bên phải ép bẹp ảnh
      imgBoxEl.style.background = "none";
      imgBoxEl.style.backgroundImage = "none";
      imgBoxEl.style.overflow = "visible"; // Cho phép hiển thị tràn mà không bị cắt rìa

      // Nạp thẻ img thật với chiều cao tự động tính toán theo ảnh gốc 1080x1920
      imgBoxEl.innerHTML = `<img src="${validImg}" style="width: 100%; height: auto; display: block; border-radius: 6px; box-shadow: 0 4px 15px rgba(0,0,0,0.15);">`;
    } else {
      // Hiển thị khung màu đại diện nếu dữ liệu dưới SQL Server chỉ là chuỗi ký tự text
      imgBoxEl.style.background = "#a1dbf1";
      imgBoxEl.style.width = "340px";
      imgBoxEl.style.height = "500px"; // Giả lập chiều cao đứng chuẩn poster
      imgBoxEl.style.display = "flex";
      imgBoxEl.style.alignItems = "center";
      imgBoxEl.style.justifyContent = "center";
      imgBoxEl.style.color = "#0c6291";
      imgBoxEl.style.fontWeight = "bold";
      imgBoxEl.innerHTML = `<b>${validImg || "LAS CINEMA"}</b>`;
    }
  }
  // Kích hoạt điều hướng nhảy chuyển phân vùng hiển thị Tab Panel
  window.switchCgvTab("panel-news-detail");
};

// Tìm đến sự kiện tải trang sẵn có (DOMContentLoaded) ở cuối file home.js của em, thêm dòng này vào:
window.addEventListener("DOMContentLoaded", () => {
  // ... các hàm có sẵn của em (generateCgvDateSlider, fetchSyncData...)
  window.renderLasPromoGrid(); // 🌟 Gọi hàm vẽ tin tức ưu đãi lên trang chủ
});

// ==========================================================================
// 🌟 HÀM RẼ NHÁNH THANH TOÁN TOÀN DIỆN (SỬA LỖI ĐÈ HÀM & HIỂN THỊ 0 Đ)
// ==========================================================================
// ==========================================================================
// 🌟 HÀM RẼ NHÁNH THANH TOÁN (SỬA LỖI NGÂN HÀNG KHÔNG HỖ TRỢ TRÊN SANDBOX)
// ==========================================================================
window.processToPaymentGateway = function () {
  if (!window.selectedPaymentGateway) window.selectedPaymentGateway = "qr";
  const finalTotal = currentPriceTotal * (1 - appliedVoucherDiscount);

  // 🚀 TRƯỜNG HỢP 1: THANH TOÁN QUA CỔNG VNPAY (QR HOẶC ATM)
  if (
    window.selectedPaymentGateway === "vnpay_qr" ||
    window.selectedPaymentGateway === "vnpay_atm"
  ) {
    console.log(
      "✈️ Gọi API Spring Boot sinh Link VNPAY tổng quan, số tiền:",
      finalTotal,
    );

    // 🌟 THẦN CHÚ SỬA LỖI: Bỏ hoàn toàn tham số &bankCodeParam để VNPAY tự mở trang chọn lựa tổng quan
    fetch(
      `http://localhost:8080/api/payment/create-vnpay-url?amount=${finalTotal}`,
    )
      .then((res) => {
        if (!res.ok)
          throw new Error("Không thể kết nối cổng API tạo hóa đơn VNPAY!");
        return res.json();
      })
      .then((data) => {
        if (data && data.paymentUrl) {
          alert(
            "Hệ thống chuyển hướng an toàn sang cổng bảo mật VNPAY Sandbox...",
          );
          const bookingCache = {
            movie: document.getElementById("cgv-combo-movie").value,
            showtime: selectedShowtime,
            seats: [...selectedSeats],
            date: selectedDateStr,
            fnb: fnbMenu.filter((i) => i.qty > 0).map((i) => ({ ...i })),
            total: currentPriceTotal * (1 - appliedVoucherDiscount),
          };
          localStorage.setItem(
            "pending_booking",
            JSON.stringify({
              movie: document.getElementById("cgv-combo-movie").value,
              showtime: selectedShowtime,
              seats: [...selectedSeats],
              date: selectedDateStr,
              fnb: fnbMenu.filter((i) => i.qty > 0),
              total: currentPriceTotal * (1 - appliedVoucherDiscount),
            }),
          );
          window.location.href = data.paymentUrl; // Điều hướng sang trang chọn của VNPAY thành công
        } else {
          alert("Lỗi dữ liệu hệ thống trả về từ VNPAY Gateway!");
        }
      })
      .catch((err) => {
        console.error("🚨 Lỗi tạo link VNPAY:", err);
        alert(
          "Không thể kết nối Server để kích hoạt cổng VNPAY: " + err.message,
        );
      });

    // 🚀 TRƯỜNG HỢP 2: THANH TOÁN CHUYỂN KHOẢN TIÊU CHUẨN (VIETQR) -> GIỮ NGUYÊN
  } else if (window.selectedPaymentGateway === "qr") {
    const modalTitle = document.querySelector("#payment-redirect-modal h2");
    if (modalTitle) {
      modalTitle.innerHTML = "Thanh Toán Chuyển Khoản VietQR";
    }

    const qrPriceText = document.getElementById("qr-total-price");
    if (qrPriceText) {
      qrPriceText.innerText = finalTotal.toLocaleString("vi-VN") + " đ";
    }

    const bankId = "ICB";
    const accountNo = "101879388698";
    const accountName = "NGUYEN BAO HOANG";
    const qrData = `LAS CINEMAS THANH TOAN VE`;

    const qrImg = document.getElementById("bank-qr-img");
    if (qrImg) {
      qrImg.src = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact.png?amount=${finalTotal}&addInfo=${encodeURIComponent(qrData)}&accountName=${encodeURIComponent(accountName)}`;
    }
    document.getElementById("payment-redirect-modal").classList.add("open");
  }
};

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
          <div class="date-slider-item" style="flex: 0 0 auto; min-width: 60px; background:${bg}; color:${color}; border:2px solid ${border}; border-radius:6px; cursor:pointer; text-align:center; padding: 10px 5px; box-sizing: border-box; transition: all 0.2s;"
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
  document.getElementById("btn-main-action").style.background = "#ff6b35";
}

function switchProfileSubTab(sub) {
  document
    .querySelectorAll(".arrow-btn")
    .forEach((b) => b.classList.remove("active"));
  ["chung", "lichsu"].forEach((p) => {
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
    input.style.border = "1px solid #ff6b35";
    input.style.background = "#0b0b0e";
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
    if (input.tagName === "SELECT") input.setAttribute("disabled", true);
    input.style.border = "1px solid rgba(255,255,255,0.15)";
    input.style.background = "#1c1c21";
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
window.closePaymentModal = closePaymentModal;
window.executeFinalCheckout = executeFinalCheckout;
window.cancelCurrentTransaction = cancelCurrentTransaction;
window.viewHistoryDetail = viewHistoryDetail;
window.closeHistoryDetailModal = closeHistoryDetailModal;
window.updateComboQty = updateComboQty;
window.moveBannerLeft = moveBannerLeft;
window.moveBannerRight = moveBannerRight;

function goHomeFromBc() {
  switchCgvTab("panel-movies");

  selectedSeats = [];
  selectedShowtime = "";
  window.currentSelectedShowtimeId = null;

  currentPriceTotal = 0;
  appliedVoucherDiscount = 0;

  fnbMenu.forEach((i) => (i.qty = 0));

  const ticket = document.getElementById("final-ticket-result");
  if (ticket) {
    ticket.innerHTML = "";
  }

  goToBookingStep(1);

  renderFnbMenu();
  calculateCgvCart();
  renderCgvInterface();
}
window.goHomeFromBc = goHomeFromBc;

// 🤖 ĐOẠN CHÈN THÊM CHUẨN ĐÉT: Hàm xử lý ẩn/hiện cửa sổ Chatbot thông minh
function toggleLasChatbox() {
  const chatWindow = document.getElementById("las-chatbox-window");
  if (chatWindow) {
    if (
      chatWindow.style.display === "none" ||
      chatWindow.style.display === ""
    ) {
      chatWindow.style.display = "flex";
    } else {
      chatWindow.style.display = "none";
    }
  }
}
// Xuất hàm ra window toàn cục để thuộc tính onclick ngoài index.html gọi được
window.toggleLasChatbox = toggleLasChatbox;

// ==========================================================================
// 🤖 TÍCH HỢP TÍNH NĂNG GỬI/NHẬN TIN NHẮN TƯƠNG TÁC CHO CHATBOX LAS CINEMAS
// ==========================================================================
async function fetchAllRealShowtimesContext(targetDateStr) {
  if (!serverData || !serverData.movies || serverData.movies.length === 0) {
    return "Hiện tại hệ thống rạp đang cập nhật danh mục phim từ server.";
  }

  let dateStr = targetDateStr;
  let fullContext = `DỮ LIỆU LỊCH CHIẾU VÀ PHÒNG CHIẾU THỰC TẾ TRONG SQL SERVER NGÀY ${dateStr} (CHỈ DÙNG ĐỂ TƯ VẤN):\n`;

  for (const movie of serverData.movies) {
    const movieId = movie.movieId || movie.movie_id;
    try {
      // Gọi API chọc vào Spring Boot Controller của em
      const response = await fetch(
        `http://localhost:8080/api/showtimes/matrix?movieId=${movieId}&date=${dateStr}`,
      );

      // Nếu Backend Spring Boot phản hồi lỗi mạng (Mã 404, 500...)
      if (!response.ok) {
        fullContext += `- Phim: ${movie.title} | Phân hệ lịch chiếu của phim này đang gặp sự cố kết nối.\n`;
        continue;
      }

      const resData = await response.json();
      fullContext += `- Phim: ${movie.title} | Thể loại: ${movie.genre || "Hành động"} | Trạng thái: ${movie.status === "now_showing" ? "Đang chiếu" : "Sắp chiếu"}\n`;

      if (resData.showtimes && resData.showtimes.length > 0) {
        const timeStrings = resData.showtimes
          .map((st) => {
            let roomName =
              st.roomId === 1
                ? "Phòng 1 (IMAX)"
                : st.roomId === 2
                  ? "Phòng 2 (2D)"
                  : "Phòng 3 (3D)";
            return `${st.startTime} (${roomName})`;
          })
          .join(", ");
        fullContext += `  ↳ Các suất chiếu thực tế ngày ${dateStr}: ${timeStrings}\n`;
      } else {
        fullContext += `  ↳ Lịch chiếu: Ngày ${dateStr} phim này rạp không có suất chiếu.\n`;
      }
    } catch (e) {
      // ✅ BẢO VỆ CỐ LẬP: Nếu sập cổng localhost:8080, ghi nhận lỗi cục bộ chứ KHÔNG quăng lỗi ra ngoài làm sập Bot
      console.error(
        `🚨 Lỗi kết nối API gạch nối SQL Server của phim ID ${movieId}:`,
        e,
      );
      fullContext += `- Phim: ${movie.title} | Không thể kết nối đến dữ liệu server lịch chiếu localhost:8080.\n`;
    }
  }
  return fullContext;
}

async function sendChatMessageToServer() {
  const inputField = document.getElementById("las-chat-user-input");
  const msgZone = document.getElementById("las-chat-messages-zone");
  if (!inputField || !msgZone) return;

  const userText = inputField.value.trim();
  if (!userText) return;

  // 1. Hiển thị ngay lập tức tin nhắn của Khách hàng lên khung chat
  msgZone.innerHTML += `
    <div style="align-self: flex-end; background-color: #ff6b35; color: white; padding: 10px 14px; border-radius: 8px; max-width: 85%; font-size: 13.5px; line-height: 1.4; font-weight: bold; box-shadow: 0 2px 5px rgba(255,107,53,0.15); word-break: break-word;">
      ${userText}
    </div>
  `;

  // 🌟 BƯỚC 1: SÀNG LỌC Ý ĐỊNH - Kiểm tra xem khách có thực sự hỏi lịch chiếu/phim ảnh không
  const isQueryingSchedule =
    /lịch|lich|chiếu|chieu|suất|suat|phim|phong|ghế|ghe|ngày|ngay|hôm nay|hom nay|ngày mai|ngay mai/i.test(
      userText.toLowerCase(),
    );

  let chatDateStr = "";
  let dbContext =
    "Khách hàng đang trò chuyện tự do, không yêu cầu tra cứu lịch chiếu phim.";
  const todayObj = new Date();

  // Chỉ phân tích ngày tháng chi tiết nếu khách hỏi về lịch chiếu rạp
  if (isQueryingSchedule) {
    chatDateStr = todayObj.toISOString().split("T")[0]; // Mặc định lấy ngày hôm nay
    if (
      userText.toLowerCase().includes("ngày mai") ||
      userText.toLowerCase().includes("ngay mai")
    ) {
      const tomorrow = new Date(todayObj);
      tomorrow.setDate(todayObj.getDate() + 1);
      chatDateStr = tomorrow.toISOString().split("T")[0];
    } else {
      const dateMatch = userText.match(/ngày\s*(\d{1,2})/i);
      if (dateMatch) {
        const target = new Date(2026, 5, parseInt(dateMatch[1]));
        chatDateStr = target.toISOString().split("T")[0];
      }
    }
  }

  // Xóa rỗng ô nhập liệu và cuộn khung chat xuống dưới
  inputField.value = "";
  msgZone.scrollTop = msgZone.scrollHeight;

  // 2. Hiển thị bong bóng chờ trạng thái thông minh (Tránh tạo cảm giác khô cứng)
  const loadingId = "typing-loading-" + Date.now();
  const loadingText = isQueryingSchedule
    ? `🤖 LAS Bot đang tra cứu dữ liệu lịch chiếu ngày ${chatDateStr}...`
    : `🤖 LAS Bot đang suy nghĩ câu trả lời...`;

  msgZone.innerHTML += `
    <div id="${loadingId}" style="align-self: flex-start; background-color: #0b0b0e; color: #9a9aa3; padding: 10px 14px; border-radius: 8px; font-size: 12px; font-style: italic;">
      ${loadingText}
    </div>
  `;
  msgZone.scrollTop = msgZone.scrollHeight;

  // 🌟 BƯỚC 2: CHỈ CÀO DATABASE KHI KHÁCH YÊU CẦU LỊCH CHIẾU
  if (isQueryingSchedule) {
    try {
      dbContext = await fetchAllRealShowtimesContext(chatDateStr);
    } catch (dbErr) {
      console.error("🚨 Lỗi kết nối CSDL rạp phim:", dbErr);
      dbContext =
        "Hệ thống SQL Server lịch chiếu đang bảo trì, vui lòng thử lại sau.";
    }
  }

  // 3. Kết nối cổng gọi AI Gemini xử lý hội thoại đa năng
  try {
    const aiModule = await import("https://esm.run/@google/genai");
    const GoogleGenAI = aiModule.GoogleGenAI;

    // Dán mã API Key cá nhân hợp lệ của em ở đây nha
    const aiKey = "";
    const ai = new GoogleGenAI({ apiKey: aiKey });

    // 🌟 BƯỚC 3: CẢI TIẾN HỆ THỐNG LUẬT - Cho phép giao tiếp tự do nhưng thắt chặt khi hỏi lịch
    const systemRule = `Bạn là trợ lý ảo hội thoại thông minh mã nguồn LumiAI System của cụm rạp phim LAS Cinemas.
    Nhiệm vụ của bạn là tiếp đón khách hàng thành viên, chào hỏi lịch sự, trò chuyện tự do và tương tác một cách tự nhiên, hóm hỉnh, thân thiện nhất.
    
    Luật absolute số 1 (Tư vấn lịch phim): Nếu khách hàng hỏi về lịch chiếu, danh sách bộ phim, hoặc suất chiếu, bạn PHẢI dựa vào thông tin thật ở mục 'DỮ LIỆU ĐỘNG TỪ DATABASE SQL SERVER' dưới đây để trả lời. Tuyệt đối không tự bịa giờ chiếu ảo hoặc phòng chiếu không tồn tại. Nếu mục này báo không có suất chiếu, hãy thông báo tiếc nuối một cách lịch sự.
    Luật absolute số 2 (Tương tác tự do): Nếu khách hàng chỉ chào hỏi xã giao, tâm sự hoặc hỏi thông tin rạp chung chung, hãy thoải mái trò chuyện như một người bạn thân thiết, không cần ép buộc đọc lịch chiếu.
    Luật absolute số 3 (Điều hướng đặt vé): Khi thấy khách hàng có nhu cầu muốn book vé, mua vé, hoặc chọn suất của một bộ phim cụ thể, bạn PHẢI kẹp cú pháp điều hướng [BOOK: Tên Bộ Phim Chính Xác] vào cuối câu trả lời của mình.
    
    DỮ LIỆU ĐỘNG TỪ DATABASE SQL SERVER (Bối cảnh thực tế hệ thống):
    Ngày khách hàng đang hướng tới: ${chatDateStr || "Trò chuyện tự do"}
    Nội dung dữ liệu: \n${dbContext}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Câu hỏi của khách hàng: ${userText}`,
      config: { systemInstruction: systemRule },
    });

    // Xóa bỏ bong bóng chờ sau khi AI phản hồi thành công
    const loadingEl = document.getElementById(loadingId);
    if (loadingEl) loadingEl.remove();

    let aiResponseText = response.text;

    // Xử lý cú pháp tự động chuyển tab đặt vé nhanh khi khách muốn book phim [BOOK: ...]
    if (aiResponseText.includes("[BOOK:")) {
      const match = aiResponseText.match(/\[BOOK:\s*(.*?)\s*\]/);
      if (match && match[1]) {
        const targetMovieName = match[1].trim();
        aiResponseText = aiResponseText.replace(/\[BOOK:.*?\]/g, "");

        setTimeout(() => {
          quickBookMovie(targetMovieName);
          toggleLasChatbox();
        }, 1200);
      }
    }

    if (typeof formatGeminiResponseToHtml === "function") {
      aiResponseText = formatGeminiResponseToHtml(aiResponseText);
    }

    // Hiển thị câu trả lời thông minh của Trợ lý ảo lên màn hình
    msgZone.innerHTML += `
      <div style="align-self: flex-start; background-color: #0b0b0e; color: #e4e4e7; padding: 10px 14px; border-radius: 8px; max-width: 85%; font-size: 13.5px; line-height: 1.4; border-left: 3px solid #ff6b35; word-break: break-word;">
        ${aiResponseText}
      </div>
    `;
    msgZone.scrollTop = msgZone.scrollHeight;
  } catch (err) {
    console.error("🚨 Lỗi Google AI:", err);
    const loadingEl = document.getElementById(loadingId);
    if (loadingEl) loadingEl.remove();

    // Vá chí mạng đề phòng hết quota lượt gọi API Key miễn phí
    if (
      err.message &&
      (err.message.includes("429") ||
        err.message.includes("RESOURCE_EXHAUSTED"))
    ) {
      msgZone.innerHTML += `
            <div style="background: rgba(229,169,59,0.12); padding: 10px; border-radius: 8px; border-left: 3px solid #ffc107; align-self: flex-start; max-width: 85%;">
                <b>🤖 Bot:</b> Dạ hiện tại hệ thống AI đang quá tải, mình xem lịch chiếu trực tiếp ở dưới đây nhé:<br>
                <i style="font-size: 12px;">${dbContext.replace(/\n/g, "<br>")}</i>
            </div>`;
    } else {
      msgZone.innerHTML += `<div style="color:red; font-weight:bold; align-self: flex-start; padding: 5px 10px;">❌ Lỗi kết nối trợ lý: ${err.message}</div>`;
    }
    msgZone.scrollTop = msgZone.scrollHeight;
  }
}

// Hàm bắt sự kiện khi người dùng gõ phím Enter trong ô nhập liệu
function toggleLasChatbox() {
  const chatWindow = document.getElementById("las-chatbox-window");
  const bubble = document.getElementById("las-chatbot-bubble");
  if (chatWindow.style.display === "none" || chatWindow.style.display === "") {
    chatWindow.style.display = "flex";
    bubble.style.transform = "scale(0.9)";
    bubble.innerText = "✖";
    const msgZone = document.getElementById("las-chat-messages-zone");
    msgZone.scrollTop = msgZone.scrollHeight;
  } else {
    chatWindow.style.display = "none";
    bubble.style.transform = "scale(1)";
    bubble.innerText = "💬";
  }
}

function checkChatSendMessageKey(event) {
  if (event.key === "Enter") {
    sendChatMessageToServer();
  }
}

// Hàm bổ trợ: Dọn sạch định dạng văn bản Markdown từ Gemini sang HTML chuẩn
function formatGeminiResponseToHtml(rawText) {
  let formatted = rawText;
  // 1. Chuyển đổi **chữ đậm** thành <b>chữ đậm</b>
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");
  // 2. Chuyển đổi dấu gạch đầu dòng * thành chấm tròn danh sách
  formatted = formatted.replace(/^[*\-]\s+(.*)$/gm, "• $1");
  // 3. Chuyển đổi xuống dòng \n thành thẻ <br> để xuống dòng hiển thị mượt mà
  formatted = formatted.replace(/\n/g, "<br>");
  return formatted;
}

// 🌟 XUẤT HÀM LÊN WINDOW TOÀN CỤC ĐỂ FILE INDEX.HTML CÓ THỂ ĐỌC ĐƯỢC
window.sendChatMessageToServer = sendChatMessageToServer;
window.toggleLasChatbox = toggleLasChatbox;
window.checkChatSendMessageKey = checkChatSendMessageKey;
window.formatGeminiResponseToHtml = formatGeminiResponseToHtml;