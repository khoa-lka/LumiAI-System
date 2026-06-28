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

  // 4. Load Dữ liệu ban đầu từ Database Spring Boot
  loadBannersFromDatabase();
  setInterval(moveBannerRight, 3000);
  loadEventsFromDatabase();
  
  // 🚀 ĐÃ SỬA: Thay thế fetchSyncData bằng hàm đồng bộ danh sách phim thật từ DB lên màn hình và dropdown đặt vé
  initDatabaseMovies();
});

// 🚀 THÊM MỚI: Khởi tạo nạp danh sách phim động từ DB cho cả Trang chủ và ô Dropdown đặt vé
function initDatabaseMovies() {
  if (typeof API === "undefined" || !API.getMovies) return;

  API.getMovies()
    .then((resData) => {
      // 🚀 SỬA CHUẨN: Bóc tách chính xác thuộc tính từ Object của MovieController nhả về
      if (resData && resData.data && resData.data.movies) {
        serverData.movies = resData.data.movies;
        
        // Tiện tay đồng bộ luôn dữ liệu showtimes mồi nếu có để các hàm khác không bị lỗi
        if (resData.data.showtimes) serverData.showtimes = resData.data.showtimes;
        if (resData.data.masterSeatStore) serverData.masterSeatStore = resData.data.masterSeatStore;
      } else {
        // Phương án bọc lót dự phòng nếu team đổi sang trả về mảng phẳng
        serverData.movies = resData || [];
      }

      // 1. Đổ dữ liệu phim động vào ô Dropdown chọn phim khi đặt vé
      const selectCombo = document.getElementById("cgv-combo-movie");
      if (selectCombo) {
        selectCombo.innerHTML = "";
        serverData.movies.forEach((m) => {
          selectCombo.innerHTML += `<option value="${m.title}">${m.title}</option>`;
        });
      }

      // 2. Vẽ danh sách phim lên giao diện trang chủ
      if (typeof renderCgvInterface === "function") {
        renderCgvInterface();
      }
    })
    .catch((err) => console.error("🚨 Lỗi khởi tạo danh sách phim từ DB:", err));
}

// --- CÁC HÀM UI ---
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
  } else if (panelId === "panel-booking") {
    // 🚀 THÊM MỚI: Khi người dùng chủ động click qua Tab đặt vé, tự động kích hoạt tải suất chiếu động liền
    if (typeof loadShowtimesFromServer === "function") {
      loadShowtimesFromServer();
    }
  } else if (panelId === "panel-profile") {
    switchProfileSubTab("chung");
    
    const loggedInId = sessionStorage.getItem("accountId") || window.currentLoggedInId;
    
    if (loggedInId && typeof API !== "undefined" && typeof API.getProfile === "function") {
      API.getProfile(loggedInId)
        .then((profileRes) => {
          if (profileRes.status === "success") {
            const updatedData = profileRes.data;
            
            if (document.getElementById("profile-field-name")) document.getElementById("profile-field-name").value = updatedData.fullName;
            if (document.getElementById("profile-field-email")) document.getElementById("profile-field-email").value = updatedData.email;
            if (document.getElementById("profile-field-phone")) {
              document.getElementById("profile-field-phone").value = updatedData.phone || "";
            }
            
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
  
  // 🚀 ĐÃ SỬA CHẮC CHẮN: Kiểm tra sự tồn tại của hàm an toàn trước khi chạy
  if (typeof renderCgvInterface === "function") {
    renderCgvInterface();
  }
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

function loadEventsFromDatabase() {
  if (typeof API === "undefined" || !API.getEvents) return;
  API.getEvents()
    .then((events) => {
      const container = document.getElementById("cgv-event-grid");
      if (!container) return;
      container.innerHTML = "";

      events.forEach((ev) => {
        const img = ev.imageUrl || "https://www.cgv.vn/media/catalog/product/placeholder/default/cgv_title.png";
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
  if (typeof API === "undefined" || !API.getBanners) return;
  API.getBanners()
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

// ==========================================================================
// 🚀 FIX LUỒNG CHỌN NGÀY: Hàm độc lập giúp đổi ngày và gọi API lấy suất chiếu mới
// ==========================================================================
// ==========================================================================
// 🚀 FIX DỨT ĐIỂM LUỒNG CHỌN NGÀY: Đồng bộ biến mạng và ép render Summary vé
// ==========================================================================
function selectCgvBookingDate(fullDateId) {
  // 1. Găm chặt ngày mới chọn vào biến toàn cục quản lý
  selectedDateStr = fullDateId; 
  // 🚀 RESET GHẾ: Xóa sạch danh sách ghế cũ đang chọn khi đổi ngày
  selectedSeats = [];
  // 2. Reset suất chiếu đang chọn về rỗng để ép khách hàng chọn giờ chiếu mới của ngày mới
  selectedShowtime = "";
  window.currentSelectedShowtimeId = null;
  
  // 3. Đồng bộ nhãn hiển thị ngày ở cột Summary bên phải giao diện đặt vé (Bảo trì nhãn UI)
  const sumDateEl = document.getElementById("sum-date");
  if (sumDateEl) {
    sumDateEl.innerText = fullDateId;
  }
  
  // 4. Vẽ lại thanh cuộn Slider ngày để cập nhật màu nền khối active đen/trắng
  generateCgvDateSlider(); 
  
  // 5. Kích hoạt cào API lấy suất chiếu động của đúng ngày mới này lên màn hình
  if (typeof renderCgvInterface === "function") {
    renderCgvInterface();
  }
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
  const now = new Date();

  // 🚀 KHÓA BAN ĐẦU: Chỉ thiết lập ngày hôm nay nếu biến ngày đang trống hoàn toàn (khi mới nạp trang)
  if (!selectedDateStr || selectedDateStr === "") {
    const y = now.getFullYear();
    const m = (now.getMonth() + 1).toString().padStart(2, "0");
    const d = now.getDate().toString().padStart(2, "0");
    selectedDateStr = `${y}-${m}-${d}`;
  }

  for (let i = 0; i < 30; i++) {
    const targetDate = new Date();
    targetDate.setDate(now.getDate() + i);

    const year = targetDate.getFullYear();
    const month = (targetDate.getMonth() + 1).toString().padStart(2, "0");
    const dateNum = targetDate.getDate().toString().padStart(2, "0");
    const dayName = daysOfWeek[targetDate.getDay()];

    const fullDateId = `${year}-${month}-${dateNum}`;

    const bg = selectedDateStr === fullDateId ? "#111" : "#fff";
    const color = selectedDateStr === fullDateId ? "#fff" : "#555";
    const border = selectedDateStr === fullDateId ? "#111" : "#ccc";

    // Kích hoạt sự kiện gọi hàm chọn ngày độc lập khi click
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

// ==========================================================================
// 🚀 BỔ SUNG: HÀM VẼ GIAO DIỆN TỔNG HỢP VÀ TỰ ĐỘNG TẢI SUẤT CHIẾU ĐỘNG TỪ DB
// ==========================================================================


// 🚀 THÊM MỚI: Hàm xử lý click chọn suất chiếu độc lập để triệt tiêu lỗi đệ quy vô hạn
function selectCgvShowtimeSlot(startTime, showtimeId) {
  selectedShowtime = startTime;
  window.currentSelectedShowtimeId = showtimeId;

  // 🚀 RESET GHẾ: Xóa sạch ghế cũ khi đổi sang khung giờ chiếu khác
  selectedSeats = [];

  // Chỉ render lại cục bộ thay vì ép buộc bắn lại request mạng trùng lặp
  if (typeof renderCgvInterface === "function") {
    renderCgvInterface();
  }
}

function renderCgvInterface() {
  const movieZone = document.getElementById("cgv-movie-list");
  const selectCombo = document.getElementById("cgv-combo-movie");
  if (!movieZone || !selectCombo) return;

  movieZone.innerHTML = "";
  let rankCounter = 1;

  // 1. Duyệt mảng phim động từ SQL Server lưu trong state toàn cục để vẽ ra màn hình
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
            </div>`;
        rankCounter++;
      }
    }
  });

  const currentMovie =
    selectCombo.value ||
    (selectCombo.options[0] ? selectCombo.options[0].value : "");
  document.getElementById("sum-movie-title").innerText = currentMovie || "-";

  // 2. Tải tự động danh sách lịch chiếu động từ Database theo bộ phim đang chọn trên màn hình đặt vé
  const timeGrid = document.getElementById("cgv-showtime-grid");
  if (timeGrid && serverData.movies && serverData.movies.length > 0) {
    const selectedMovieObj = serverData.movies.find((m) => 
      String(m.title).trim().toLowerCase() === String(currentMovie).trim().toLowerCase()
    );

    if (selectedMovieObj) {
      const movieId = selectedMovieObj.movieId || selectedMovieObj.movie_id || selectedMovieObj.id;
      
      let dateStr = selectedDateStr; 
      if (!dateStr || dateStr === "") {
        const today = new Date();
        const y = today.getFullYear();
        const m = (today.getMonth() + 1).toString().padStart(2, "0");
        const d = today.getDate().toString().padStart(2, "0");
        dateStr = `${y}-${m}-${d}`;
      }

      console.log(`🎬 Gửi request lấy suất chiếu phim ID: ${movieId} cho ngày: ${dateStr}`);

      API.getShowtimes(movieId, dateStr)
        .then((resData) => {
          timeGrid.innerHTML = ""; 
          const actualShowtimes = resData.showtimes || [];

          if (actualShowtimes.length === 0) {
            timeGrid.innerHTML = `<p style="color:#777; font-size:13px; grid-column: span 4; text-align:center; padding: 10px 0;">Hôm nay rạp chưa xếp lịch chiếu phim này!</p>`;
            // 🚀 BỔ SUNG: Xóa trắng sơ đồ ghế cũ nếu ngày này không có suất chiếu nào
            if (document.getElementById("cgv-seat-grid")) {
              document.getElementById("cgv-seat-grid").innerHTML = `<p style="color:#777; font-size:13px; text-align:center; grid-column:1/-1;">Vui lòng chọn một suất chiếu cụ thể để hiển thị sơ đồ ghế!</p>`;
            }
            return;
          }

          actualShowtimes.forEach((st) => {
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
        .catch((err) => {
          console.error("🚨 Lỗi nạp ma trận lịch chiếu từ Database:", err);
          timeGrid.innerHTML = `<p style="color:#e71a0f; font-size:13px; grid-column: span 4; text-align:center;">Lỗi kết nối lịch chiếu rạp!</p>`;
        });
    }
  }

  document.getElementById("sum-showtime").innerText = selectedShowtime || "-";

  // ==========================================================================
  // 3. 🚀 ĐOẠN ĐÃ ĐỒNG BỘ CAO CẤP: Vẽ sơ đồ ghế động khớp 100% [room_layout] từ DB
  // ==========================================================================
  const seatGrid = document.getElementById("cgv-seat-grid");
  if (seatGrid) {
    if (!selectedShowtime || !window.currentSelectedShowtimeId) {
      seatGrid.innerHTML = `<p style="color:#777; font-size:13px; text-align:center; grid-column:1/-1;">Vui lòng chọn một suất chiếu cụ thể để hiển thị sơ đồ ghế!</p>`;
      return;
    }

    // 🚀 BƯỚC 1: Tìm xem suất chiếu đang chọn thuộc Phòng mấy (roomId) để lấy layout
    let currentRoomId = 1; // Mặc định phòng 1
    if (serverData.showtimes && serverData.showtimes.length > 0) {
      const currentStObj = serverData.showtimes.find(st => st.showtimeId == window.currentSelectedShowtimeId);
      if (currentStObj) {
        currentRoomId = currentStObj.roomId || currentStObj.room_id || 1;
      }
    }

    // 🚀 BƯỚC 2: Định nghĩa ma trận chuỗi Layout khớp 100% với bảng [room_layout] của SQL Server
    const roomLayouts = {
      1: ["SSSSSSSSSS", "SSSSSSSSSS", "SSSSSSSSSS", "SSSSSSSSSS", "VVVVVVVVVV", "VVVVVVVVVV", "VVVVVVVVVV", "VVVVVVVVVV", "WWWW_WWWW", "WWWW_WWWW"],
      2: ["SSSSSSSSSS", "SSSSSSSSSS", "SSSSSSSSSS", "SSSSSSSSSS", "SSSSSSSSSS", "SSSSSSSSSS", "VVVVVVVVVV", "VVVVVVVVVV", "VVVVVVVVVV", "WWWW_WWWW"],
      3: ["SSSSSSSSSS", "SSSSSSSSSS", "VVVVVVVVVV", "VVVVVVVVVV", "VVVVVVVVVV", "VVVVVVVVVV", "VVVVVVVVVV", "VVVVVVVVVV", "WWWW_WWWW", "WWWW_WWWW"]
    };

    // Lấy ra sơ đồ mảng 10 hàng của phòng hiện tại
    const currentLayout = roomLayouts[currentRoomId] || roomLayouts[1];

    // 🚀 BƯỚC 3: Gọi API lấy ghế đã bán thực tế từ Spring Boot
    API.getSeatsByShowtime(window.currentSelectedShowtimeId)
      .then((backendSeats) => {
        seatGrid.innerHTML = "";
        
        // Đồng bộ hóa gộp mã ghế đã bán từ DB
        const soldSeatsFromDb = Array.isArray(backendSeats) 
          ? backendSeats
              .filter(s => s.status === "sold" || s.status === "BOOKED" || s.status === "SLOT_LOCKED")
              .map(s => {
                const row = s.seatRow || s.seat_row || "";
                const num = s.seatNumber || s.seat_number || "";
                return `${row}${num}`.trim().toUpperCase();
              }) 
          : [];

        const rows = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
        
        // Duyệt qua 10 hàng (tương ứng row_index từ 1 đến 10)
        for (let r = 0; r < rows.length; r++) {
          const layoutString = currentLayout[r]; // Ví dụ: "WWWW_WWWW"

          // Duyệt qua 10 cột ghế
          for (let c = 1; c <= 10; c++) {
            const charType = layoutString[c - 1]; // Lấy ký tự tại vị trí cột (S, V, W, _)

            // 🚀 XỬ LÝ LỐI ĐI (_): Nếu dính ký tự gạch dưới, tạo một ô trống không có ghế để làm hành lang
            if (charType === "_") {
              const spacer = document.createElement("div");
              spacer.className = "cgv-seat-spacer"; // Thêm style width tương đương ghế, background trong suốt trong file CSS của em
              spacer.style.width = "100%";
              seatGrid.appendChild(spacer);
              continue; // Nhảy sang cột tiếp theo
            }

            const id = `${rows[r]}${c}`; // Định danh mã ghế Front-End: "I1", "J4"...

            // Phân loại ghế dựa động hoàn toàn vào ký tự của bảng [room_layout]
            let seatType = "Standard";
            if (charType === "V") seatType = "VIP";
            if (charType === "W") seatType = "Sweetbox";

            // Kiểm tra trạng thái đã bán từ dữ liệu SQL thực
            let status = "available";
            if (soldSeatsFromDb.includes(id)) {
              status = "sold"; 
            }

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
      })
      .catch((err) => {
        console.error("🚨 Lỗi nạp sơ đồ ghế ma trận động:", err);
        seatGrid.innerHTML = `<p style="color:red; font-size:13px; text-align:center; grid-column:1/-1;">Lỗi tải sơ đồ ghế phòng chiếu!</p>`;
      });
  }
}
