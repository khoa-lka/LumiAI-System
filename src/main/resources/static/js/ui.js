// js/ui.js
window.addEventListener("DOMContentLoaded", () => {
  // 1. Khởi tạo slider ngày
  generateCgvDateSlider();

  // 2. Khởi tạo menu bắp nước
  renderFnbMenu();

  // 3. Khởi tạo Form ngày sinh
  const proDay = document.getElementById("profile-birth-day");
  const proMonth = document.getElementById("profile-birth-month");
  const proYear = document.getElementById("profile-birth-year");
  if (proDay && proMonth && proYear) {
    for (let i = 1; i <= 31; i++)
      proDay.innerHTML += `<option value="${i}">${i}</option>`;
    for (let i = 1; i <= 12; i++)
      proMonth.innerHTML += `<option value="${i}">Tháng ${i}</option>`;
    for (let i = 2026; i >= 1950; i--)
      proYear.innerHTML += `<option value="${i}">${i}</option>`;
  }

  // 4. Load Dữ liệu ban đầu
  loadBannersFromDatabase();
  setInterval(moveBannerRight, 3000);
  fetchSyncData(); // Hàm tự tạo bên dưới
  loadEventsFromDatabase();
});

// --- CÁC HÀM UI ---
// 🚀 SỬA: Thêm từ khóa "async" vào đầu hàm để kích hoạt cơ chế đợi đồng bộ dữ liệu
async function switchCgvTab(panelId, filterType = "now_showing") {
  if (cgvNavigationHistory[cgvNavigationHistory.length - 1] !== panelId) {
    cgvNavigationHistory.push(panelId);
  }
  document.getElementById("bc-back-btn").style.display =
    cgvNavigationHistory.length > 1 ? "inline-block" : "none";

  document
    .querySelectorAll(".cgv-panel")
    .forEach((p) => p.classList.remove("active"));
  document.getElementById(panelId).classList.add("active");

  if (panelId === "panel-movies") {
    switchMovieFilterTab(filterType);
  } else if (panelId === "panel-profile") {
    switchProfileSubTab("chung");
    
    // Bốc ID người dùng đang lưu trong bộ nhớ máy ra để xử lý
    const loggedInId = sessionStorage.getItem("accountId") || window.currentLoggedInId;
    
    if (loggedInId && typeof API !== "undefined" && typeof API.getProfile === "function") {
      API.getProfile(loggedInId)
        .then((profileRes) => {
          if (profileRes.status === "success") {
            const updatedData = profileRes.data;
            
            // 1. Đồng bộ các trường thông tin chữ lên UI giao diện trước
            if (document.getElementById("profile-field-name")) document.getElementById("profile-field-name").value = updatedData.fullName;
            if (document.getElementById("profile-field-email")) document.getElementById("profile-field-email").value = updatedData.email;
            
            // 🚀 FIX LỖI 1: Đổi từ updatedData.phoneNumber thành updatedData.phone theo đúng ProfileController.java
            if (document.getElementById("profile-field-phone")) {
              document.getElementById("profile-field-phone").value = updatedData.phone || "";
            }
            
            // 🚀 FIX LỖI 2: Ép kiểu số parseInt() để ô select dropdown chịu nhảy giá trị từ DB mượt mà
            if (updatedData.dateOfBirth) {
              const [year, month, day] = updatedData.dateOfBirth.split("-");
              if (document.getElementById("profile-birth-day")) document.getElementById("profile-birth-day").value = parseInt(day, 10);
              if (document.getElementById("profile-birth-month")) document.getElementById("profile-birth-month").value = parseInt(month, 10);
              if (document.getElementById("profile-birth-year")) document.getElementById("profile-birth-year").value = parseInt(year, 10);
            }
          }
        })
        .catch((err) => console.error("🚨 Lỗi tự động đồng bộ dữ liệu hồ sơ cá nhân:", err));
    }
  }
}

function switchMovieFilterTab(filterType) {
  currentMovieFilter = filterType;
  const mainTitle = document.getElementById("tab-title-now");
  const subTitle = document.getElementById("tab-title-coming");
  if (filterType === "now_showing") {
    if (mainTitle) mainTitle.className = "tab-title-main";
    if (subTitle) subTitle.className = "tab-title-sub";
    document.getElementById("bc-current-text").innerText = "Phim Đang Chiếu";
  } else {
    if (mainTitle) mainTitle.className = "tab-title-sub";
    if (subTitle) subTitle.className = "tab-title-main";
    document.getElementById("bc-current-text").innerText = "Phim Sắp Chiếu";
  }
  renderCgvInterface();
  if (typeof renderCgvInterface === "function") renderCgvInterface();
}

function updateTopBarMenu(fullName, roleName) {
  const authLinkBox = document.getElementById("top-bar-auth-link");
  if (authLinkBox) {
    authLinkBox.removeAttribute("onclick");
    authLinkBox.innerHTML = `
      <span class="sub-nav-icon">👤</span> [${roleName}] ${fullName.toUpperCase()}! 
      <span onclick="confirmLogoutAction(event)" style="color: #e71a0f; margin-left: 8px; cursor: pointer; text-decoration: underline; font-weight: bold;">[THOÁT]</span>
    `;
  }
}

// Chép nguyên xi hàm loadEventsFromDatabase, loadBannersFromDatabase, renderCgvInterface, renderFnbMenu, generateCgvDateSlider của em vào đây.
function loadEventsFromDatabase() {
  API.getEvents() // Gọi qua api.js
    .then((events) => {
      const container = document.getElementById("cgv-event-grid");
      if (!container) return;
      container.innerHTML = "";

      events.forEach((ev) => {
        const img =
          ev.imageUrl ||
          "https://www.cgv.vn/media/catalog/product/placeholder/default/cgv_title.png";
        container.innerHTML += `
            <div style="border: 1px solid #ddd; background: #fff; padding: 5px;">
                <img src="${img}" style="width: 100%; display: block;" alt="${ev.title}">
            </div>
        `;
      });
    })
    .catch((err) => console.error("🚨 Lỗi khi tải sự kiện từ Database: ", err));
}

function loadBannersFromDatabase() {
  API.getBanners() // Gọi qua api.js
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

function renderCgvInterface() {
  const movieZone = document.getElementById("cgv-movie-list");
  const selectCombo = document.getElementById("cgv-combo-movie");
  if (!movieZone || !selectCombo) return;

  movieZone.innerHTML = "";
  let rankCounter = 1;

  serverData.movies.forEach((m) => {
    if (m.status === currentMovieFilter) {
      const matchesKeyword =
        m.title.toLowerCase().includes(activeSearchKeyword) ||
        m.genre.toLowerCase().includes(activeSearchKeyword);

      if (activeSearchKeyword === "" || matchesKeyword) {
        let ribbonColor = "ribbon-blue";
        if (rankCounter === 1) ribbonColor = "ribbon-red";
        if (rankCounter === 2) ribbonColor = "ribbon-orange";

        let actionBtnHTML =
          m.status === "now_showing"
            ? `<button class="btn-cgv-buy-ticket-spec" onclick="quickBookMovie('${m.title}')">🎟️ MUA VÉ</button>`
            : `<button class="btn-cgv-buy-ticket-spec" style="background-color:#555; cursor:not-allowed;" disabled>📋 SẮP CHIẾU</button>`;

        let cleanImgUrl =
          m.mainposter_url ||
          m.mainposterUrl ||
          m.mainposterurl ||
          m.img ||
          "https://www.cgv.vn/media/catalog/product/placeholder/default/cgv_title.png";
        let displayAge =
          m.age_rating === 0 || m.ageRating === 0
            ? "P"
            : `T${m.age_rating || m.ageRating || (m.status === "now_showing" ? "16" : "P")}`;

        movieZone.innerHTML += `
                        <div class="movie-spec-card">
                            <div class="poster-wrapper-box">
                                <span class="age-label-badge">${displayAge}</span>
                                <div class="rank-ribbon ${ribbonColor}">${rankCounter}</div>
                                <div class="poster-main-body-img" onclick="viewMovieDetailText('${m.title}', '${m.genre}')" style="background: #111; width: 100%; height: 100%;">
                                    <img src="${cleanImgUrl}" alt="${m.title}" style="width: 100%; height: 100%; object-fit: cover; display: block;">
                                </div>
                            </div>
                            <div class="movie-spec-info-text">
                                <h3 class="movie-spec-title" onclick="viewMovieDetailText('${m.title}', '${m.genre}')">${m.title}</h3>
                                <p>Thể loại: <b>${m.genre}</b></p>
                            </div>
                            <div class="movie-spec-action-zone">${actionBtnHTML}</div>
                        </div>
                    `;
        rankCounter++;
      }
    }
  });

  const currentMovie =
    selectCombo.value ||
    (selectCombo.options[0] ? selectCombo.options[0].value : "");
  document.getElementById("sum-movie-title").innerText = currentMovie || "-";

  // ==========================================================================
  // 🛠️ FIX LOGIC ĐOẠN 1: TẢI SUẤT CHIẾU TỰ ĐỘNG TỪ DATABASE THEO PHIM & NGÀY
  // ==========================================================================
  const timeGrid = document.getElementById("cgv-showtime-grid");
  if (timeGrid && serverData.movies && serverData.movies.length > 0) {
    const selectedMovieObj = serverData.movies.find(
      (m) => m.title === currentMovie,
    );

    if (selectedMovieObj) {
      const movieId = selectedMovieObj.movieId || selectedMovieObj.movie_id;
      const dateStr = selectedDateStr;

      // Sửa từ fetch(...) thành gọi API như sau:
      API.getShowtimes(movieId, dateStr)
        .then((resData) => {
          timeGrid.innerHTML = "";
          if (!resData.showtimes || resData.showtimes.length === 0) {
            timeGrid.innerHTML = `<p style="color:#777; font-size:13px; grid-column: span 4; text-align:center; padding: 10px 0;">Hôm nay rạp chưa xếp lịch chiếu phim này!</p>`;
            document.getElementById("cgv-seat-grid").innerHTML =
              `<p style="color:#777; font-size:13px; text-align:center; grid-column:1/-1;">Vui lòng chọn một suất chiếu cụ thể để hiển thị sơ đồ ghế!</p>`;
            return;
          }

          resData.showtimes.forEach((st) => {
            const isSelected = st.startTime === selectedShowtime;
            const activeClass = isSelected ? "active" : "";

            timeGrid.innerHTML += `
              <div class="showtime-btn ${activeClass}" onclick="selectCgvShowtimeSlot('${st.startTime}', ${st.showtimeId})">
                  ${st.startTime}
                  <span style="display:block; font-size:9px; opacity:0.6; margin-top:2px;">
                      ${st.roomId === 1 ? "Phòng 1 (IMAX)" : st.roomId === 2 ? "Phòng 2 (2D)" : "Phòng 3 (3D)"}
                  </span>
              </div>`;
          });
        })
        .catch((err) => console.error("🚨 Lỗi tải lịch chiếu:", err));
    }
  }

  document.getElementById("sum-showtime").innerText = selectedShowtime || "-";

  // ==========================================================================
  // 🛠️ FIX LOGIC ĐOẠN 2: TỰ ĐỘNG VẼ SƠ ĐỒ GHẾ THEO SUẤT CHIẾU ĐANG CHỌN
  // ==========================================================================
  const seatGrid = document.getElementById("cgv-seat-grid");
  if (seatGrid) {
    if (!selectedShowtime || !window.currentSelectedShowtimeId) {
      seatGrid.innerHTML = `<p style="color:#777; font-size:13px; text-align:center; grid-column:1/-1;">Vui lòng chọn một suất chiếu cụ thể để hiển thị sơ đồ ghế!</p>`;
      return;
    }

    // Gọi API thật (chúng ta sẽ xây dựng ở câu sau) để lấy trạng thái ghế của đúng suất chiếu đó
    // Tạm thời sục vào bộ nhớ máy hoặc vẽ khung mẫu dựa theo roomId để Vy không bị trống màn hình
    seatGrid.innerHTML = "";

    // Giả lập ma trận 10 cột dựa theo dữ liệu phòng của em để đảm bảo không lỗi UI
    // Sau khi team gửi code Seat/Ticket, thầy sẽ cho hàm này gọi trực tiếp API sục DB 100%
    const rows = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
    for (let r = 0; r < rows.length; r++) {
      for (let c = 1; r < 10; c++) {
        if (c > 10) break;
        const id = `${rows[r]}${c}`;

        let seatType = "Standard";
        if (rows[r] === "E" || rows[r] === "F" || rows[r] === "G")
          seatType = "VIP";
        if (rows[r] === "I" || rows[r] === "J") seatType = "Sweetbox";

        // Check giả lập trạng thái khả dụng từ DB mồi
        let status = "available";
        if (id === "F5" || id === "H10") status = "sold"; // Khớp với dữ liệu Đoạn 3 của em

        const div = document.createElement("div");
        div.className = `cgv-seat ${seatType} ${status}`;
        div.innerText = id;

        if (selectedSeats.includes(id)) div.classList.add("selected");

        if (status === "available") {
          div.onclick = () => {
            if (selectedSeats.includes(id))
              selectedSeats = selectedSeats.filter((x) => x !== id);
            else selectedSeats.push(id);
            calculateCgvCart();
            renderCgvInterface();
          };
        }
        seatGrid.appendChild(div);
      }
    }
  }
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

function generateCgvDateSlider() {
  const container = document.getElementById("cgv-dynamic-date-slider");
  if (!container) return;
  container.innerHTML = "";

  container.style.display = "flex";
  container.style.gap = "10px";
  container.style.overflowX = "auto";
  container.style.paddingBottom = "10px";

  const daysOfWeek = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

  // 1. Lấy ngày thực tế của hệ thống ngay lúc này
  const now = new Date();

  for (let i = 0; i < 30; i++) {
    // 2. Tạo bản sao của ngày hiện tại để cộng dồn lên
    const targetDate = new Date();
    targetDate.setDate(now.getDate() + i);

    // 3. Lấy ra năm, tháng, ngày động hoàn toàn
    const year = targetDate.getFullYear(); // Tự động lấy năm thực (vd: 2024, 2025, 2026)
    const month = (targetDate.getMonth() + 1).toString().padStart(2, "0");
    const dateNum = targetDate.getDate().toString().padStart(2, "0");
    const dayName = daysOfWeek[targetDate.getDay()];

    // 4. Ghép thành chuỗi gửi xuống Backend chuẩn YYYY-MM-DD
    const fullDateId = `${year}-${month}-${dateNum}`;

    if (i === 0 && !selectedDateStr) {
      selectedDateStr = fullDateId;
    }
    const bg = selectedDateStr === fullDateId ? "#111" : "#fff";
    const color = selectedDateStr === fullDateId ? "#fff" : "#555";
    const border = selectedDateStr === fullDateId ? "#111" : "#ccc";

    container.innerHTML += `
      <div style="flex: 0 0 auto; min-width: 60px; background:${bg}; color:${color}; border:2px solid ${border}; border-radius:6px; cursor:pointer; text-align:center; padding: 10px 5px; box-sizing: border-box; transition: all 0.2s;" onclick="selectCgvBookingDate('${fullDateId}')">
          <div style="font-size:11px; margin-bottom: 2px;">${dayName}</div>
          <div style="font-size:22px; font-weight:bold; line-height: 1;">${dateNum}</div>
          <div style="font-size:11px; margin-top: 3px;">Th ${month}</div>
      </div>
    `;
  }
}
