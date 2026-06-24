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
function switchCgvTab(panelId, filterType = "now_showing") {
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
