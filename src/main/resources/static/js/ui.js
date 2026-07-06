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
      console.log("API.getMovies =", resData);

      if (resData && resData.data && resData.data.movies) {
        serverData.movies = resData.data.movies;
      } else {
        serverData.movies = resData || [];
      }

      console.log("movies sau khi gán =", serverData.movies);

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
    .catch((err) =>
      console.error("🚨 Lỗi khởi tạo danh sách phim từ DB:", err),
    );
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

    const loggedInId =
      sessionStorage.getItem("accountId") || window.currentLoggedInId;

    if (
      loggedInId &&
      typeof API !== "undefined" &&
      typeof API.getProfile === "function"
    ) {
      API.getProfile(loggedInId)
        .then((profileRes) => {
          if (profileRes.status === "success") {
            const updatedData = profileRes.data;

            if (document.getElementById("profile-field-name"))
              document.getElementById("profile-field-name").value =
                updatedData.fullName;
            if (document.getElementById("profile-field-email"))
              document.getElementById("profile-field-email").value =
                updatedData.email;
            if (document.getElementById("profile-field-phone")) {
              document.getElementById("profile-field-phone").value =
                updatedData.phone || "";
            }

            if (updatedData.dateOfBirth) {
              const [year, month, day] = updatedData.dateOfBirth.split("-");
              if (document.getElementById("profile-birth-day"))
                document.getElementById("profile-birth-day").value = parseInt(
                  day,
                  10,
                );
              if (document.getElementById("profile-birth-month"))
                document.getElementById("profile-birth-month").value = parseInt(
                  month,
                  10,
                );
              if (document.getElementById("profile-birth-year"))
                document.getElementById("profile-birth-year").value = parseInt(
                  year,
                  10,
                );
            }
          }
        })
        .catch((err) =>
          console.error("🚨 Lỗi tự động đồng bộ dữ liệu hồ sơ cá nhân:", err),
        );
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
      <span onclick="confirmLogoutAction(event)" style="color: #ff6b35; margin-left: 8px; cursor: pointer; text-decoration: underline; font-weight: bold;">[THOÁT]</span>
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
        const img =
          ev.imageUrl ||
          "https://www.cgv.vn/media/catalog/product/placeholder/default/cgv_title.png";
        container.innerHTML += `
            <div style="border: 1px solid rgba(255,255,255,0.12); background: #17171b; padding: 5px;">
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

// ==========================================================================
// 🚀 ĐÃ NÂNG CẤP: Vẽ danh sách F&B động bốc trực tiếp từ Database mẫu
// ==========================================================================
function renderFnbMenu() {
  const container = document.getElementById("cgv-fnb-menu");
  if (!container) return;
  container.innerHTML = "";
if (!window.fnbMenu || window.fnbMenu.length === 0) {
  container.innerHTML = "<p style='text-align:center; color:#666; padding:15px; font-size:13px;'>Đang nạp menu bắp nước từ hệ thống...</p>";
  return;
}

// Clear container trước khi render (nếu cần) để tránh cộng dồn lặp dữ liệu
container.innerHTML = ""; 

// 2. Duyệt qua window.fnbMenu của main
window.fnbMenu.forEach((item, index) => {
  const inCart = item.qty > 0;
  
  // 3. Giữ logic tự động nhận diện icon phòng khi item.icon bị rỗng từ main
  let icon = item.icon;
  if (!icon) {
    const nameLower = (item.name || "").toLowerCase();
    icon = "🍿"; 
    if (nameLower.includes("combo") || nameLower.includes("bap rang lon")) icon = "🎁";
    if (nameLower.includes("nuoc") || nameLower.includes("coca") || nameLower.includes("ly")) icon = "🥤";
    if (nameLower.includes("khoai") || nameLower.includes("chien")) icon = "🍟";
  }

  // 4. Giữ cấu trúc render danh sách bullets từ fe-xin-xo
  const bullets = (item.items || [])
    .map((t) => `<li>${t}</li>`)
    .join("");

  // 5. Giữ bộ điều khiển nút bấm thông minh từ fe-xin-xo
  const control = inCart
    ? `<div class="fnb-stepper">
          <button class="fnb-step-btn" onclick="updateComboQty(${index}, -1)">−</button>
          <span class="fnb-step-qty">×${item.qty}</span>
          <button class="fnb-step-btn fnb-step-plus" onclick="updateComboQty(${index}, 1)">+</button>
       </div>`
    : `<button class="fnb-add-btn" onclick="updateComboQty(${index}, 1)">＋ Thêm vào đơn</button>`;

  // 6. Output chuẩn theo giao diện sạch sẽ, dùng class CSS của fe-xin-xo
  container.innerHTML += `
    <div class="fnb-card ${inCart ? "fnb-card-active" : ""}">
      <div class="fnb-card-head">
        <div class="fnb-card-icon">${icon}</div>
        ${item.popular ? `<span class="fnb-tag-popular">Phổ biến</span>` : ""}
        <span class="fnb-card-price">${item.price.toLocaleString("vi-VN")}đ</span>
      </div>
      <h4 class="fnb-card-title">${item.name}</h4>
      ${item.desc ? `<p class="fnb-card-desc">${item.desc}</p>` : ""}
      ${bullets ? `<ul class="fnb-card-list">${bullets}</ul>` : ""}
      <div class="fnb-card-action">${control}</div>
    </div>`;s
  });
}

window.updateComboQty = function(index, change) {
  if (!window.fnbMenu || !window.fnbMenu[index]) return;

  let newQty = window.fnbMenu[index].qty + change;
  if (newQty < 0) newQty = 0; 

  window.fnbMenu[index].qty = newQty;
  renderFnbMenu();

  if (typeof window.calculateCgvCart === "function") {
    window.calculateCgvCart();
  } else if (typeof calculateCgvCart === "function") {
    calculateCgvCart();
  }
};

function selectCgvBookingDate(fullDateId) {
  // 1. Găm chặt ngày mới chọn vào biến toàn cục quản lý
  selectedDateStr = fullDateId; 
  // 🚀 RESET GHẾ: Xóa sạch danh sách ghế cũ đang chọn khi đổi ngày
  selectedSeats = [];
  selectedShowtime = "";
  window.currentSelectedShowtimeId = null;
  
  const sumDateEl = document.getElementById("sum-date");
  if (sumDateEl) {
    sumDateEl.innerText = fullDateId;
  }
  
  generateCgvDateSlider(); 
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

function selectCgvShowtimeSlot(startTime, showtimeId) {
  selectedShowtime = startTime;
  window.currentSelectedShowtimeId = showtimeId;
  selectedSeats = [];

  if (typeof renderCgvInterface === "function") {
    renderCgvInterface();
  }
}

// 🚀 THẦY ĐÃ PHÁT HIỆN VÀ FIX: Gom chuẩn toàn bộ hàm renderCgvInterface bao bọc lấy khối gọi API lấy ghế (Không đóng ngoặc bậy nữa!)
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
          m.mainposter_url || m.mainposterUrl || m.mainposterurl || m.img || "https://www.cgv.vn/media/catalog/product/placeholder/default/cgv_title.png";
          
        let displayAge = m.age_rating === 0 || m.ageRating === 0 ? "P" : `T${m.age_rating || m.ageRating || (m.status === "now_showing" ? "16" : "P")}`;

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

  console.log("Dropdown value =", selectCombo.value);
  console.log("Movies =", serverData.movies);
  const currentMovie =
    selectCombo.value ||
    (selectCombo.options[0] ? selectCombo.options[0].value : "");
  document.getElementById("sum-movie-title").innerText = currentMovie || "-";

  const timeGrid = document.getElementById("cgv-showtime-grid");
  if (timeGrid && serverData.movies && serverData.movies.length > 0) {
    const selectedMovieObj = serverData.movies.find(
      (m) =>
        String(m.title).trim().toLowerCase() ===
        String(currentMovie).trim().toLowerCase(),
    );

    if (selectedMovieObj) {
      const movieId =
        selectedMovieObj.movieId ||
        selectedMovieObj.movie_id ||
        selectedMovieObj.id;

      let dateStr = selectedDateStr;
      if (!dateStr || dateStr === "") {
        const today = new Date();
        const y = today.getFullYear();
        const m = (today.getMonth() + 1).toString().padStart(2, "0");
        const d = today.getDate().toString().padStart(2, "0");
        dateStr = `${y}-${m}-${d}`;
      }

      console.log(
        `🎬 Gửi request lấy suất chiếu phim ID: ${movieId} cho ngày: ${dateStr}`,
      );

      API.getShowtimes(movieId, dateStr)
        .then((resData) => {
          timeGrid.innerHTML = "";
          const actualShowtimes = resData.showtimes || [];
          serverData.showtimes = actualShowtimes;

          if (actualShowtimes.length === 0) {
            timeGrid.innerHTML = `<p style="color:#9a9aa3; font-size:13px; grid-column: span 4; text-align:center; padding: 10px 0;">Hôm nay rạp chưa xếp lịch chiếu phim này!</p>`;
            if (document.getElementById("cgv-seat-grid")) {
              document.getElementById("cgv-seat-grid").innerHTML =
                `<p style="color:#9a9aa3; font-size:13px; text-align:center; grid-column:1/-1;">Vui lòng chọn một suất chiếu cụ thể để hiển thị sơ đồ ghế!</p>`;
            }
            return;
          }

          actualShowtimes.forEach((st) => {
            const isSelected = st.startTime === selectedShowtime;
            const activeClass = isSelected ? "active" : "";
            const roomDisplayName = st.roomId === 2 || st.room_id === 2 ? "Phòng 2 (IMAX Siêu Đại)" : "Phòng 1 (3D Standard)";

            timeGrid.innerHTML += `
              <div class="showtime-btn ${activeClass}" onclick="selectCgvShowtimeSlot('${st.startTime}', ${st.showtimeId})">
                  ${st.startTime}
                  <span style="display:block; font-size:9px; opacity:0.6; margin-top:2px;">
                      ${roomDisplayName}
                  </span>
              </div>`;
          });
        })
        .catch((err) => {
          console.error("🚨 Lỗi nạp ma trận lịch chiếu từ Database:", err);
          timeGrid.innerHTML = `<p style="color:#ff6b35; font-size:13px; grid-column: span 4; text-align:center;">Lỗi kết nối lịch chiếu rạp!</p>`;
        });
    }
  }

  document.getElementById("sum-showtime").innerText = selectedShowtime || "-";

  const seatGrid = document.getElementById("cgv-seat-grid");
  if (seatGrid) {
    if (!selectedShowtime || !window.currentSelectedShowtimeId) {
      seatGrid.innerHTML = `<p style="color:#9a9aa3; font-size:13px; text-align:center; grid-column:1/-1;">Vui lòng chọn một suất chiếu cụ thể để hiển thị sơ đồ ghế!</p>`;
      return;
    }

    let currentRoomId = 1; 
    if (serverData.showtimes && serverData.showtimes.length > 0) {
      const currentStObj = serverData.showtimes.find(
        (st) => st.showtimeId == window.currentSelectedShowtimeId,
      );
      if (currentStObj) {
        currentRoomId = currentStObj.roomId || currentStObj.room_id || 1;
      }
    }

    seatGrid.style.display = "grid";
    if (currentRoomId == 2) {
      seatGrid.style.gridTemplateColumns = "repeat(21, 1fr)";
      seatGrid.style.gap = "4px"; 
    } else {
      seatGrid.style.gridTemplateColumns = "repeat(10, 1fr)";
      seatGrid.style.gap = "6px";
    }

    API.getSeatsByShowtime(window.currentSelectedShowtimeId)
      .then((backendSeats) => {
        // 🚀 ĐÃ SỬA CHUẨN: Găm mảng dữ liệu ghế thật từ Server ra toàn cục đúng vị trí ngữ cảnh
        window.currentBackendSeats = backendSeats;
        seatGrid.innerHTML = "";
        
        const soldSeatsFromDb = Array.isArray(backendSeats) 
          ? backendSeats
              .filter(
                (s) =>
                  s.status === "sold" ||
                  s.status === "BOOKED" ||
                  s.status === "SLOT_LOCKED",
              )
              .map((s) => {
                const row = s.seatRow || s.seat_row || "";
                const num = s.seatNumber || s.seat_number || "";
                return `${row}${num}`.trim().toUpperCase();
              })
          : [];

        window.calculateSeatOnly = function() {
          document.getElementById("sum-seats").innerText = selectedSeats.join(", ") || "Chưa chọn";
          let total = 0;
          let totalFnbItems = 0;

          selectedSeats.forEach((seatId) => {
            const seatData = backendSeats.find(s => {
              const row = s.seatRow || s.seat_row || "";
              const num = s.seatNumber || s.seat_number || "";
              return `${row}${num}`.trim().toUpperCase() === seatId.toUpperCase();
            });
            
            console.log("Found:", seatData);

            if (seatData) {
                console.log("Type:", seatData.seatType);
            }

            if (seatData) {
              const type = (seatData.seatType || seatData.seat_type || "STANDARD").toUpperCase();
              if (type === "VIP") total += 110000;
              else if (type === "SWEETBOX") total += 250000;
              else total += 90000;
            } else {
              total += 90000;
            }
          });

          const activeFnb = window.fnbMenu || [];
          activeFnb.forEach((item) => {
            total += item.qty * item.price;
            totalFnbItems += item.qty;
          });
          
          const sumFnb = document.getElementById("sum-fnb");
          if (sumFnb) sumFnb.innerText = totalFnbItems + " Combo";
          
          currentPriceTotal = total;
          let finalTotal = currentPriceTotal * (1 - (typeof appliedVoucherDiscount !== "undefined" ? appliedVoucherDiscount : 0));
          
          const sumTotal = document.getElementById("sum-total");
          if (sumTotal) sumTotal.innerText = finalTotal.toLocaleString("vi-VN") + " đ";
        };

        if (Array.isArray(backendSeats) && backendSeats.length > 0) {
          backendSeats.forEach((seat) => {
            const rowLetter = seat.seatRow || seat.seat_row || "";
            const seatNum = seat.seatNumber || seat.seat_number || "";
            const id = `${rowLetter}${seatNum}`.trim().toUpperCase();

            const rawType = (seat.seatType || seat.seat_type || "STANDARD").toUpperCase();
            let cssType = "Standard";
            if (rawType === "VIP") cssType = "VIP";
            if (rawType === "SWEETBOX") cssType = "Sweetbox";

            let status = "available";
            if (soldSeatsFromDb.includes(id)) {
              status = "sold";
            }

            const div = document.createElement("div");
            div.className = `cgv-seat ${cssType} ${status}`;
            div.innerText = id;
            div.style.gridColumn = seat.colIndex || seat.col_index;
            div.style.gridRow = seat.rowIndex || seat.row_index;

            if (selectedSeats.includes(id)) div.classList.add("selected");

            if (status === "available") {
              div.onclick = () => {
                if (selectedSeats.includes(id))
                  selectedSeats = selectedSeats.filter((x) => x !== id);
                else selectedSeats.push(id);
                
                // 🚀 ĐÃ SỬA KHÔN NGOAN: Chỉ đổi class UI cục bộ và chạy tính tiền, cấm renderCgvInterface() làm re-fetch
                if (selectedSeats.includes(id)) div.classList.add("selected");
                else div.classList.remove("selected");

                window.calculateSeatOnly();
              };
            }
            seatGrid.appendChild(div);
          });
        }
        window.calculateSeatOnly();
        console.log(backendSeats);
      })
      .catch((err) => {
        console.error("🚨 Lỗi nạp sơ đồ ghế ma trận động từ DB:", err);
        seatGrid.innerHTML = `<p style="color:red; font-size:13px; text-align:center; grid-column:1/-1;">Lỗi tải sơ đồ ghế phòng chiếu!</p>`;
      });
  }
} // 🚀 ĐÚNG NƠI ĐÚNG CHỖ: Dấu đóng ngoặc chuẩn của hàm renderCgvInterface kết thúc toàn vẹn ở đây!
