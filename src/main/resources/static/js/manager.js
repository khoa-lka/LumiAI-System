// ==========================================================================
// MÃ NGUỒN XỬ LÝ GIAO DIỆN QUẢN LÝ RẠP (MANAGER)
// File: js/manager.js
// ==========================================================================

// ==========================================================================
// 🎬 TRẠNG THÁI PHIM DÙNG CHUNG TOÀN HỆ THỐNG MANAGER (3 mức)
//    now_showing (Đang chiếu) · coming_soon (Sắp chiếu) · hidden (Ẩn)
//    "Ẩn" = phim không hiển thị cho khách ở trang chủ nhưng manager vẫn
//    quản lý/xếp lịch chiếu nội bộ được bình thường.
// ==========================================================================
const MP_MOVIE_STATUS = {
  now_showing: { text: "Đang chiếu", class: "active", color: "#2e7d32" },
  coming_soon: { text: "Sắp chiếu", class: "coming", color: "#f57c00" },
  hidden: { text: "Ẩn", class: "hidden", color: "#8a8a93" },
};
function mpStatusMeta(status) {
  return MP_MOVIE_STATUS[status] || MP_MOVIE_STATUS.hidden;
}
window.MP_MOVIE_STATUS = MP_MOVIE_STATUS;
window.mpStatusMeta = mpStatusMeta;

// ==========================================================================
// 🔔 HỆ THỐNG THÔNG BÁO TOAST (thay thế hộp thoại alert() xấu xí của trình duyệt)
// - Tự động ẩn sau 5 giây (có thể bấm ✕ để tắt sớm).
// - Tự nhận diện loại thông báo (thành công / lỗi / cảnh báo / thông tin) dựa
//   trên từ khóa trong nội dung để tô màu phù hợp, không cần sửa từng chỗ gọi.
// - Ghi đè window.alert => MỌI lời gọi alert("...") trong toàn bộ project
//   (kể cả các file JS khác) sẽ tự động hiển thị dưới dạng toast này.
// - confirm() KHÔNG bị ảnh hưởng, vẫn dùng hộp thoại gốc của trình duyệt vì
//   cần giá trị trả về đồng bộ (xác nhận Có/Không) để code xử lý tiếp.
// ==========================================================================
function ensureToastContainer() {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.style.cssText = `
      position: fixed; top: 20px; right: 20px; z-index: 99999;
      display: flex; flex-direction: column; gap: 10px;
      pointer-events: none;
    `;
    document.body.appendChild(container);
  }
  return container;
}

function detectToastType(message) {
  const text = String(message).toLowerCase();
  if (
    text.includes("không thể") ||
    text.includes("thất bại") ||
    text.includes("lỗi")
  )
    return "error";
  if (text.includes("cảnh báo") || text.includes("vui lòng")) return "warning";
  if (text.includes("thành công")) return "success";
  return "info";
}

const TOAST_ICONS = { success: "✅", error: "⛔", warning: "⚠️", info: "ℹ️" };
const TOAST_BORDER_COLORS = {
  success: "#4ade80",
  error: "#f87171",
  warning: "#f59e0b",
  info: "#60a5fa",
};

function dismissToast(toast) {
  if (!toast || !toast.parentElement) return;
  clearTimeout(toast._toastTimer);
  toast.style.opacity = "0";
  toast.style.transform = "translateX(30px)";
  setTimeout(() => toast.remove(), 250);
}

function showToast(message, type, duration = 5000) {
  const container = ensureToastContainer();
  const finalType = type || detectToastType(message);
  const borderColor = TOAST_BORDER_COLORS[finalType] || TOAST_BORDER_COLORS.info;

  const toast = document.createElement("div");
  toast.style.cssText = `
    min-width: 280px; max-width: 380px;
    background: #141417; border: 1px solid rgba(255,255,255,0.12);
    border-left: 4px solid ${borderColor};
    border-radius: 10px; padding: 14px 16px; color: #f4f4f5;
    font-size: 13.5px; line-height: 1.5; font-family: inherit;
    box-shadow: 0 10px 30px rgba(0,0,0,0.4);
    display: flex; align-items: flex-start; gap: 10px;
    pointer-events: auto; opacity: 0; transform: translateX(30px);
    transition: opacity 0.25s ease, transform 0.25s ease;
    white-space: pre-line;
  `;
  toast.innerHTML = `
    <span style="flex:1;">${String(message).replace(/\n/g, "<br>")}</span>
    <span style="cursor:pointer; opacity:0.6; font-size:14px; flex-shrink:0;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.6" onclick="dismissToast(this.parentElement)">✕</span>
  `;
  container.appendChild(toast);

  // Kích hoạt animation trượt vào
  requestAnimationFrame(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateX(0)";
  });

  // Tự động ẩn sau `duration` ms (mặc định 5 giây)
  toast._toastTimer = setTimeout(() => dismissToast(toast), duration);
}

// Ghi đè alert() gốc của trình duyệt bằng toast — áp dụng toàn cục cho mọi file JS
window.alert = function (message) {
  showToast(message);
};

window.addEventListener("DOMContentLoaded", () => {
  // Xác định vai trò: ưu tiên localStorage (bền vững), dự phòng sessionStorage
  function resolveRoleAndName() {
    var roleId = null,
      fullName = "";
    try {
      var raw = localStorage.getItem("las_logged_in_user");
      if (raw) {
        var u = JSON.parse(raw);
        roleId =
          u.roleId != null ? u.roleId : u.role_id != null ? u.role_id : null;
        fullName = u.fullName || u.fullname || "";
      }
    } catch (e) {}
    if (roleId == null) {
      var sr = sessionStorage.getItem("roleId");
      if (sr != null && sr !== "") roleId = parseInt(sr, 10);
    }
    if (!fullName) fullName = sessionStorage.getItem("fullName") || "Manager";
    return {
      roleId: roleId != null ? parseInt(roleId, 10) : null,
      fullName: fullName,
    };
  }

  var info = resolveRoleAndName();
  var ALLOWED_ROLES = [1]; // Chỉ MANAGER (1) — Admin(4) dùng admin.html riêng

  // Nếu không phải Manager -> Đuổi về trang chủ
  if (ALLOWED_ROLES.indexOf(info.roleId) === -1) {
    alert("CẢNH BÁO: Khu vực nội bộ! Bạn không có quyền truy cập.");
    // Toast không chặn luồng như alert() gốc nên cần đợi 1 chút để người dùng
    // kịp đọc thông báo trước khi bị điều hướng về trang chủ.
    setTimeout(() => {
      window.location.href = "index.html";
    }, 1800);
    return;
  }

  // Nếu hợp lệ, tự động load danh sách phim + dashboard analytics
  const titleEl = document.getElementById("mp-dynamic-title");
  if (titleEl) titleEl.innerText = `Xin chào Manager: ${info.fullName}`;

  // 🚀 Cập nhật tên/quyền/avatar ở góc phải header theo đúng tài khoản đang đăng nhập
  // (trước đây các thẻ này bị viết cứng "Nguyễn Văn Viên" / "Quản lý")
  updateManagerProfileHeader(info.fullName);

  loadManagerMovies();
  if (typeof window.loadManagerPromo === "function") window.loadManagerPromo();
  if (typeof window.loadManagerDashboard === "function")
    window.loadManagerDashboard();
});

// --- CẬP NHẬT TÊN/QUYỀN/AVATAR TRÊN HEADER THEO TÀI KHOẢN ĐANG ĐĂNG NHẬP ---
function updateManagerProfileHeader(fullName) {
  var nameBox = document.getElementById("mp-user-name-text");
  var headerBox = document.getElementById("mp-user-dropdown-header");

  if (nameBox) nameBox.innerText = fullName;
  if (headerBox) headerBox.innerText = "Chào, " + fullName;
  // Avatar & mũi tên (▾) giờ là icon SVG cố định (đồng bộ theo ảnh mẫu),
  // không cần cập nhật động theo tên tài khoản nữa.
  // Vai trò (mp-user-role) hiện cố định là "Quản lý" vì manager.html chỉ cho
  // phép roleId === 1 truy cập (xem ALLOWED_ROLES ở trên), nên không cần đổi.
}

// --- THOÁT VAI TRÒ MANAGER, QUAY VỀ GIAO DIỆN CUSTOMER (index.html) ---
// Lưu ý: KHÔNG xóa localStorage "las_logged_in_user" / sessionStorage đăng nhập
// -> Tài khoản Manager vẫn được xem là "đã đăng nhập" khi quay lại trang chủ,
//    để Manager có thể tự trải nghiệm & kiểm tra thao tác trên giao diện Customer.
function exitManagerRoleToCustomerView() {
  console.log("[Manager] Thoát vai trò Manager -> quay về Trang chủ Customer");
  window.location.replace("index.html");
}
window.exitManagerRoleToCustomerView = exitManagerRoleToCustomerView;

// --- 1. CHUYỂN TAB TRONG MANAGER DASHBOARD ---
// 🚀 ĐÃ HỢP NHẤT: trước đây hàm này bị định nghĩa 2 LẦN — 1 lần ở đây (manager.js,
// load trước) và 1 lần trong <script> inline cuối manager.html (load sau, nên bản
// ở HTML mới là bản THẬT SỰ đang chạy, bản ở đây chỉ là "xác chết" không ai gọi tới).
// Giờ gộp lại thành đúng 1 nguồn duy nhất tại đây, giữ nguyên 100% hành vi đang chạy
// (kể cả tab "events" mà bản cũ trong manager.js này từng thiếu), cộng thêm try/catch
// phòng thủ để 1 tab lỗi không kéo sập luôn cả hàm chuyển tab.
window.switchMpTab = function (tabId) {
  document.querySelectorAll(".mp-tab-section").forEach((tab) => {
    tab.classList.remove("active");
    tab.style.display = "none";
  });
  document.querySelectorAll(".mp-nav-item").forEach((nav) => {
    nav.classList.remove("active");
  });

  const targetTab = document.getElementById("mp-tab-" + tabId);
  const targetNav = document.getElementById("mp-nav-" + tabId);

  if (targetTab) {
    targetTab.classList.add("active");
    targetTab.style.display = "block";
  }
  if (targetNav) targetNav.classList.add("active");

  const titles = {
    dashboard: "Tổng quan hoạt động rạp",
    movies: "Quản lý Danh mục Phim",
    matrix: "Ma trận Lịch chiếu",
    fnb: "Quản lý Kho F&B",
    promo: "Quản lý Chiến dịch Khuyến mãi",
    events: "Sự kiện và Ưu đãi",
    audit: "Báo cáo và Kiểm toán Tài chính",
  };
  const titleEl = document.getElementById("mp-dynamic-title");
  if (titleEl) titleEl.innerText = titles[tabId] || "Chức năng đang phát triển...";

  // 0. Vẽ lại Dashboard mỗi khi quay lại Tab Dashboard
  if (tabId === "dashboard" && typeof renderManagerDashboard === "function") {
    try {
      renderManagerDashboard();
    } catch (err) {
      console.error("Lỗi khi render Dashboard:", err);
    }
  }
  // 1. Gọi API nạp dữ liệu phim khi qua Tab Movies
  if (tabId === "movies" && typeof loadManagerMovies === "function") {
    try {
      loadManagerMovies();
    } catch (err) {
      console.error("Lỗi khi load danh sách phim:", err);
    }
  }
  // 2. Tự động kích hoạt gọi API nạp bắp nước từ DB khi chuyển sang Tab F&B
  if (tabId === "fnb" && typeof loadManagerFnb === "function") {
    try {
      loadManagerFnb();
    } catch (err) {
      console.error("Lỗi khi load danh sách F&B từ database:", err);
    }
  }
  // 3. Tự động kích hoạt gọi ma trận lịch chiếu tổng hợp khi qua Tab Matrix
  if (tabId === "matrix" && typeof loadManagerMatrix === "function") {
    try {
      loadManagerMatrix();
    } catch (err) {
      console.error("Lỗi khi load ma trận lịch chiếu:", err);
    }
  }
  // 4. Tự động gọi API nạp voucher từ database khi chuyển sang Tab Promo
  if (tabId === "promo" && typeof loadManagerVouchers === "function") {
    try {
      loadManagerVouchers();
    } catch (err) {
      console.error("Lỗi khi load danh sách Voucher từ database:", err);
    }
  }
  // 5. Vẽ lại Báo cáo & Kiểm toán mỗi khi vào Tab Audit
  // (hỗ trợ cả 2 tên hàm audit vì main/femoi hiện đặt tên khác nhau — sẽ chốt 1 khi xử lý manager-audit.js)
  if (tabId === "audit") {
    try {
      if (typeof renderAuditReport === "function") renderAuditReport();
      else if (typeof window.loadManagerAudit === "function") window.loadManagerAudit();
    } catch (err) {
      console.error("Lỗi khi render Báo cáo & Kiểm toán:", err);
    }
  }
  // 6. Tự động nạp danh sách Sự kiện & Ưu đãi khi chuyển sang Tab Events
  if (tabId === "events" && typeof loadManagerEvents === "function") {
    try {
      loadManagerEvents();
    } catch (err) {
      console.error("Lỗi khi load danh sách Sự kiện & Ưu đãi:", err);
    }
  }
};

// --- 2. QUẢN LÝ MODAL & POPUP (CÁC MODAL KHÁC) ---
function openMpDeleteModal() {
  const el = document.getElementById("mp-delete-modal");
  if (el) el.classList.add("open");
}
function closeMpDeleteModal() {
  const el = document.getElementById("mp-delete-modal");
  if (el) el.classList.remove("open");
}

// (Modal Tạo/Sửa Chiến dịch Khuyến mãi được định nghĩa đầy đủ ở mục 8 bên dưới)

// --- 3. ĐIỀU KHIỂN DROPDOWN (USER & NOTIFICATION) ---
function toggleUserDropdown() {
  const dropdown = document.getElementById("mp-user-dropdown");
  if (dropdown) dropdown.classList.toggle("open");
}

window.toggleNotifDropdown = function () {
  const dropdown = document.getElementById("mp-notif-dropdown");
  if (!dropdown) return;

  const isOpening = !dropdown.classList.contains("open");
  dropdown.classList.toggle("open");

  if (isOpening) {
    markManagerNotificationsRead();
  }
};

// LẮNG NGHE SỰ KIỆN CLICK TOÀN TRANG (GỘP CHUNG ĐÓNG DROPDOWN & MODAL)
window.addEventListener("click", function (event) {
  const userDropdown = document.getElementById("mp-user-dropdown");
  const userProfile = document.querySelector(".mp-profile");
  const notifDropdown = document.getElementById("mp-notif-dropdown");
  const bellIcon = document.querySelector(".mp-bell");
  const editMovieModal = document.getElementById("mp-edit-movie-modal");
  const restockModal = document.getElementById("mp-restock-modal");
  const fnbDeleteModal = document.getElementById("mp-fnb-delete-modal");
  const createPromoModal = document.getElementById("mp-create-promo-modal");
  const promoDeleteModal = document.getElementById("mp-promo-delete-modal");

  // Đóng User Dropdown
  if (
    userDropdown &&
    userProfile &&
    !userProfile.contains(event.target) &&
    !userDropdown.contains(event.target)
  ) {
    userDropdown.classList.remove("open");
  }

  // Đóng Notification Dropdown
  if (
    notifDropdown &&
    bellIcon &&
    !bellIcon.contains(event.target) &&
    !notifDropdown.contains(event.target)
  ) {
    notifDropdown.classList.remove("open");
  }

  // Bấm ra ngoài vùng nền mờ để đóng Modal Sửa Phim
  if (event.target === editMovieModal) {
    closeEditMovie();
  }

  // Bấm ra ngoài vùng nền mờ để đóng Modal Nhập Hàng
  if (event.target === restockModal) {
    closeRestockModal();
  }

  // Bấm ra ngoài vùng nền mờ để đóng Modal Xác nhận Xóa F&B
  if (event.target === fnbDeleteModal) {
    closeFnbDeleteModal();
  }

  // Bấm ra ngoài vùng nền mờ để đóng Modal Tạo/Sửa Chiến dịch Khuyến mãi
  if (event.target === createPromoModal) {
    closeCreatePromoModal();
  }

  // Bấm ra ngoài vùng nền mờ để đóng Modal Xác nhận Xóa Chiến dịch Khuyến mãi
  if (event.target === promoDeleteModal) {
    closePromoDeleteModal();
  }
});

// ==========================================================================
// --- 4. GIAO TIẾP DATABASE & LỌC DỮ LIỆU ĐỘNG ---
// ==========================================================================

// Hàm tách riêng chuyên đảm nhận việc vẽ bảng phim lên giao diện HTML
function renderMoviesTable(movies) {
  const tbody = document.getElementById("mp-movies-tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (!movies || movies.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 20px; color: #888;">Không tìm thấy bộ phim nào khớp với bộ lọc!</td></tr>`;
    return;
  }

  // Thay thế đoạn vẽ bảng trong hàm renderMoviesTable thành đoạn này:
  movies.forEach((m, index) => { // 🚀 ĐÃ SỬA: Thêm index để đếm số thứ tự
    let ageBadgeClass = m.ageRating >= 18 ? "c18" : m.ageRating >= 13 ? "c13" : "p";
    let ageText = m.ageRating === 0 ? "P" : `T${m.ageRating}`;
    let statusMeta = mpStatusMeta(m.status);
    let statusClass = statusMeta.class;
    let statusText = statusMeta.text;
    let posterUrl = m.mainposter_url ? m.mainposter_url : "img/default-poster.jpg";

    tbody.innerHTML += `
      <tr>
          <td style="text-align: center; font-weight: bold;">${index + 1}</td> <td>
              <div class="mp-movie-info">
                  <img src="${posterUrl}" class="mp-movie-poster" alt="${m.title}">
                  <div>
                      <div class="mp-movie-title">${m.title}</div>
                  </div>
              </div>
          </td>
          <td>${m.duration} phút</td>
          <td><div class="mp-age-badges"><span class="mp-badge ${ageBadgeClass}">${ageText}</span></div></td>
          <td>${m.country || "N/A"}</td>
          <td><span class="mp-status ${statusClass}">${statusText}</span></td>
          <td>${m.releaseDate || "N/A"}</td>
          <td>
              <div class="mp-table-actions">
                  <button class="mp-action-btn" onclick="openViewMovie(${m.movieId})" title="Xem chi tiết"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z"/><circle cx="12" cy="12" r="3"/></svg></button>
                  <button class="mp-action-btn" onclick="openUpdateMovie(${m.movieId})" title="Sửa"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button>
                  <button class="mp-action-btn" onclick="openMpDeleteModal(${m.movieId})" title="Xóa"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg></button>
              </div>
          </td>
      </tr>
    `;
  });
}
// Gắn thêm vào window cho chắc chắn
function filterMovies() {
  const searchInput = document.getElementById("mp-search-input");
  const statusSelect = document.getElementById("mp-filter-status");
  const genreSelect = document.getElementById("mp-filter-genre");

  const keyword = searchInput ? searchInput.value.toLowerCase().trim() : "";
  const statusFilter = statusSelect ? statusSelect.value : "all";
  const genreFilter = genreSelect ? genreSelect.value : "all";

  if (!window.moviesList) return;

  const filteredResult = window.moviesList.filter((movie) => {
    const matchesKeyword = movie.title
      ? movie.title.toLowerCase().includes(keyword)
      : false;
    const matchesStatus =
      statusFilter === "all" || movie.status === statusFilter;
    const matchesGenre =
      genreFilter === "all" ||
      (movie.genre &&
        movie.genre.toLowerCase().includes(genreFilter.toLowerCase()));

    return matchesKeyword && matchesStatus && matchesGenre;
  });

  renderMoviesTable(filteredResult);
}
// Gắn thêm vào window để đảm bảo phạm vi toàn cục hoạt động ở mọi nơi
window.filterMovies = filterMovies;

// Hàm tải danh sách phim gốc cho bảng Quản lý

function loadManagerMovies() {
  const tbody = document.getElementById("mp-movies-tbody");
  if (!tbody) return;

  tbody.innerHTML =
    '<tr><td colspan="8" style="text-align:center;">Đang tải danh sách phim từ Database...</td></tr>';

  // Gọi API lấy danh sách phim chuẩn chỉnh từ Spring Boot
  API.getMovies()
    .then((movies) => {
      tbody.innerHTML = "";
      window.moviesList = movies; // Lưu tạm danh sách phim vào biến toàn cục để dùng cho bộ lọc filter

      // Duyệt danh sách phim và gán index tăng dần làm số thứ tự (STT) tự động cập nhật
      movies.forEach((m, index) => { 
        let ageBadgeClass = m.ageRating >= 18 ? "c18" : m.ageRating >= 13 ? "c13" : "p";
        let ageText = m.ageRating === 0 ? "P" : `T${m.ageRating}`;

        let statusMeta = mpStatusMeta(m.status);
        let statusClass = statusMeta.class;
        let statusText = statusMeta.text;
        let rowClass = m.status !== "now_showing" ? 'class="mp-row-inactive"' : "";

        let posterUrl = m.mainposterUrl || m.mainposter_url || "img/default-poster.jpg";

        tbody.innerHTML += `
            <tr ${rowClass}>
                <td style="text-align: center; font-weight: bold;">${index + 1}</td> 
                <td>
                    <div class="mp-movie-info">
                        <img src="${posterUrl}" class="mp-movie-poster" alt="${m.title}">
                        <div>
                            <div class="mp-movie-title">${m.title}</div>
                        </div>
                    </div>
                </td>
                <td>${m.duration || m.durationMinutes || 0} phút</td>
                <td><div class="mp-age-badges"><span class="mp-badge ${ageBadgeClass}">${ageText}</span></div></td>
                <td>${m.country || "N/A"}</td>
                <td><span class="mp-status ${statusClass}">${statusText}</span></td>
                <td>${m.releaseDate || "N/A"}</td>
                <td>
                    <div class="mp-table-actions">
                        <button class="mp-action-btn" onclick="openViewMovie(${m.movieId})" title="Xem chi tiết"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z"/><circle cx="12" cy="12" r="3"/></svg></button>
                        <button class="mp-action-btn" onclick="openUpdateMovie(${m.movieId})" title="Sửa"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button>
                        <button class="mp-action-btn" onclick="openMpDeleteModal(${m.movieId})" title="Xóa"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg></button>
                    </div>
                </td>
            </tr>
        `;
      });
    })
    .catch((err) => {
      console.error("Lỗi:", err);
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:red;">Lỗi kết nối CSDL: ${err.message}</td></tr>`;
    });
}

// ==========================================================================
// --- 5. LOGIC MODAL THÊM / SỬA PHIM MỚI NHẤT ---
// ==========================================================================

window.openAddMovie = function () {
  document.getElementById("add-title").value = "";
  document.getElementById("add-genre").value = "";
  document.getElementById("add-duration").value = "";
  document.getElementById("add-release").value = "";
  document.getElementById("add-country").value = "";
  document.getElementById("add-director").value = "";
  document.getElementById("add-performer").value = "";
  document.getElementById("add-synopsis").value = "";
  document.getElementById("add-mainposter").value = "";
  document.getElementById("add-subposter").value = "";
  document.getElementById("add-age").value = "0";
  document.querySelector(
    'input[name="add_status"][value="now_showing"]',
  ).checked = true;

  document.getElementById("mp-add-movie-modal").style.display = "flex";
};

window.closeAddMovie = function () {
  const modal = document.getElementById("mp-add-movie-modal");
  if (modal) modal.style.display = "none";
};

window.submitAddMovie = function () {
  const movieData = {
    title: document.getElementById("add-title").value,
    genre: document.getElementById("add-genre").value,
    duration: parseInt(document.getElementById("add-duration").value) || 0,
    director: document.getElementById("add-director").value,
    country: document.getElementById("add-country").value,
    performer: document.getElementById("add-performer").value,
    synopsis: document.getElementById("add-synopsis").value,
    mainposter_url: document.getElementById("add-mainposter").value,
    subposter_url: document.getElementById("add-subposter").value,
    releaseDate: document.getElementById("add-release").value,
    ageRating: parseInt(document.getElementById("add-age").value) || 0,
    status: document.querySelector('input[name="add_status"]:checked').value,
    rating: 0.0,
  };

  API.addMovie(movieData)
    .then(() => {
      alert("Thêm phim thành công!");
      closeAddMovie();
      loadManagerMovies();
    })
    .catch((err) => alert("Lỗi khi thêm phim: " + err));
};

// ==========================================================================
// --- PHẦN DÙNG CHUNG: HIỂN THỊ DANH SÁCH SUẤT CHIẾU (NGÀY / GIỜ / PHÒNG) ---
// Dùng cho cả Modal "Xem" ở tab Ma trận và phần thông tin trong Modal "Sửa Phim"
// ==========================================================================
function getMatrixRoomLabel(roomId) {
  if (roomId === 1) return "Screen 1 · Standard";
  if (roomId === 2) return "Screen 2 · IMAX";
  return `Phòng ${roomId}`;
}

function renderShowtimeListInto(containerId, movieId, date) {
  const container = document.getElementById(containerId);
  if (!container || !movieId || !date) return;

  container.innerHTML =
    '<div style="padding:10px;color:#888;font-size:12px;">Đang tải suất chiếu...</div>';

  API.getShowtimes(movieId, date)
    .then((resData) => {
      const list = resData.showtimes || [];

      if (list.length === 0) {
        container.innerHTML = `<div style="padding:10px;color:#888;font-size:12px;">Không có suất chiếu nào được xếp trong ngày ${date}.</div>`;
        return;
      }

      const rowsHTML = list
        .slice()
        .sort((a, b) => (a.startTime > b.startTime ? 1 : -1))
        .map(
          (st) => `
            <tr>
              <td>${date}</td>
              <td>${st.startTime} - ${st.endTime}</td>
              <td>${getMatrixRoomLabel(st.roomId)}</td>
            </tr>
          `,
        )
        .join("");

      container.innerHTML = `
        <div style="font-size:12px;color:#9a9aa3;margin-bottom:8px;">
          Tổng số suất chiếu trong ngày: <strong style="color:#f4f4f5;">${list.length}</strong>
        </div>
        <table class="mp-table" style="width:100%;font-size:12px;">
          <thead>
            <tr><th>Ngày</th><th>Giờ chiếu</th><th>Phòng</th></tr>
          </thead>
          <tbody>${rowsHTML}</tbody>
        </table>
      `;
    })
    .catch((err) => {
      container.innerHTML = `<div style="padding:10px;color:#e57373;font-size:12px;">Lỗi tải suất chiếu: ${err.message || err}</div>`;
    });
}

function getMatrixDefaultDate() {
  const dateInput = document.getElementById("mp-matrix-date-input");
  if (window.matrixSelectedDate) return window.matrixSelectedDate;
  if (dateInput && dateInput.value) return dateInput.value;
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// --- MODAL "XEM" RIÊNG CHO TAB MA TRẬN LỊCH CHIẾU ---
window.openMatrixViewMovie = function (id) {
  const movie = window.moviesList.find((item) => item.movieId === id);
  if (!movie) {
    console.error("Không tìm thấy dữ liệu của phim mang ID:", id);
    return;
  }

  document.getElementById("mxview-movie-id").value = id;
  document.getElementById("mxview-title").innerText = movie.title || "Chưa cập nhật";
  document.getElementById("mxview-genre").innerText = movie.genre || "Chưa cập nhật";
  document.getElementById("mxview-duration").innerText =
    movie.durationMinutes || movie.duration || "0";
  document.getElementById("mxview-director").innerText = movie.director || "Chưa cập nhật";
  document.getElementById("mxview-country").innerText = movie.country || "Chưa cập nhật";

  const statusEl = document.getElementById("mxview-status");
  const mxViewStatusMeta = mpStatusMeta(movie.status);
  statusEl.innerText = mxViewStatusMeta.text;
  statusEl.style.color = mxViewStatusMeta.color;

  const imgUrl =
    movie.mainposterUrl || movie.mainposter_url || "img/default-poster.jpg";
  document.getElementById("mxview-poster").src = imgUrl;

  const defaultDate = getMatrixDefaultDate();
  document.getElementById("mxview-date-input").value = defaultDate;
  renderShowtimeListInto("mxview-schedule-list", id, defaultDate);

  document.getElementById("mp-matrix-view-modal").style.display = "flex";
};

window.closeMatrixViewMovie = function () {
  document.getElementById("mp-matrix-view-modal").style.display = "none";
};

window.reloadMatrixViewSchedule = function () {
  const id = parseInt(document.getElementById("mxview-movie-id").value);
  const date = document.getElementById("mxview-date-input").value;
  renderShowtimeListInto("mxview-schedule-list", id, date);
};

// --- MODAL "SỬA" GỌN NHẸ RIÊNG CHO TAB MA TRẬN (chỉ Thời lượng + Trạng thái) ---
window.openMatrixEditMovie = function (id) {
  const movie = window.moviesList.find((item) => item.movieId === id);
  if (!movie) {
    console.error("Không tìm thấy dữ liệu của phim mang ID:", id);
    return;
  }

  document.getElementById("mxedit-movie-id").value = id;

  const imgUrl =
    movie.mainposterUrl || movie.mainposter_url || "img/default-poster.jpg";
  document.getElementById("mxedit-poster").src = imgUrl;
  document.getElementById("mxedit-title").innerText = movie.title || "Chưa cập nhật";
  document.getElementById("mxedit-meta").innerText =
    `${movie.genre || "Chưa cập nhật"} · Dir. ${movie.director || "Chưa cập nhật"}`;

  document.getElementById("mxedit-duration").value =
    movie.durationMinutes || movie.duration || "";

  const statusRadio = document.querySelector(
    `input[name="mxedit_status"][value="${movie.status}"]`,
  );
  if (statusRadio) statusRadio.checked = true;

  const defaultDate = getMatrixDefaultDate();
  document.getElementById("mxedit-date-input").value = defaultDate;
  renderShowtimeListInto("mxedit-schedule-list", id, defaultDate);

  document.getElementById("mp-matrix-edit-modal").style.display = "flex";
};

window.closeMatrixEditMovie = function () {
  document.getElementById("mp-matrix-edit-modal").style.display = "none";
};

window.reloadMatrixEditSchedule = function () {
  const id = parseInt(document.getElementById("mxedit-movie-id").value);
  const date = document.getElementById("mxedit-date-input").value;
  renderShowtimeListInto("mxedit-schedule-list", id, date);
};

window.submitMatrixEditMovie = function () {
  const id = parseInt(document.getElementById("mxedit-movie-id").value);
  const original = window.moviesList.find((item) => item.movieId === id);
  if (!original) return;

  const statusChecked = document.querySelector('input[name="mxedit_status"]:checked');

  // Giữ nguyên toàn bộ thông tin gốc của phim, chỉ ghi đè 2 trường được phép sửa ở đây
  const movieData = {
    ...original,
    duration: parseInt(document.getElementById("mxedit-duration").value) || original.duration,
    status: statusChecked ? statusChecked.value : original.status,
  };

  API.updateMovie(movieData)
    .then(() => {
      alert("Cập nhật thành công!");
      closeMatrixEditMovie();
      loadManagerMovies();
      if (typeof window.loadManagerMatrix === "function") window.loadManagerMatrix();
    })
    .catch((err) => alert("Lỗi khi cập nhật: " + err));
};

window.openUpdateMovie = function (id) {
  const movie = window.moviesList.find((item) => item.movieId === id);

  if (!movie) {
    console.error("Không tìm thấy dữ liệu cho phim ID:", id);
    return;
  }

  document.getElementById("upd-movie-id").value = movie.movieId;
  document.getElementById("upd-title").value = movie.title || "";
  document.getElementById("upd-genre").value = movie.genre || "";
  document.getElementById("upd-duration").value =
    movie.durationMinutes || movie.duration || "";
  document.getElementById("upd-release").value = movie.releaseDate || "";
  document.getElementById("upd-country").value = movie.country || "";
  document.getElementById("upd-director").value = movie.director || "";
  document.getElementById("upd-performer").value = movie.performer || "";
  document.getElementById("upd-synopsis").value = movie.synopsis || "";
  document.getElementById("upd-mainposter").value =
    movie.mainposterUrl || movie.mainposter_url || "";
  document.getElementById("upd-subposter").value =
    movie.subposterUrl || movie.subposter_url || "";
  document.getElementById("upd-age").value = movie.ageRating || "0";

  const statusRadio = document.querySelector(
    `input[name="upd_status"][value="${movie.status}"]`,
  );
  if (statusRadio) statusRadio.checked = true;

  document.getElementById("mp-update-movie-modal").style.display = "flex";
};

window.closeUpdateMovie = function () {
  document.getElementById("mp-update-movie-modal").style.display = "none";
};

window.submitUpdateMovie = function () {
  const movieData = {
    movieId: parseInt(document.getElementById("upd-movie-id").value),
    title: document.getElementById("upd-title").value,
    genre: document.getElementById("upd-genre").value,
    duration: parseInt(document.getElementById("upd-duration").value) || 0,
    director: document.getElementById("upd-director").value,
    country: document.getElementById("upd-country").value,
    performer: document.getElementById("upd-performer").value,
    synopsis: document.getElementById("upd-synopsis").value,
    mainposter_url: document.getElementById("upd-mainposter").value,
    subposter_url: document.getElementById("upd-subposter").value,
    releaseDate: document.getElementById("upd-release").value,
    ageRating: parseInt(document.getElementById("upd-age").value) || 0,
    status: document.querySelector('input[name="upd_status"]:checked').value,
  };

  API.updateMovie(movieData)
    .then(() => {
      alert("Cập nhật phim thành công!");
      closeUpdateMovie();
      loadManagerMovies();
    })
    .catch((err) => alert("Lỗi khi cập nhật phim: " + err));
};

// ==========================================================================
// --- LOGIC XỬ LÝ XÓA PHIM ĐỘNG ---
// ==========================================================================
window.openMpDeleteModal = function (id) {
  const movie = window.moviesList.find((item) => item.movieId === id);
  if (!movie) return;

  document.getElementById("delete-movie-id").value = movie.movieId;
  document.getElementById("delete-movie-title").innerText = `"${movie.title}"`;
  document.getElementById("mp-delete-modal").style.display = "flex";
};

window.closeMpDeleteModal = function () {
  document.getElementById("mp-delete-modal").style.display = "none";
};

window.submitDeleteMovie = function () {
  const movieId = parseInt(document.getElementById("delete-movie-id").value);

  API.deleteMovie(movieId)
    .then(() => {
      alert("Hệ thống đã gỡ phim thành công!");
      closeMpDeleteModal();
      loadManagerMovies();
    })
    .catch((err) => alert("Lỗi khi thực hiện xóa phim: " + err));
};

// ==========================================================================
// --- LOGIC XỬ LÝ XEM CHI TIẾT PHIM (CON MẮT 👁) ---
// ==========================================================================
window.openViewMovie = function (id) {
  const movie = window.moviesList.find((item) => item.movieId === id);
  if (!movie) {
    console.error("Không tìm thấy dữ liệu của phim mang ID:", id);
    return;
  }

  document.getElementById("view-title").innerText =
    movie.title || "Chưa cập nhật";
  document.getElementById("view-genre").innerText =
    movie.genre || "Chưa cập nhật";
  document.getElementById("view-duration").innerText =
    movie.durationMinutes || movie.duration || "0";
  document.getElementById("view-director").innerText =
    movie.director || "Chưa cập nhật";
  document.getElementById("view-country").innerText =
    movie.country || "Chưa cập nhật";
  document.getElementById("view-performer").innerText =
    movie.performer || "Chưa cập nhật";
  document.getElementById("view-release").innerText =
    movie.releaseDate || "Chưa cập nhật";
  document.getElementById("view-synopsis").innerText =
    movie.synopsis || "Bộ phim này hiện chưa có bài tóm tắt nội dung ngắn.";
  document.getElementById("view-age").innerText =
    movie.ageRating === 0 ? "P" : `T${movie.ageRating}`;

  const viewStatusMeta = mpStatusMeta(movie.status);
  document.getElementById("view-status").innerText = viewStatusMeta.text;
  document.getElementById("view-status").style.color = viewStatusMeta.color;

  const imgUrl =
    movie.mainposterUrl || movie.mainposter_url || "img/default-poster.jpg";
  document.getElementById("view-poster").src = imgUrl;

  document.getElementById("mp-view-movie-modal").style.display = "flex";
};

window.closeViewMovie = function () {
  document.getElementById("mp-view-movie-modal").style.display = "none";
};

// --- 6. TÍNH TOÁN THỜI GIAN THỰC ---
function displayCurrentDate() {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, "0");
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const year = today.getFullYear();

  const formattedDate = `${day}/${month}/${year}`;
  const dateBadge = document.getElementById("mp-current-date-text");
  if (dateBadge) {
    dateBadge.innerText = formattedDate;
  }
}

document.addEventListener("DOMContentLoaded", displayCurrentDate);

// ==========================================================================
// --- 7. BỘ CHỨC NĂNG QUẢN LÝ KHO F&B CHUYÊN NGHIỆP ---
// ==========================================================================

// Hàm tự động phân loại sản phẩm dựa theo từ khóa trong tên (dùng chung cho load + filter)
function getFnbTypeMeta(itemName) {
  const nameLower = (itemName || "").toLowerCase();
  if (nameLower.includes("combo")) return { key: "combo", text: "Combo", icon: "🎁" };
  if (nameLower.includes("nuoc") || nameLower.includes("coca")) return { key: "nuoc", text: "Nước ngọt", icon: "🥤" };
  if (nameLower.includes("khoai") || nameLower.includes("chien")) return { key: "anvat", text: "Đồ ăn vặt", icon: "🍟" };
  return { key: "bap", text: "Bắp rang", icon: "🍿" };
}

// Vẽ 1 dòng bảng F&B theo đúng format của bảng Quản lý Danh mục Phim
// (cột STT, ảnh/thumbnail, badge phân loại, badge trạng thái tồn kho, action icon-only)
function renderFnbRow(item, index) {
  const type = getFnbTypeMeta(item.itemName);
  const isLowStock = item.stockQuantity <= 30;
  const rowClass = isLowStock ? 'class="mp-row-lowstock"' : "";
  const stockStatusClass = isLowStock ? "lowstock" : "available";
  const stockStatusText = isLowStock ? "Tồn thấp" : "Còn hàng";

  return `
    <tr ${rowClass}>
        <td style="text-align: center; font-weight: bold;">${index + 1}</td>
        <td style="text-align: center;"><div class="mp-fnb-thumb">${type.icon}</div></td>
        <td><div class="mp-movie-title">${item.itemName}</div></td>
        <td><span class="mp-fnb-type ${type.key}">${type.text}</span></td>
        <td style="text-align: right; font-weight: bold; color: var(--text-light);">${item.price.toLocaleString("vi-VN")} đ</td>
        <td style="text-align: center;">
            <div style="font-weight: bold; color: var(--text-light); margin-bottom: 4px;">${item.stockQuantity}</div>
            <span class="mp-status ${stockStatusClass}">${stockStatusText}</span>
        </td>
        <td>
            <div class="mp-table-actions">
                <button class="mp-action-btn" onclick="openEditFnbModal(${item.foodItemId})" title="Sửa thông tin"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button>
                <button class="mp-action-btn" onclick="submitDeleteFnb(${item.foodItemId})" title="Xóa"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg></button>
            </div>
        </td>
    </tr>
  `;
}

// Hàm tải danh sách F&B thực tế từ database lên giao diện
window.loadManagerFnb = function() {
  const tbody = document.getElementById("mp-fnb-tbody");
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:15px;">Đang quét dữ liệu kho hàng...</td></tr>';

  API.getFnbItems()
    .then((items) => {
      tbody.innerHTML = "";
      window.fnbItemsList = items; // Lưu cache danh sách toàn cục để sửa

      if (!items || items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:#888; padding:15px;">Kho trống! Chưa có sản phẩm bắp nước nào.</td></tr>';
        return;
      }

      items.forEach((item, index) => {
        tbody.innerHTML += renderFnbRow(item, index);
      });
    })
    .catch((err) => {
      console.error(err);
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:red;">Lỗi kết nối API kho F&B: ${err.message}</td></tr>`;
    });
};

// Điều khiển mở đóng Modal Form điền dữ liệu
window.openAddFnbModal = function() {
  document.getElementById("fnb-item-id").value = "";
  document.getElementById("fnb-name").value = "";
  document.getElementById("fnb-price").value = "";
  document.getElementById("fnb-stock").value = "";
  document.getElementById("fnb-modal-title").innerText = "Thêm Sản Phẩm F&B Mới";
  document.getElementById("mp-fnb-modal").style.display = "flex";
};

window.openEditFnbModal = function(id) {
  const item = window.fnbItemsList.find(x => x.foodItemId === id);
  if (!item) return;

  document.getElementById("fnb-item-id").value = item.foodItemId;
  document.getElementById("fnb-name").value = item.itemName;
  document.getElementById("fnb-price").value = item.price;
  document.getElementById("fnb-stock").value = item.stockQuantity;
  document.getElementById("fnb-modal-title").innerText = "Cập Nhật Thông Tin Sản Phẩm";
  document.getElementById("mp-fnb-modal").style.display = "flex";
};

window.closeFnbModal = function() {
  document.getElementById("mp-fnb-modal").style.display = "none";
};

// Hàm xử lý chung gửi request Thêm hoặc Sửa lên Spring Boot
window.submitFnbForm = function() {
  const id = document.getElementById("fnb-item-id").value;
  const name = document.getElementById("fnb-name").value.trim();
  const price = parseFloat(document.getElementById("fnb-price").value) || 0;
  const stock = parseInt(document.getElementById("fnb-stock").value) || 0;

  if (!name) {
    alert("Vui lòng điền tên sản phẩm bắp nước!");
    return;
  }

  const fnbData = { itemName: name, price: price, stockQuantity: stock };

  if (id) {
    // Nếu có ID -> Gọi API cập nhật thông tin sản phẩm
    API.updateFnbItem(id, fnbData)
      .then(() => {
        alert("Đã cập nhật sản phẩm F&B thành công!");
        closeFnbModal();
        loadManagerFnb();
      })
      .catch(err => alert("Lỗi khi sửa bắp nước: " + err.message));
  } else {
    // Nếu ID trống -> Gọi API thêm sản phẩm mới vào DB
    API.addFnbItem(fnbData)
      .then(() => {
        alert("Đã thêm sản phẩm mới vào kho thành công!");
        closeFnbModal();
        loadManagerFnb();
      })
      .catch(err => alert("Lỗi khi thêm bắp nước: " + err.message));
  }
};

// --- XÁC NHẬN XÓA SẢN PHẨM F&B BẰNG MODAL RIÊNG (thay cho confirm() mặc định) ---
window.submitDeleteFnb = function(id) {
  const item = (window.fnbItemsList || []).find((x) => x.foodItemId === id);
  window._pendingDeleteFnbId = id;

  const nameBox = document.getElementById("fnb-delete-item-name");
  if (nameBox) {
    nameBox.innerText = item
      ? `Bạn có chắc chắn muốn gỡ "${item.itemName}" ra khỏi kho hệ thống không?`
      : "Bạn có chắc chắn muốn gỡ sản phẩm này ra khỏi kho hệ thống không?";
  }

  document.getElementById("mp-fnb-delete-modal").style.display = "flex";
};

window.closeFnbDeleteModal = function() {
  document.getElementById("mp-fnb-delete-modal").style.display = "none";
  window._pendingDeleteFnbId = null;
};

window.confirmDeleteFnb = function() {
  const id = window._pendingDeleteFnbId;
  if (!id) return;

  API.deleteFnbItem(id)
    .then(() => {
      alert("Đã xóa sản phẩm khỏi kho thành công!");
      closeFnbDeleteModal();
      loadManagerFnb();
    })
    .catch(() => {
      alert("Thất bại! Sản phẩm này đang dính vào lịch sử hóa đơn đặt vé cũ nên không thể xóa vật lý.");
      closeFnbDeleteModal();
    });
};

// ==========================================================================
// 🚀 BỘ CHỨC NĂNG TÌM KIẾM & LỌC F&B ĐỘNG CHO MANAGER
// ==========================================================================
function filterManagerFnb() {
  const searchInput = document.getElementById("mp-fnb-search-input");
  const typeSelect = document.getElementById("mp-fnb-filter-type");
  const stockSelect = document.getElementById("mp-fnb-filter-stock");

  const keyword = searchInput ? searchInput.value.toLowerCase().trim() : "";
  const typeFilter = typeSelect ? typeSelect.value : "all";
  const stockFilter = stockSelect ? stockSelect.value : "all";

  // Bảo vệ hệ thống: Nếu mảng cache tổng từ database chưa kịp nạp thì dừng lại
  if (!window.fnbItemsList) return;

  const filteredResult = window.fnbItemsList.filter((item) => {
    // 1. Tìm kiếm theo tên sản phẩm thật bốc từ Database (itemName)
    const matchesKeyword = item.itemName ? item.itemName.toLowerCase().includes(keyword) : false;
    
    // 2. Tự động nhận diện Phân loại dựa theo từ khóa chuỗi tên tương tự hàm load gốc
    const currentType = getFnbTypeMeta(item.itemName).key;

    const matchesType = typeFilter === "all" || currentType === typeFilter;

    // 3. Lọc theo trạng thái số lượng tồn kho (stockQuantity)
    let matchesStock = true;
    if (stockFilter === "low") {
      matchesStock = item.stockQuantity <= 30;
    } else if (stockFilter === "available") {
      matchesStock = item.stockQuantity > 30;
    }

    return matchesKeyword && matchesType && matchesStock;
  });

  // Vẽ lại bảng F&B dựa trên danh sách đã được lọc sạch
  renderFilteredFnbTable(filteredResult);
}
// Phơi hàm ra phạm vi toàn cục window để các thẻ select/input HTML kích hoạt được
window.filterManagerFnb = filterManagerFnb;

// Hàm tái render bảng dữ liệu sau khi lọc (giữ đồng bộ format với renderFnbRow dùng chung)
function renderFilteredFnbTable(items) {
  const tbody = document.getElementById("mp-fnb-tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (!items || items.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:#888; padding:15px;">Không tìm thấy sản phẩm bắp nước nào khớp với bộ lọc!</td></tr>';
    return;
  }

  items.forEach((item, index) => {
    tbody.innerHTML += renderFnbRow(item, index);
  });
}

// ==========================================================================
// 🚀 LOGIC XỬ LÝ NHẬP HÀNG & TÁI CUNG ỨNG CHO KHO F&B
// ==========================================================================

// --- CHỨC NĂNG 1: TÁI CUNG ỨNG TỰ ĐỘNG (AUTO-REPLENISH) ---
window.handleAutoReplenish = function() {
  if (!window.fnbItemsList || window.fnbItemsList.length === 0) {
    alert("Không có dữ liệu sản phẩm để tái cung ứng!");
    return;
  }

  // Lọc ra các sản phẩm có tồn kho thấp (<= 30)
  const lowStockItems = window.fnbItemsList.filter(item => item.stockQuantity <= 30);

  if (lowStockItems.length === 0) {
    alert("Tất cả sản phẩm trong kho đều đang ở mức an toàn (>30 ly). Không cần tái cung ứng!");
    return;
  }

  if (confirm(`Hệ thống tìm thấy ${lowStockItems.length} sản phẩm đang sắp hết hàng (tồn thấp).\nBạn có muốn tự động bù hàng lên mức an toàn (100 ly) không?`)) {
    
    // Tạo danh sách các Promise để cập nhật đồng thời lên Server Spring Boot
    const updatePromises = lowStockItems.map(item => {
      const updatedData = {
        itemName: item.itemName,
        price: item.price,
        stockQuantity: 100 // Tự động đưa lên mức an toàn 100 đơn vị
      };
      return API.updateFnbItem(item.foodItemId, updatedData);
    });

    // Chờ tất cả API cập nhật xong xuôi
    Promise.all(updatePromises)
      .then(() => {
        alert("Chiến dịch tái cung ứng hoàn tất! Toàn bộ sản phẩm tồn thấp đã được đưa về mức an toàn.");
        loadManagerFnb(); // Tải lại bảng để cập nhật số lượng mới
      })
      .catch(err => {
        console.error("Lỗi tái cung ứng:", err);
        alert("Có lỗi xảy ra trong quá trình cập nhật kho hàng: " + err.message);
      });
  }
};

// --- CHỨC NĂNG 2: NHẬP HÀNG NHANH (QUICK RESTOCK) ---
// 🚀 ĐÃ SỬA: Thay thế hoàn toàn prompt()/confirm() mặc định xấu xí của trình duyệt
// bằng modal riêng #mp-restock-modal, đồng bộ giao diện với modal Thêm/Sửa F&B.
window.openQuickRestockModal = function() {
  if (!window.fnbItemsList || window.fnbItemsList.length === 0) {
    alert("Kho hàng trống, vui lòng thêm sản phẩm mới trước!");
    return;
  }

  const select = document.getElementById("restock-product-select");
  select.innerHTML = window.fnbItemsList
    .map((item) => `<option value="${item.foodItemId}">${item.itemName} (Tồn: ${item.stockQuantity})</option>`)
    .join("");

  document.getElementById("restock-add-qty").value = "";
  onRestockProductChange();
  document.getElementById("mp-restock-modal").style.display = "flex";
};

// Cập nhật số tồn kho hiện tại hiển thị khi đổi sản phẩm trong dropdown
window.onRestockProductChange = function() {
  const select = document.getElementById("restock-product-select");
  const item = window.fnbItemsList.find((x) => String(x.foodItemId) === String(select.value));
  document.getElementById("restock-current-stock").innerText = item ? `${item.stockQuantity} ly` : "0";
};

window.closeRestockModal = function() {
  document.getElementById("mp-restock-modal").style.display = "none";
};

// Xử lý xác nhận nhập hàng: cộng dồn số lượng mới vào tồn kho hiện tại rồi gửi API
window.submitRestockForm = function() {
  const select = document.getElementById("restock-product-select");
  const item = window.fnbItemsList.find((x) => String(x.foodItemId) === String(select.value));
  if (!item) {
    alert("Vui lòng chọn sản phẩm cần nhập hàng!");
    return;
  }

  const addQty = parseInt(document.getElementById("restock-add-qty").value) || 0;
  if (addQty <= 0) {
    alert("Số lượng nhập kho phải lớn hơn 0!");
    return;
  }

  const fnbData = {
    itemName: item.itemName,
    price: item.price,
    stockQuantity: item.stockQuantity + addQty, // Cộng dồn số lượng mới vào số lượng cũ
  };

  API.updateFnbItem(item.foodItemId, fnbData)
    .then(() => {
      alert(`Nhập hàng thành công! Đã cộng thêm ${addQty} đơn vị vào sản phẩm ${item.itemName}.`);
      closeRestockModal();
      loadManagerFnb();
    })
    .catch((err) => alert("Lỗi khi nhập hàng: " + err.message));
};

// ==========================================================================
// 🚀 ENGINE XỬ LÝ MA TRẬN LỊCH CHIẾU ĐỘNG & CHECK CONFLICT TỰ ĐỘNG
// ==========================================================================

// Vẽ bảng "Danh Sách Phim" tham khảo bên dưới Ma trận Lịch chiếu
// (Movie | Genre | Duration | Status | Release Date | Actions)
function renderMatrixMovieList(movies) {
  const tbody = document.getElementById("mp-matrix-movies-tbody");
  if (!tbody) return;

  if (!movies || movies.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 20px; color: #888;">Chưa có dữ liệu phim.</td></tr>`;
    return;
  }

  tbody.innerHTML = "";
  movies.forEach((m) => {
    const posterUrl = m.mainposter_url ? m.mainposter_url : "img/default-poster.jpg";
    const statusClass = m.status === "now_showing" ? "active" : m.status === "coming_soon" ? "coming" : "inactive";
    const statusText = m.status === "now_showing" ? "Now Showing" : m.status === "coming_soon" ? "Coming Soon" : "Ngừng chiếu";
    const genres = (m.genre || "Chưa cập nhật")
      .split(/[,/|]/)
      .map((g) => g.trim())
      .filter(Boolean);

    tbody.innerHTML += `
      <tr>
        <td>
          <div class="mp-movie-info">
            <img src="${posterUrl}" class="mp-movie-poster" alt="${m.title}">
            <div>
              <div class="mp-movie-title">${m.title}</div>
              <div style="font-size:11px;color:var(--muted,#9a9aa3);">Dir. ${m.director || "Chưa cập nhật"}</div>
            </div>
          </div>
        </td>
        <td>
          <div class="mp-genre-pill-group">
            ${genres.map((g) => `<span class="mp-genre-pill">${g}</span>`).join("")}
          </div>
        </td>
        <td><span class="mp-duration-chip">⏱ ${m.duration} min</span></td>
        <td><span class="mp-status ${statusClass}">${statusText}</span></td>
        <td>${m.releaseDate || "N/A"}</td>
        <td>
          <div class="mp-table-actions">
            <button class="mp-action-btn" onclick="openMatrixViewMovie(${m.movieId})" title="Xem chi tiết suất chiếu">👁️</button>
            <button class="mp-action-btn" onclick="openMatrixEditMovie(${m.movieId})" title="Sửa">✏️</button>
          </div>
        </td>
      </tr>
    `;
  });
}
window.renderMatrixMovieList = renderMatrixMovieList;

// Vẽ bảng "Danh Sách Phim" tham khảo bên dưới Ma trận Lịch chiếu
// (Movie | Genre | Duration | Status | Release Date | Actions)
function renderMatrixMovieList(movies) {
  const tbody = document.getElementById("mp-matrix-movies-tbody");
  if (!tbody) return;

  if (!movies || movies.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 20px; color: #888;">Chưa có dữ liệu phim.</td></tr>`;
    return;
  }

  tbody.innerHTML = "";
  movies.forEach((m) => {
    const posterUrl = m.mainposter_url ? m.mainposter_url : "img/default-poster.jpg";
    const matrixStatusMeta = mpStatusMeta(m.status);
    const statusClass = matrixStatusMeta.class;
    const statusText = matrixStatusMeta.text;
    const genres = (m.genre || "Chưa cập nhật")
      .split(/[,/|]/)
      .map((g) => g.trim())
      .filter(Boolean);

    tbody.innerHTML += `
      <tr>
        <td>
          <div class="mp-movie-info">
            <img src="${posterUrl}" class="mp-movie-poster" alt="${m.title}">
            <div>
              <div class="mp-movie-title">${m.title}</div>
              <div style="font-size:11px;color:var(--muted,#9a9aa3);">Dir. ${m.director || "Chưa cập nhật"}</div>
            </div>
          </div>
        </td>
        <td>
          <div class="mp-genre-pill-group">
            ${genres.map((g) => `<span class="mp-genre-pill">${g}</span>`).join("")}
          </div>
        </td>
        <td><span class="mp-duration-chip">⏱ ${m.duration} min</span></td>
        <td><span class="mp-status ${statusClass}">${statusText}</span></td>
        <td>${m.releaseDate || "N/A"}</td>
        <td>
          <div class="mp-table-actions">
            <button class="mp-action-btn" onclick="openMatrixViewMovie(${m.movieId})" title="Xem chi tiết suất chiếu"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z"/><circle cx="12" cy="12" r="3"/></svg></button>
            <button class="mp-action-btn" onclick="openMatrixEditMovie(${m.movieId})" title="Sửa"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button>
          </div>
        </td>
      </tr>
    `;
  });
}
window.renderMatrixMovieList = renderMatrixMovieList;

// ==========================================================================
// 📅 LỊCH CHIẾU KIỂU GOOGLE CALENDAR (Ngày / Tuần / Tháng) — màu theo phim
//    Giữ conflict detector (cùng phòng + trùng giờ) và bảng phim tham khảo.
// ==========================================================================
window.mpCalView = window.mpCalView || "week";
window.mpCalCursor = window.mpCalCursor || new Date();
const MPCAL_HOUR_H = 48;
const MPCAL_PALETTE = ["#4f7cff","#e0457b","#8b5cf6","#ef8a3c","#22b8a6","#eab308","#f43f5e","#38bdf8","#a855f7","#10b981","#f59e0b","#ec4899"];
function mpCalColor(t){ t=t||""; let h=0; for(let i=0;i<t.length;i++) h=(h*31+t.charCodeAt(i))>>>0; return MPCAL_PALETTE[h % MPCAL_PALETTE.length]; }
function mpCalYMD(d){ const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,"0"),dd=String(d.getDate()).padStart(2,"0"); return `${y}-${m}-${dd}`; }
function mpCalToMin(t){ const[a,b]=(t||"0:0").split(":").map(Number); return a*60+(b||0); }
function mpCalFmtH(t){ let[h,m]=(t||"0:0").split(":").map(Number); const ap=h<12?"am":"pm"; let hh=h%12; if(hh===0)hh=12; return `${hh}:${String(m||0).padStart(2,"0")}${ap}`; }
function mpCalSameDay(a,b){ return a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate(); }
function mpCalStartOfWeek(d){ const x=new Date(d); x.setDate(x.getDate()-x.getDay()); x.setHours(0,0,0,0); return x; }
const MPCAL_DOW = ["CN","T2","T3","T4","T5","T6","T7"];

// ==========================================================================
// 🎦 DANH SÁCH PHÒNG CHIẾU — CẤU HÌNH ĐỘNG (chưa có data mẫu cố định nên
//    KHÔNG hardcode cứng số phòng như trước. Đây chỉ là danh sách khởi điểm,
//    phòng nào xuất hiện trong dữ liệu suất chiếu thực tế mà chưa có trong
//    danh sách này sẽ tự động được thêm vào (xem mpEnsureRoomKnown).
// ==========================================================================
window.MP_ROOMS = window.MP_ROOMS || [
  { id: 1, label: "Phòng 1 · 3D Standard" },
  { id: 2, label: "Phòng 2 · IMAX" },
  { id: 3, label: "Phòng 3 · Standard" },
];
function mpEnsureRoomKnown(roomId){
  if (roomId === undefined || roomId === null) return;
  if (!window.MP_ROOMS.some(r => r.id === roomId)) {
    window.MP_ROOMS.push({ id: roomId, label: `Phòng ${roomId}` });
  }
}
function mpCalRoomLabel(r){ const room = window.MP_ROOMS.find(x=>x.id===r); return room ? room.label : `Phòng ${r}`; }
function mpCalRoomShort(r){ return `P${r}`; }

// ==========================================================================
// 🛠️ LỚP "OVERRIDE" TẠM Ở FRONT-END CHO SỬA/XÓA SUẤT CHIẾU
// ------------------------------------------------------------------------
// Backend hiện CHƯA có API updateShowtime / deleteShowtime (api.js chỉ có
// addShowtime). Để manager vẫn thao tác sửa/xóa được ngay trên ma trận
// trong lúc chờ backend bổ sung API thật, mọi thay đổi (đổi giờ/phòng/giá,
// hoặc xóa) được lưu tạm vào localStorage của trình duyệt và merge đè lên
// dữ liệu lấy từ server mỗi lần render. Đây LÀ GIẢI PHÁP TẠM — khi backend
// có PUT /showtimes/update/{id} và DELETE /showtimes/delete/{id}, chỉ cần
// thay phần TODO trong mpCommitShowtimeOverride() bằng lời gọi API thật rồi
// bỏ lớp localStorage này đi mà không ảnh hưởng phần UI/UX phía trên.
// ==========================================================================
const MP_OVERRIDE_KEY = "mp_showtime_overrides_v1";
function mpLoadOverrides(){
  try { return JSON.parse(localStorage.getItem(MP_OVERRIDE_KEY)) || {}; }
  catch(e){ return {}; }
}
function mpSaveOverrides(map){
  try { localStorage.setItem(MP_OVERRIDE_KEY, JSON.stringify(map)); }
  catch(e){ console.warn("Không thể lưu override suất chiếu vào localStorage:", e); }
}
function mpSetShowtimeOverride(showtimeId, patch){
  const map = mpLoadOverrides();
  map[showtimeId] = { ...(map[showtimeId]||{}), ...patch };
  mpSaveOverrides(map);
}
function mpDeleteShowtimeLocal(showtimeId){
  mpSetShowtimeOverride(showtimeId, { deleted: true });
}
function mpClearShowtimeOverride(showtimeId){
  const map = mpLoadOverrides();
  delete map[showtimeId];
  mpSaveOverrides(map);
}
// Áp override (nếu có) lên 1 suất chiếu lấy từ server; trả về null nếu suất
// chiếu đó đã bị xóa tạm ở FE (để loại khỏi danh sách hiển thị).
function mpApplyOverride(st){
  const map = mpLoadOverrides();
  const ov = map[st.showtimeId];
  if (!ov) return st;
  if (ov.deleted) return null;
  return { ...st, ...ov, isLocallyEdited: true };
}

// ==========================================================================
// 🟢 ĐÃ SỬA: Hàm nạp dữ liệu gốc - Lấy từ DB, gỡ bỏ hoàn toàn localStorage
// ==========================================================================
function mpCalFetchDate(dateStr) {
  return Promise.all((window.moviesList || []).map(movie =>
    API.getShowtimes(movie.movieId, dateStr)
      .then(res => (res.showtimes || []).map(st => ({
        ...st,
        movieId: movie.movieId,
        movieTitle: movie.title,
        movieStatus: movie.status,
        // 🌟 Đồng bộ trường status chữ hoa từ SQL Server nhả về qua Controller
        status: st.status ? st.status.toUpperCase() : "ACTIVE" 
      })))
      .catch(() => [])
  )).then(arr => {
    // 🌟 CHỐT CHẶN: Lấy danh sách gốc từ DB trả về thẳng, KHÔNG gọi mpApplyOverride nữa
    const list = arr.flat().filter(Boolean); 
    
    // Thuật toán quét và tự động cảnh báo xung đột (Conflict) giữ nguyên
    list.forEach(cur => {
      mpEnsureRoomKnown(cur.roomId);
      cur.isConflict = false;
      const cs = mpCalToMin(cur.startTime), ce = mpCalToMin(cur.endTime);
      list.forEach(o => {
        if (cur.showtimeId !== o.showtimeId && cur.roomId === o.roomId) {
          const os = mpCalToMin(o.startTime), oe = mpCalToMin(o.endTime);
          if (cs < oe && ce > os) cur.isConflict = true;
        }
      });
    });
    return list;
  });
}

function mpCalEventHTML(st, col, cols){
  const c = mpCalColor(st.movieTitle);
  const top = mpCalToMin(st.startTime)/60*MPCAL_HOUR_H;
  const h = Math.max(20, (mpCalToMin(st.endTime)-mpCalToMin(st.startTime))/60*MPCAL_HOUR_H - 3);
  const cf = st.isConflict ? " mpcal-evt-conflict" : "";
  
  // Suất chiếu mờ đi nếu Phim bị ẩn HOẶC bản thân Suất chiếu đó mang trạng thái HIDDEN
  const hiddenCls = (st.movieStatus === "hidden" || st.status === "HIDDEN") ? " mpcal-evt-hidden" : "";
  const badge = st.isConflict ? '<span class="mpcal-evt-warn" title="Xung đột lịch chiếu!">!</span>' : '';
  
  // 🌟 ĐÃ XÓA: Bỏ biến editedBadge (icon dấu bút chì chỉnh sửa tạm ở local cũ) để giao diện đồng bộ chuẩn DB 100%
  
  const n = cols || 1;
  const w = 100 / n;
  const left = (col || 0) * w;
  const compact = n > 1 ? " mpcal-evt-compact" : "";
  
  return `<div class="mpcal-evt${cf}${hiddenCls}${compact}" data-showtime-id="${st.showtimeId}" style="top:${top}px;height:${h}px;left:calc(${left}% + 2px);width:calc(${w}% - 4px);background:${c}22;border-left-color:${c};"
      title="${st.movieTitle} (${st.startTime} - ${st.endTime}) · ${mpCalRoomLabel(st.roomId)}"
      onmousedown="mpEvtMouseDown(event, ${st.showtimeId})">
      ${badge}
      <div class="mpcal-evt-t">${st.movieTitle}</div>
      <div class="mpcal-evt-h">${mpCalFmtH(st.startTime)} – ${mpCalFmtH(st.endTime)} · <b class="mpcal-evt-room-tag">${mpCalRoomShort(st.roomId)}</b></div>
      <div class="mpcal-evt-r">${mpCalRoomLabel(st.roomId)}</div>
      <div class="mpcal-evt-resize" onmousedown="mpEvtResizeMouseDown(event, ${st.showtimeId})"></div>
    </div>`;
}

// Xếp các suất CHỒNG GIỜ nằm cạnh nhau (chia cột con như Google Calendar)
function mpCalLayout(list){
  const evs = (list||[]).map(st => ({ st, s:mpCalToMin(st.startTime), e:mpCalToMin(st.endTime), col:0, cols:1 }));
  evs.sort((a,b)=> a.s-b.s || a.e-b.e);
  let cluster=[], clusterEnd=-1;
  const flush=()=>{
    if(!cluster.length) return;
    const colsArr=[];
    cluster.forEach(ev=>{
      let placed=false;
      for(let i=0;i<colsArr.length;i++){ if(colsArr[i][colsArr[i].length-1].e <= ev.s){ colsArr[i].push(ev); ev.col=i; placed=true; break; } }
      if(!placed){ ev.col=colsArr.length; colsArr.push([ev]); }
    });
    cluster.forEach(ev=> ev.cols=colsArr.length); cluster = []; clusterEnd=-1;
  };
  evs.forEach(ev=>{
    if(cluster.length && ev.s>=clusterEnd) flush();
    cluster.push(ev); clusterEnd=Math.max(clusterEnd, ev.e);
  });
  flush();
  return evs;
}

function mpCalRenderTimeGrid(days, byDate){
  const today=new Date();
  const gc=`56px repeat(${days.length},1fr)`;
  let head=`<div class="mpcal-head" style="grid-template-columns:${gc}"><div></div>`;
  days.forEach(d=>{ const t=mpCalSameDay(d,today)?"today":""; head+=`<div class="mpcal-dayhead ${t}"><div class="dow">${MPCAL_DOW[d.getDay()]}</div><div class="dnum">${d.getDate()}</div></div>`; });
  head+=`</div>`;
  let cols=`<div class="mpcal-cols" style="grid-template-columns:${gc}"><div class="mpcal-timecol">`;
  for(let h=0;h<24;h++){ const lbl=h===0?"":(h<12?`${h} AM`:(h===12?"12 PM":`${h-12} PM`)); cols+=`<div class="mpcal-hour"><span class="mpcal-tlabel">${lbl}</span></div>`; }
  cols+=`</div>`;
  days.forEach(d=>{ const dstr=mpCalYMD(d); cols+=`<div class="mpcal-daycol" data-date="${dstr}" onclick="mpDayColClick(event, '${dstr}')">`; for(let h=0;h<24;h++) cols+=`<div class="mpcal-hour"></div>`; mpCalLayout(byDate[dstr]||[]).forEach(o=> cols+=mpCalEventHTML(o.st, o.col, o.cols)); cols+=`</div>`; });
  cols+=`</div>`;
  return `<div class="mpcal-grid">${head}<div class="mpcal-body">${cols}</div></div>`;
}

function mpCalRenderMonth(byDate){
  const today=new Date();
  const first=new Date(window.mpCalCursor.getFullYear(), window.mpCalCursor.getMonth(), 1);
  const start=mpCalStartOfWeek(first);
  let html=`<div class="mpcal-month"><div class="mpcal-mdow">`+MPCAL_DOW.map(x=>`<span>${x}</span>`).join("")+`</div><div class="mpcal-mgrid">`;
  for(let i=0;i<42;i++){
    const d=new Date(start); d.setDate(start.getDate()+i);
    const other=d.getMonth()!==window.mpCalCursor.getMonth()?"other":"";
    const t=mpCalSameDay(d,today)?"today":"";
    const evs=(byDate[mpCalYMD(d)]||[]).slice().sort((a,b)=>mpCalToMin(a.startTime)-mpCalToMin(b.startTime));
    let chips=evs.slice(0,3).map(st=>{ const c=mpCalColor(st.movieTitle); const cf=st.isConflict?" mpcal-chip-conflict":""; const hd=st.movieStatus==="hidden"?" mpcal-chip-hidden":""; return `<div class="mpcal-chip${cf}${hd}" style="background:${c}22;border-left-color:${c};" title="${st.movieTitle} ${st.startTime} · ${mpCalRoomLabel(st.roomId)}" onclick="mpOpenShowtimePopover(${st.showtimeId}, this)">${st.startTime} ${st.movieTitle} · ${mpCalRoomShort(st.roomId)}</div>`; }).join("");
    if(evs.length>3) chips+=`<div class="mpcal-more">+${evs.length-3} suất nữa</div>`;
    html+=`<div class="mpcal-cell ${other} ${t}"><div class="dn">${d.getDate()}</div>${chips}</div>`;
  }
  html+=`</div></div>`;
  return html;
}

function mpCalFmtTitle(){
  const c=window.mpCalCursor, mm=c.getMonth()+1, yy=c.getFullYear();
  if(window.mpCalView==="day") return `Ngày ${c.getDate()}/${mm}/${yy}`;
  if(window.mpCalView==="week"){ const s=mpCalStartOfWeek(c); const e=new Date(s); e.setDate(s.getDate()+6); return `${s.getDate()}/${s.getMonth()+1} – ${e.getDate()}/${e.getMonth()+1}, ${yy}`; }
  return `Tháng ${mm}, ${yy}`;
}

// ==========================================================================
// 🔎 BỘ LỌC MA TRẬN: Trạng thái phim / Phòng chiếu / Phim (multi-select)
// ------------------------------------------------------------------------
// window.mpCalRawByDate lưu dữ liệu THÔ (chưa lọc) theo từng ngày đang xem,
// để khi người dùng đổi filter thì chỉ cần lọc + vẽ lại (không gọi lại API).
// Conflict (isConflict) luôn được tính trên toàn bộ dữ liệu thô, KHÔNG bị
// ảnh hưởng bởi filter — vì filter chỉ là hiển thị, xung đột thật vẫn phải
// cảnh báo dù đang lọc ẩn bớt phòng/phim khác.
// ==========================================================================
window.mpFilterState = window.mpFilterState || { status: new Set(), room: new Set(), movie: new Set() };
window.mpCalRawByDate = window.mpCalRawByDate || {};
window.mpCalDays = window.mpCalDays || [];
window.mpMsfOpenKey = null;

// ==========================================================================
// 🟢 ĐÃ SỬA: Hàm quyết định vẽ hay ẩn - Đồng bộ giá trị bộ lọc tĩnh & DB thật
// ==========================================================================
function mpCalApplyFilters(list){
  const f = window.mpFilterState;
  return (list||[]).filter(st => {
    // 🌟 1. XỬ LÝ CHO BỘ LỌC TRẠNG THÁI (Đa lựa chọn)
    if (f.status.size) {
      // Ép toàn bộ trạng thái phim và suất chiếu về chữ thường để đồng bộ với giao diện
      const movieStat = String(st.movieStatus || "").toLowerCase();  // now_showing, coming_soon, hidden
      const showtimeStat = String(st.status || "").toLowerCase();   // active, inactive, hidden
      
      // 🟢 Mấu chốt: Map chữ "active" của suất chiếu thành "now_showing" để ăn khớp với checkbox "Đang chiếu" trên UI nhóm em
      const mappedShowtimeStat = showtimeStat === "active" ? "now_showing" : showtimeStat;

      // Nếu trạng thái của bộ phim KHÔNG khớp VÀ trạng thái của suất chiếu KHÔNG khớp bộ lọc -> Ẩn khối lịch
      if (!f.status.has(movieStat) && !f.status.has(mappedShowtimeStat)) return false;
    }
    
    // 🌟 2. LỌC THEO PHÒNG CHIẾU (Giữ nguyên logic id số của em)
    if (f.room.size && !f.room.has(st.roomId)) return false;
    
    // 🌟 3. LỌC THEO TÊN BỘ PHIM (Giữ nguyên logic id số của em)
    if (f.movie.size && !f.movie.has(st.movieId)) return false;
    
    return true;
  });
}

function mpCalRenderCurrent(){
  const area=document.getElementById("mp-cal-area");
  if(!area) return;
  const days = window.mpCalDays;
  const byDate = {};
  days.forEach(d=>{ const k=mpCalYMD(d); byDate[k] = mpCalApplyFilters(window.mpCalRawByDate[k]||[]); });

  if(window.mpCalView==="month") area.innerHTML=mpCalRenderMonth(byDate);
  else { area.innerHTML=mpCalRenderTimeGrid(days,byDate); const body=area.querySelector(".mpcal-body"); if(body) body.scrollTop=7*MPCAL_HOUR_H; }

  const allRaw = days.map(d=>window.mpCalRawByDate[mpCalYMD(d)]||[]).flat();
  let filteredMovies = window.moviesList||[];
  if (window.mpFilterState.status.size) filteredMovies = filteredMovies.filter(m=>window.mpFilterState.status.has(m.status));
  if (window.mpFilterState.movie.size) filteredMovies = filteredMovies.filter(m=>window.mpFilterState.movie.has(m.movieId));
  if(typeof renderMatrixMovieList==="function") renderMatrixMovieList(filteredMovies);

  mpMsfBuildPanels();
}

window.loadManagerMatrix = function(){
  const area=document.getElementById("mp-cal-area");
  if(!area) return;
  const dateInput=document.getElementById("mp-matrix-date-input");
  if(dateInput){
    if(!dateInput.value){ dateInput.value=mpCalYMD(window.mpCalCursor); }
    else { const p=dateInput.value.split("-").map(Number); window.mpCalCursor=new Date(p[0],p[1]-1,p[2]); }
  }
  const titleEl=document.getElementById("mpcal-title"); if(titleEl) titleEl.innerText=mpCalFmtTitle();
  document.querySelectorAll("#mpcal-views button").forEach(b=> b.classList.toggle("active", b.dataset.v===window.mpCalView));

  if(!window.moviesList || window.moviesList.length===0){
    area.innerHTML='<p style="color:#777;padding:15px;">Đang tải phim...</p>';
    API.getMovies().then(m=>{ window.moviesList=m; window.loadManagerMatrix(); }).catch(e=>{ area.innerHTML=`<span style="color:red;padding:10px;">Lỗi tải phim: ${e.message}</span>`; });
    return;
  }

  let days=[];
  if(window.mpCalView==="day") days=[new Date(window.mpCalCursor)];
  else if(window.mpCalView==="week"){ const s=mpCalStartOfWeek(window.mpCalCursor); for(let i=0;i<7;i++){ const d=new Date(s); d.setDate(s.getDate()+i); days.push(d);} }
  else { const first=new Date(window.mpCalCursor.getFullYear(),window.mpCalCursor.getMonth(),1); const s=mpCalStartOfWeek(first); for(let i=0;i<42;i++){ const d=new Date(s); d.setDate(s.getDate()+i); days.push(d);} }
  window.mpCalDays = days;

  area.innerHTML='<p style="color:#777;padding:15px;">Đang quét lịch chiếu...</p>';
  Promise.all(days.map(d=> mpCalFetchDate(mpCalYMD(d)).then(list=>[mpCalYMD(d),list])))
    .then(pairs=>{
      pairs.forEach(([k,v])=> window.mpCalRawByDate[k]=v);
      mpCalRenderCurrent();
    })
    .catch(err=>{ area.innerHTML=`<span style="color:red;padding:10px;display:block;">Lỗi đồng bộ lịch: ${err.message}</span>`; });
};

window.mpCalSetView=function(v){ window.mpCalView=v; window.loadManagerMatrix(); };
window.mpCalToday=function(){ window.mpCalCursor=new Date(); const di=document.getElementById("mp-matrix-date-input"); if(di) di.value=mpCalYMD(window.mpCalCursor); window.loadManagerMatrix(); };
window.mpCalNav=function(dir){
  const c=window.mpCalCursor;
  if(window.mpCalView==="month") c.setMonth(c.getMonth()+dir);
  else if(window.mpCalView==="week") c.setDate(c.getDate()+7*dir);
  else c.setDate(c.getDate()+dir);
  const di=document.getElementById("mp-matrix-date-input"); if(di) di.value=mpCalYMD(c);
  window.loadManagerMatrix();
};

// --- Xây nội dung 3 panel multi-select dựa trên dữ liệu thô đang có ---
function mpMsfBuildPanels(){
  // Trạng thái phim
  const statusPanel = document.getElementById("mp-msf-panel-status");
  if (statusPanel) {
    statusPanel.innerHTML = Object.entries(MP_MOVIE_STATUS).map(([key, meta]) => `
      <label class="mp-msf-opt">
        <input type="checkbox" ${window.mpFilterState.status.has(key)?"checked":""} onchange="mpMsfToggle('status', '${key}', this.checked)" />
        <span class="dot" style="background:${meta.color}"></span> ${meta.text}
      </label>
    `).join("");
  }
  // Phòng chiếu — lấy từ MP_ROOMS (đã tự mở rộng theo dữ liệu thực tế)
  const roomPanel = document.getElementById("mp-msf-panel-room");
  if (roomPanel) {
    const rooms = window.MP_ROOMS.slice().sort((a,b)=>a.id-b.id);
    roomPanel.innerHTML = rooms.length ? rooms.map(r => `
      <label class="mp-msf-opt">
        <input type="checkbox" ${window.mpFilterState.room.has(r.id)?"checked":""} onchange="mpMsfToggle('room', ${r.id}, this.checked)" />
        ${r.label}
      </label>
    `).join("") : `<div class="mp-msf-empty">Chưa có phòng chiếu nào trong dữ liệu</div>`;
  }
  // Phim
  const moviePanel = document.getElementById("mp-msf-panel-movie");
  if (moviePanel) {
    const movies = window.moviesList||[];
    moviePanel.innerHTML = movies.length ? movies.map(m => `
      <label class="mp-msf-opt">
        <input type="checkbox" ${window.mpFilterState.movie.has(m.movieId)?"checked":""} onchange="mpMsfToggle('movie', ${m.movieId}, this.checked)" />
        <span class="dot" style="background:${mpCalColor(m.title)}"></span> ${m.title}
      </label>
    `).join("") : `<div class="mp-msf-empty">Chưa có phim nào</div>`;
  }
  mpMsfUpdateCounts();
}

function mpMsfUpdateCounts(){
  const labels = { status: "Trạng thái phim", room: "Phòng chiếu", movie: "Phim" };
  let anyActive = false;
  ["status","room","movie"].forEach(key=>{
    const n = window.mpFilterState[key].size;
    const el = document.getElementById(`mp-msf-count-${key}`);
    if (el) el.innerText = n ? `${n} đã chọn` : "Tất cả";
    if (n) anyActive = true;
  });
  const clearBtn = document.getElementById("mp-msf-clear-btn");
  if (clearBtn) clearBtn.style.display = anyActive ? "inline-flex" : "none";
}

window.mpMsfToggle = function(key, value, checked){
  const set = window.mpFilterState[key];
  if (checked) set.add(value); else set.delete(value);
  mpCalRenderCurrent();
};

window.mpClearFilters = function(){
  window.mpFilterState = { status: new Set(), room: new Set(), movie: new Set() };
  mpCalRenderCurrent();
};

window.mpToggleMsf = function(key){
  const isOpen = window.mpMsfOpenKey === key;
  window.mpMsfOpenKey = isOpen ? null : key;
  document.querySelectorAll(".mp-msf").forEach(el => {
    el.classList.toggle("open", el.id === `mp-msf-${key}` && !isOpen);
  });
};

// Đóng panel filter khi click ra ngoài
document.addEventListener("click", function(e){
  if (!window.mpMsfOpenKey) return;
  if (e.target.closest(".mp-msf")) return;
  window.mpMsfOpenKey = null;
  document.querySelectorAll(".mp-msf").forEach(el => el.classList.remove("open"));
});
// Đóng popover sửa suất chiếu khi click ra ngoài
document.addEventListener("click", function(e){
  if (!window.mpEvtPopoverOpenId) return;
  if (e.target.closest("#mp-evt-popover") || e.target.closest(".mpcal-evt")) return;
  mpCloseShowtimePopover();
});

// ==========================================================================
// 🖱️ TƯƠNG TÁC TRỰC TIẾP TRÊN MA TRẬN (kiểu Google Calendar)
//    - Click 1 sự kiện  -> mở popover sửa giờ/phòng/giá hoặc xóa.
//    - Kéo-thả sự kiện  -> đổi giờ bắt đầu (giữ nguyên phòng + thời lượng).
//    - Kéo cạnh dưới    -> đổi giờ kết thúc (thời lượng).
//    - Click ô trống    -> mở nhanh modal "Tạo suất chiếu mới" đã điền sẵn giờ/ngày.
//    Mọi thay đổi (trừ tạo mới) đi qua lớp override tạm (mpSetShowtimeOverride)
//    vì backend chưa có API update/delete suất chiếu — xem ghi chú ở khối
//    "LỚP OVERRIDE TẠM" phía trên.
// ==========================================================================
function mpMinToHHMM(min){
  min = ((min % 1440) + 1440) % 1440;
  const h = Math.floor(min / 60), m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// ==========================================================================
// 🟢 ĐÃ SỬA: Hàm định vị suất chiếu - Ép kiểu chuỗi để tránh lệch kiểu dữ liệu
// ==========================================================================
function mpFindRawShowtime(id){
  for (const k in window.mpCalRawByDate) {
    // 🌟 SỬA TẠI ĐÂY: Ép cả 2 vế về String() để so khớp chuẩn xác giữa Số và Chuỗi
    const found = (window.mpCalRawByDate[k] || []).find(s => String(s.showtimeId) === String(id));
    if (found) return found;
  }
  return null;
}

function mpFindShowtimeDateKey(id){
  for (const k in window.mpCalRawByDate) {
    // 🌟 SỬA TẠI ĐÂY: Ép cả 2 vế về String() tương tự để tìm đúng ngày của suất chiếu
    if ((window.mpCalRawByDate[k] || []).some(s => String(s.showtimeId) === String(id))) return k;
  }
  return null;
}

function mpPatchRawShowtime(showtimeId, patch){
  const dateKey = mpFindShowtimeDateKey(showtimeId);
  if (!dateKey || !window.mpCalRawByDate[dateKey]) return dateKey;
  
  // 🌟 SỬA TẠI ĐÂY: Ép kiểu String() cho hàm tìm vị trí index
  const idx = window.mpCalRawByDate[dateKey].findIndex(s => String(s.showtimeId) === String(showtimeId));
  
  if (idx >= 0) {
    window.mpCalRawByDate[dateKey][idx] = { ...window.mpCalRawByDate[dateKey][idx], ...patch };
  }
  return dateKey;
}

// --- Click / kéo-thả trên 1 sự kiện ---
window.mpEvtMouseDown = function(evt, showtimeId){
  if (evt.target.closest(".mpcal-evt-resize")) return; // để handle resize tự xử lý riêng
  if (evt.button !== 0) return; // chỉ xử lý chuột trái
  evt.stopPropagation();
  const evtEl = evt.currentTarget;
  const st = mpFindRawShowtime(showtimeId);
  if (!st) return;
  const startY = evt.clientY;
  const baseTop = mpCalToMin(st.startTime) / 60 * MPCAL_HOUR_H;
  let dragging = false;

  function onMove(e){
    const dy = e.clientY - startY;
    if (!dragging && Math.abs(dy) > 5) { dragging = true; evtEl.classList.add("mpcal-evt-dragging"); }
    if (!dragging) return;
    evtEl.style.top = (baseTop + dy) + "px";
  }
  function onUp(e){
    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseup", onUp);
    evtEl.classList.remove("mpcal-evt-dragging");
    if (!dragging) {
      mpOpenShowtimePopover(showtimeId, evtEl);
      return;
    }
    const dy = e.clientY - startY;
    const deltaMin = Math.round((dy / MPCAL_HOUR_H * 60) / 5) * 5;
    mpCommitShowtimeMove(st, deltaMin);
  }
  document.addEventListener("mousemove", onMove);
  document.addEventListener("mouseup", onUp);
};

function mpCommitShowtimeMove(st, deltaMin){
  if (!deltaMin) { mpCalRenderCurrent(); return; }
  const durMin = mpCalToMin(st.endTime) - mpCalToMin(st.startTime);
  const newStartMin = Math.max(0, Math.min(1440 - durMin, mpCalToMin(st.startTime) + deltaMin));
  const newEndMin = newStartMin + durMin;
  const newStart = mpMinToHHMM(newStartMin);
  const newEnd = mpMinToHHMM(newEndMin);

  const dateKey = mpFindShowtimeDateKey(st.showtimeId);
  const conflict = (window.mpCalRawByDate[dateKey] || []).find(o => {
    if (o.showtimeId === st.showtimeId || o.roomId !== st.roomId) return false;
    const os = mpCalToMin(o.startTime), oe = mpCalToMin(o.endTime);
    return newStartMin < oe && newEndMin > os;
  });
  if (conflict) {
    alert(`Không thể dời giờ: trùng với "${conflict.movieTitle}" (${conflict.startTime}-${conflict.endTime}) tại ${mpCalRoomLabel(st.roomId)}. Vui lòng chọn khung giờ khác!`);
    mpCalRenderCurrent();
    return;
  }

  mpSetShowtimeOverride(st.showtimeId, { startTime: newStart, endTime: newEnd });
  mpPatchRawShowtime(st.showtimeId, { startTime: newStart, endTime: newEnd });
  alert(`Đã dời "${st.movieTitle}" sang ${newStart} (lưu tạm trên trình duyệt, chưa đồng bộ server).`);
  mpCalRenderCurrent();
}

// --- Kéo cạnh dưới sự kiện để đổi thời lượng (giờ kết thúc) ---
window.mpEvtResizeMouseDown = function(evt, showtimeId){
  evt.stopPropagation();
  evt.preventDefault();
  const st = mpFindRawShowtime(showtimeId);
  if (!st) return;
  const evtEl = evt.currentTarget.closest(".mpcal-evt");
  const startY = evt.clientY;
  const baseTop = mpCalToMin(st.startTime) / 60 * MPCAL_HOUR_H;
  const baseH = mpCalToMin(st.endTime) / 60 * MPCAL_HOUR_H - baseTop;

  function onMove(e){
    const dy = e.clientY - startY;
    evtEl.style.height = Math.max(20, baseH + dy) + "px";
  }
  function onUp(e){
    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseup", onUp);
    const dy = e.clientY - startY;
    const deltaMin = Math.round((dy / MPCAL_HOUR_H * 60) / 5) * 5;
    if (!deltaMin) { mpCalRenderCurrent(); return; }
    mpCommitShowtimeResize(st, deltaMin);
  }
  document.addEventListener("mousemove", onMove);
  document.addEventListener("mouseup", onUp);
};

function mpCommitShowtimeResize(st, deltaMin){
  const startMin = mpCalToMin(st.startTime);
  const newEndMin = Math.max(startMin + 15, Math.min(1440, mpCalToMin(st.endTime) + deltaMin));
  const newEnd = mpMinToHHMM(newEndMin);

  const dateKey = mpFindShowtimeDateKey(st.showtimeId);
  const conflict = (window.mpCalRawByDate[dateKey] || []).find(o => {
    if (o.showtimeId === st.showtimeId || o.roomId !== st.roomId) return false;
    const os = mpCalToMin(o.startTime), oe = mpCalToMin(o.endTime);
    return startMin < oe && newEndMin > os;
  });
  if (conflict) {
    alert(`Không thể đổi thời lượng: trùng với "${conflict.movieTitle}" tại ${mpCalRoomLabel(st.roomId)}.`);
    mpCalRenderCurrent();
    return;
  }

  mpSetShowtimeOverride(st.showtimeId, { endTime: newEnd });
  mpPatchRawShowtime(st.showtimeId, { endTime: newEnd });
  alert(`Đã đổi giờ kết thúc "${st.movieTitle}" thành ${newEnd} (lưu tạm trên trình duyệt).`);
  mpCalRenderCurrent();
}

// --- Popover sửa/xóa nhanh 1 suất chiếu ---
function mpEnsureEvtPopoverEl(){
  let el = document.getElementById("mp-evt-popover");
  if (!el) {
    el = document.createElement("div");
    el.id = "mp-evt-popover";
    el.className = "mp-evt-popover";
    document.body.appendChild(el);
  }
  return el;
}

window.mpOpenShowtimePopover = function(showtimeId, anchorEl){
  const st = mpFindRawShowtime(showtimeId);
  if (!st) return;
  const el = mpEnsureEvtPopoverEl();
  const roomOptions = window.MP_ROOMS.slice().sort((a, b) => a.id - b.id)
    .map(r => `<option value="${r.id}" ${r.id === st.roomId ? "selected" : ""}>${r.label}</option>`).join("");

  // 🌟 ĐÃ SỬA: Lấy trạng thái hiện tại của suất chiếu từ Database (Mặc định là ACTIVE nếu trống)
  const currentStatus = st.status || "ACTIVE";

  el.innerHTML = `
    <div class="mp-evt-pop-head">
      <b>${st.movieTitle}</b>
      <span class="mp-evt-pop-close" onclick="mpCloseShowtimePopover()">✕</span>
    </div>
    <div class="mp-evt-pop-body">
      <label>Giờ bắt đầu</label>
      <input type="time" id="mpep-start" value="${st.startTime}" />
      <label>Phòng chiếu</label>
      <select id="mpep-room">${roomOptions}</select>
      <label>Giá vé (VND)</label>
      <input type="number" id="mpep-price" value="${st.ticketPrice || 90000}" />
      
      <!-- 🌟 THÊM MỚI: Dropdown cấu hình trạng thái suất chiếu theo yêu cầu -->
      <label>Trạng thái suất chiếu</label>
      <select id="mpep-status" style="width:100%; padding:6px; background:#1c1c21; color:#fff; border:1px solid rgba(255,255,255,0.12); border-radius:4px; font-size:12px;">
        <option value="ACTIVE" ${currentStatus === "ACTIVE" ? "selected" : ""}>🟢 Active (Đang chiếu)</option>
        <option value="INACTIVE" ${currentStatus === "INACTIVE" ? "selected" : ""}>🟡 Inactive (Sắp chiếu)</option>
        <option value="HIDDEN" ${currentStatus === "HIDDEN" ? "selected" : ""}>🔴 Ẩn (Hidden)</option>
      </select>
    </div>
    <div class="mp-evt-pop-actions">
      <button class="btn-cgv-cancel" onclick="mpDeleteShowtimeFromPopover(${st.showtimeId})">Xóa</button>
      <button class="mp-btn-add" onclick="mpSaveShowtimeFromPopover(${st.showtimeId})">Lưu</button>
    </div>
  `;

  const rect = anchorEl.getBoundingClientRect();
  const popW = 250;
  let left = window.scrollX + rect.right + 10;
  if (left + popW > window.scrollX + window.innerWidth) left = window.scrollX + rect.left - popW - 10;
  el.style.top = Math.max(10, window.scrollY + rect.top) + "px";
  el.style.left = Math.max(10, left) + "px";
  el.classList.add("open");
  window.mpEvtPopoverOpenId = showtimeId;
};

window.mpCloseShowtimePopover = function(){
  const el = document.getElementById("mp-evt-popover");
  if (el) el.classList.remove("open");
  window.mpEvtPopoverOpenId = null;
};

window.mpSaveShowtimeFromPopover = function(showtimeId){
  const st = mpFindRawShowtime(showtimeId); if (!st) return;
  const newStart = document.getElementById("mpep-start").value;
  const newRoom = parseInt(document.getElementById("mpep-room").value);
  const newPrice = parseFloat(document.getElementById("mpep-price").value) || st.ticketPrice;
  const newStatus = document.getElementById("mpep-status").value;
  
  if (!newStart) { alert("Vui lòng chọn giờ bắt đầu!"); return; }

  // 🟢 GỘP CHUNG VÀ ĐƯA LÊN ĐẦU: Định nghĩa biến dateKey/selectedDate ngay lập tức từ hàm tạo sẵn
  const dateKey = mpFindShowtimeDateKey(showtimeId);
  if (!dateKey) { alert("Không xác định được ngày của suất chiếu!"); return; }
  const selectedDate = dateKey; // Gán hai biến bằng nhau để các đoạn code payload phía dưới không bị lỗi logic

  const durMin = mpCalToMin(st.endTime) - mpCalToMin(st.startTime);
  const newEnd = mpMinToHHMM(mpCalToMin(newStart) + durMin);

  // ==========================================================================
  // 🌟 KHÓA CHẶN TRÙNG LỊCH: Kiểm tra conflict giờ chiếu thực tế (dateKey đã sẵn sàng)
  // ==========================================================================
  const newStartMin = mpCalToMin(newStart);
  const newEndMin = newStartMin + durMin;

  const conflict = (window.mpCalRawByDate[dateKey] || []).find(o => {
    if (String(o.showtimeId) === String(showtimeId) || o.roomId !== newRoom) return false;
    const os = mpCalToMin(o.startTime);
    const oe = mpCalToMin(o.endTime);
    return newStartMin < oe && newEndMin > os;
  });

  if (conflict) {
    alert(`❌ KHÔNG THỂ CẬP NHẬT!\n\nKhung giờ bạn chọn (${newStart} - ${newEnd}) đã bị trùng lịch với phim "${conflict.movieTitle}" (${conflict.startTime} - ${conflict.endTime}) tại ${mpCalRoomLabel(newRoom)}.\nVui lòng chọn khung giờ khác!`);
    return;
  }
  const payload = {
    roomId: newRoom,
    startTime: `${selectedDate}T${newStart}:00`,
    endTime: `${selectedDate}T${newEnd}:00`,
    ticketPrice: newPrice,
    status: newStatus,
    updatedBy: 1
  };

  // 🟢 Đã sửa: Khớp chuẩn xác 100% với endpoint update tường minh của Spring Boot
fetch(`http://localhost:8080/api/showtimes/update/${showtimeId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
  .then(res => { if (!res.ok) throw new Error("Lỗi cập nhật!"); return res.json(); })
  .then(() => {
    alert("Hệ thống đã cập nhật suất chiếu xuống SQL Server thành công!");
    window.mpCalRawByDate = {}; // Xóa cache sạch
    mpCloseShowtimePopover(); loadManagerMatrix();
  })
  .catch(err => alert("Cập nhật lên Server thất bại: " + err.message));
};

// ==========================================================================
// 🟢 ĐÃ SỬA: Hàm xóa suất chiếu - Kết nối API DELETE thực tế 100% với SQL Server
// ==========================================================================
window.mpDeleteShowtimeFromPopover = function(showtimeId){
  const st = mpFindRawShowtime(showtimeId);
  if (!st) return;
  
  // Hộp thoại confirm gốc của trình duyệt giữ nguyên logic để lấy kết quả đồng bộ
  if (!confirm(`Bạn có chắc chắn muốn gỡ bỏ hoàn toàn suất chiếu phim "${st.movieTitle}" lúc ${st.startTime} khỏi hệ thống không?`)) return;

  console.log("✈️ Gửi API DELETE xóa suất chiếu ID:", showtimeId);

  // Bắn lệnh DELETE lên Server Spring Boot
  fetch(`http://localhost:8080/api/showtimes/delete/${showtimeId}`, {
    method: "DELETE"
  })
  .then(res => {
    if (!res.ok) throw new Error("Mạng hoặc Server báo lỗi không thể xóa!");
    return res.json();
  })
  .then(data => {
    alert("Hệ thống đã gỡ suất chiếu khỏi SQL Server thành công!");
    
    // 🌟 Làm sạch hoàn toàn bộ nhớ runtime để buộc hệ thống quét mới dữ liệu từ Database
    window.mpCalRawByDate = {}; 
    
    mpCloseShowtimePopover();
    loadManagerMatrix(); // Tải lại ma trận để cập nhật giao diện mất hẳn ô lịch đó
  })
  .catch(err => {
    console.error(err);
    alert("Xóa thất bại! Lỗi kết nối hoặc suất chiếu đã dính hóa đơn đặt vé: " + err.message);
  });
};

// --- Click vùng trống trên ma trận (view Ngày/Tuần) để tạo nhanh suất chiếu ---
window.mpDayColClick = function(evt, dateStr){
  if (evt.target.closest(".mpcal-evt")) return; // đã có handler riêng cho sự kiện
  mpCloseShowtimePopover();
  const daycol = evt.currentTarget;
  const rect = daycol.getBoundingClientRect();
  const offsetY = evt.clientY - rect.top;
  const rawMin = Math.round((offsetY / MPCAL_HOUR_H * 60) / 15) * 15;
  const clampedMin = Math.max(0, Math.min(23 * 60 + 45, rawMin));
  const timeStr = mpMinToHHMM(clampedMin);

  const dateInput = document.getElementById("mp-matrix-date-input");
  if (dateInput) dateInput.value = dateStr;

  openAddShowtimeModal();
  const timeInput = document.getElementById("st-start-time");
  if (timeInput) timeInput.value = timeStr;
};

// ==========================================================================
// 🚀 LOGIC ĐIỀU KHIỂN FORM TẠO MỚI SUẤT CHIẾU ĐỘNG
// ==========================================================================

// Hàm mở Modal và tự động cào danh sách phim thật từ DB đổ vào ô Dropdown chọn phim
window.openAddShowtimeModal = function() {
  const movieSelect = document.getElementById("st-movie-select");
  if (!movieSelect) return;

  movieSelect.innerHTML = "";
  
  if (!window.moviesList || window.moviesList.length === 0) {
    alert("Không tìm thấy danh sách phim trong bộ nhớ! Đang tải lại...");
    return;
  }

  window.moviesList.forEach(m => {
    movieSelect.innerHTML += `<option value="${m.movieId}">${m.title} (${m.duration || m.durationMinutes || 0} phút)</option>`;
  });

  const roomSelect = document.getElementById("st-room-select");
  if (roomSelect) {
    roomSelect.innerHTML = window.MP_ROOMS.slice()
      .sort((a, b) => a.id - b.id)
      .map(r => `<option value="${r.id}">${r.label}</option>`)
      .join("");
  }

  // Reset các ô nhập liệu cơ bản về trạng thái mặc định
  document.getElementById("st-start-time").value = "";
  document.getElementById("st-ticket-price").value = "90000";

  // 🌟 THÊM MỚI CHỖ NÀY: Tự động chèn Dropdown chọn 3 trạng thái vào Form Tạo mới nếu chưa có
  let statusGroup = document.getElementById("st-status-group");
  if (!statusGroup) {
    // Bốc thằng ô nhập giá vé để chèn cái dropdown trạng thái lên ngay phía trên nó
    const priceInput = document.getElementById("st-ticket-price");
    if (priceInput && priceInput.parentElement) {
      statusGroup = document.createElement("div");
      statusGroup.id = "st-status-group";
      statusGroup.className = "mp-form-group"; // Ăn theo class CSS form chung của nhóm em
      statusGroup.innerHTML = `
        <label style="display:block; margin: 10px 0 5px 0; font-size:12px; color:#9a9aa3;">Trạng thái suất chiếu</label>
        <select id="st-status" style="width:100%; padding:8px; background:#1c1c21; color:#fff; border:1px solid rgba(255,255,255,0.12); border-radius:4px; font-size:13px;">
          <option value="ACTIVE" selected>🟢 Active (Đang chiếu)</option>
          <option value="INACTIVE">🟡 Inactive (Sắp chiếu)</option>
          <option value="HIDDEN">🔴 Ẩn (Hidden)</option>
        </select>
      `;
      // Chèn lên trước ô giá vé
      priceInput.parentElement.insertBefore(statusGroup, priceInput.previousSibling);
    }
  } else {
    // Nếu dropdown đã tồn tại từ lần mở trước, reset nó về mặc định ACTIVE
    document.getElementById("st-status").value = "ACTIVE";
  }

  document.getElementById("mp-add-showtime-modal").style.display = "flex";
};

window.closeAddShowtimeModal = function() {
  document.getElementById("mp-add-showtime-modal").style.display = "none";
};

// Hàm đóng gói dữ liệu và đẩy xuống SQL Server thông qua Spring Boot
window.submitAddShowtimeForm = function() {
  const movieId = document.getElementById("st-movie-select").value;
  const roomId = parseInt(document.getElementById("st-room-select").value) || 1;
  const startTimeRaw = document.getElementById("st-start-time").value; 
  const ticketPrice = parseFloat(document.getElementById("st-ticket-price").value) || 0;
  
  // 🌟 THÊM MỚI: Bốc trạng thái được chọn từ Form (Mặc định phòng hờ là ACTIVE)
  const statusSelect = document.getElementById("st-status");
  const showtimeStatus = statusSelect ? statusSelect.value : "ACTIVE";
  
  const selectedDate = document.getElementById("mp-matrix-date-input").value;

  if (!startTimeRaw) {
    alert("Vui lòng chọn Giờ bắt đầu chiếu phim!");
    return;
  }
  if (ticketPrice <= 0) {
    alert("Giá vé cơ bản phải lớn hơn 0 đ!");
    return;
  }

  const formattedStartTime = `${selectedDate}T${startTimeRaw}:00`;

  const targetMovie = window.moviesList.find(m => String(m.movieId) === String(movieId));
  const duration = targetMovie ? (targetMovie.duration || targetMovie.durationMinutes || 120) : 120;
  
  const startDateTime = new Date(`${selectedDate} ${startTimeRaw}`);
  const endDateTime = new Date(startDateTime.getTime() + duration * 60000);
  
  const endH = String(endDateTime.getHours()).padStart(2, "0");
  const endM = String(endDateTime.getMinutes()).padStart(2, "0");
  const formattedEndTime = `${selectedDate}T${endH}:${endM}:00`;

  // 📦 ĐÃ SỬA: Đóng gói thêm thuộc tính "status" đồng bộ sang map payload của Java
  const payload = {
    movie: { movieId: parseInt(movieId) },
    roomId: roomId,
    startTime: formattedStartTime,
    endTime: formattedEndTime,
    ticketPrice: ticketPrice,
    status: showtimeStatus, // 🌟 Đẩy trạng thái sang Backend xử lý
    createdBy: 1
  };

  console.log("🚀 Payload gửi lên Spring Boot tạo suất chiếu:", payload);

  // --- Đoạn check trùng lịch Google Calendar động của nhóm em giữ nguyên 100% ---
  const timeToMinutes = (timeStr) => {
    const [h, m] = timeStr.split(":").map(Number);
    return h * 60 + m;
  };

  const newStartMin = timeToMinutes(startTimeRaw);
  const newEndMin = newStartMin + duration;

  const checkPromises = window.moviesList.map((movie) => {
    return API.getShowtimes(movie.movieId, selectedDate)
      .then((resData) => (resData.showtimes || []).map(st => ({ ...st, movieTitle: movie.title })))
      .catch(() => []);
  });

  Promise.all(checkPromises)
    .then((allResults) => {
      const currentShowtimesInDay = allResults.flat();
      let isTimeConflict = false;
      let conflictMovieTitle = "";

      for (let st of currentShowtimesInDay) {
        if (st.roomId === roomId) {
          const existStart = timeToMinutes(st.startTime);
          const existEnd = timeToMinutes(st.endTime);

          if (newStartMin < existEnd && newEndMin > existStart) {
            isTimeConflict = true;
            conflictMovieTitle = st.movieTitle;
            break;
          }
        }
      }

      if (isTimeConflict) {
        alert(`KHÔNG THỂ XẾP LỊCH!\n\nThời gian bạn chọn (${startTimeRaw} - ${endH}:${endM}) đã bị trùng/giao thoa với phim "${conflictMovieTitle}" trong cùng Phòng ${roomId}.\nVui lòng chọn khung giờ khác!`);
        return; 
      }

      // Nếu an toàn, thực hiện gọi API lưu xuống database
      API.addShowtime(payload)
        .then(() => {
          alert("Xếp lịch chiếu mới thành công! Suất chiếu đã được lưu xuống SQL Server.");
          closeAddShowtimeModal();
          
          // Xóa mảng dữ liệu thô cũ để ép hệ thống gọi API nạp mới hoàn toàn từ DB về, hiển thị ẩn ngay tức thì
          window.mpCalRawByDate = {}; 
          loadManagerMatrix();
        })
        .catch((err) => {
          console.error(err);
          alert("Thêm suất chiếu thất bại: " + err.message);
        });
    })
    .catch((err) => {
      console.error("Lỗi khi kiểm tra trùng lịch:", err);
      alert("Không thể xác thực trùng lịch do lỗi kết nối!");
    });
};

// ==========================================================================
// 🚀 BỘ CHỨC NĂNG QUẢN LÝ CHIẾN DỊCH VOUCHER / KHUYẾN MÃI (TÁCH BIỆT)
// ==========================================================================

// Hàm ẩn/hiện Modal gốc
window.openCreatePromoModal = function() {
  const modal = document.getElementById("mp-create-promo-modal");
  if (modal) modal.style.display = "flex";
};

window.closeCreatePromoModal = function() {
  const modal = document.getElementById("mp-create-promo-modal");
  if (modal) modal.style.display = "none";
};

// 🌟 BỔ SUNG 1: Hàm co giãn khối điều kiện tự động ngầm khi Manager chọn AUTO
window.toggleVoucherConditionFields = function() {
  const applyType = document.getElementById("v-apply-type").value;
  const conditionsBlock = document.getElementById("v-auto-conditions-block");
  if (conditionsBlock) {
    conditionsBlock.style.display = (applyType === "AUTO") ? "block" : "none";
  }
};

// 🌟 BỔ SUNG 2: Hàm ẩn/hiện ô điền giá trị thứ trong tuần (Thứ 4 điền số 3)
window.toggleConditionValueField = function() {
  const condType = document.getElementById("v-condition-type").value;
  const valueGroup = document.getElementById("v-condition-value-group");
  if (valueGroup) {
    valueGroup.style.display = (condType === "DAY_OF_WEEK") ? "block" : "none";
  }
};

// 1. Tải danh sách Voucher từ database lên bảng Admin thông qua API tổng
window.loadManagerVouchers = function() {
  const tbody = document.getElementById("mp-promo-tbody");
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:15px;">Đang quét danh sách chiến dịch khuyến mãi...</td></tr>';

  API.getManagerVouchers()
    .then((vouchers) => {
      window.vouchersList = vouchers;
      renderVoucherRows(vouchers);
      
      // 🌟 TIỆN ÍCH KÈM THEO: Tự động nạp luôn dữ liệu vào select box của tab Chiến dịch (nếu tab này đang mở)
      window.loadVouchersToSelectDropdown();
    })
    .catch((err) => {
      console.error(err);
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:red;">Lỗi kết nối danh mục Voucher: ${err.message}</td></tr>`;
    });
};

// 🌟 BỔ SUNG 3: Hàm bốc danh sách Voucher đổ vào select box của tab Chiến dịch/Events
window.loadVouchersToSelectDropdown = function() {
  const selectBox = document.getElementById("event-voucher-select");
  if (!selectBox) return;

  // Giữ lại option mặc định không chọn mã
  let optionsHtml = `<option value="">-- Không kèm Voucher (Sự kiện tin tức thuần túy) --</option>`;

  if (window.vouchersList && window.vouchersList.length > 0) {
    // Chỉ nạp các voucher đang ACTIVE để liên kết chiến dịch truyền thông
    const activeVouchers = window.vouchersList.filter(v => v.status === "ACTIVE" || v.status == null);
    activeVouchers.forEach(v => {
      let unit = v.discountType === "PERCENT" ? "%" : "đ";
      optionsHtml += `<option value="${v.voucherId}">${v.voucherCode} (Giảm ${v.discountValue.toLocaleString("vi-VN")}${unit})</option>`;
    });
  }
  selectBox.innerHTML = optionsHtml;
};

// 2. Mở modal để THÊM MỚI Voucher (Xóa sạch dữ liệu cũ trong form)
window.openAddVoucherModal = function() {
  document.getElementById("v-id").value = "";
  document.getElementById("v-code").value = "";
  document.getElementById("v-apply-type").value = "MANUAL";
  document.getElementById("v-condition-type").value = "NONE";
  document.getElementById("v-condition-value").value = "";
  document.getElementById("v-type").value = "PERCENT";
  document.getElementById("v-value").value = "";
  document.getElementById("v-max").value = "0";
  document.getElementById("v-min").value = "0";
  document.getElementById("v-limit").value = "100";
  document.getElementById("v-expired").value = "";
  document.getElementById("v-status").value = "ACTIVE";

  window.toggleVoucherConditionFields();
  window.toggleConditionValueField();
  document.getElementById("mp-promo-modal-title").innerText = "Thêm Mới Chiến Dịch Khuyến Mãi";
  window.openCreatePromoModal();
};

// 3. Mở modal để CHỈNH SỬA Voucher đã có
window.openEditVoucherModal = function(id) {
  const v = window.vouchersList.find(x => x.voucherId === id);
  if (!v) return;

  document.getElementById("v-id").value = v.voucherId;
  document.getElementById("v-code").value = v.voucherCode;
  document.getElementById("v-apply-type").value = v.applyType || "MANUAL";
  document.getElementById("v-condition-type").value = v.conditionType || "NONE";
  document.getElementById("v-condition-value").value = v.conditionValue || "";
  document.getElementById("v-type").value = v.discountType;
  document.getElementById("v-value").value = v.discountValue;
  document.getElementById("v-max").value = v.maxDiscount || 0;
  document.getElementById("v-min").value = v.minimumOrder || 0;
  document.getElementById("v-limit").value = v.usageLimit;
  
  if (v.expiredDate) {
    document.getElementById("v-expired").value = v.expiredDate.substring(0, 16);
  }
  document.getElementById("v-status").value = v.status || "ACTIVE";

  window.toggleVoucherConditionFields();
  window.toggleConditionValueField();
  document.getElementById("mp-promo-modal-title").innerText = "Cập Nhật Chiến Dịch Khuyến Mãi";
  window.openCreatePromoModal();
};

// 4. Xử lý bấm nút "Lưu chiến dịch" (Form Submit)
window.submitVoucherForm = function() {
  const id = document.getElementById("v-id").value;
  const code = document.getElementById("v-code").value.trim().toUpperCase();
  const applyType = document.getElementById("v-apply-type").value;
  const conditionType = document.getElementById("v-condition-type").value;
  const conditionValue = document.getElementById("v-condition-value").value.trim();
  const type = document.getElementById("v-type").value;
  const value = parseFloat(document.getElementById("v-value").value) || 0;
  const max = parseFloat(document.getElementById("v-max").value) || 0;
  const min = parseFloat(document.getElementById("v-min").value) || 0;
  const limit = parseInt(document.getElementById("v-limit").value) || 0;
  const expired = document.getElementById("v-expired").value;
  const status = document.getElementById("v-status").value;

  if (!code) { alert("Vui lòng nhập mã Voucher!"); return; }
  if (value <= 0) { alert("Giá trị giảm phải lớn hơn 0!"); return; }

  const voucherData = {
    voucherCode: code,
    discountType: type,
    discountValue: value,
    maxDiscount: max,
    minimumOrder: min,
    usageLimit: limit,
    expiredDate: expired ? `${expired}:00` : null,
    status: status,
    applyType: applyType,
    conditionType: applyType === "AUTO" ? conditionType : "NONE",
    conditionValue: (applyType === "AUTO" && conditionType === "DAY_OF_WEEK") ? conditionValue : "NONE",
    createdBy: parseInt(sessionStorage.getItem("roleId")) || 1,
    updatedBy: parseInt(sessionStorage.getItem("roleId")) || 1
  };

  const apiCall = id ? API.updateVoucher(id, voucherData) : API.addVoucher(voucherData);

  apiCall
    .then(() => {
      alert(id ? "Cập nhật chiến dịch thành công!" : "Tạo mã Voucher khuyến mãi mới thành công!");
      window.closeCreatePromoModal();
      loadManagerVouchers();
    })
    .catch(err => alert("Lỗi xử lý Voucher: " + err.message));
};

// 6. Lọc/tìm kiếm danh sách voucher theo mã, loại giảm giá, trạng thái
window.filterManagerPromo = function() {
  const tbody = document.getElementById("mp-promo-tbody");
  if (!tbody || !window.vouchersList) return;

  const keyword = (document.getElementById("mp-promo-search-input").value || "").trim().toUpperCase();
  const typeFilter = document.getElementById("mp-promo-filter-type").value;
  const statusFilter = document.getElementById("mp-promo-filter-status").value;

  const filtered = window.vouchersList.filter((v) => {
    const matchKeyword = !keyword || (v.voucherCode || "").toUpperCase().includes(keyword);
    const matchType = typeFilter === "all" || v.discountType === typeFilter;
    const matchStatus = statusFilter === "all" || (v.status || "ACTIVE") === statusFilter;
    return matchKeyword && matchType && matchStatus;
  });

  renderVoucherRows(filtered);
};

function renderVoucherRows(vouchers) {
  const tbody = document.getElementById("mp-promo-tbody");
  tbody.innerHTML = "";

  if (!vouchers || vouchers.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:#888; padding:15px;">Không tìm thấy chiến dịch khuyến mãi phù hợp!</td></tr>';
    return;
  }

  vouchers.forEach((v, index) => {
    let expiryDate = v.expiredDate ? new Date(v.expiredDate).toLocaleDateString("vi-VN") : "Vô thời hạn";
    let discountText = v.discountType === "PERCENT" ? `${v.discountValue}%` : `${v.discountValue.toLocaleString("vi-VN")} đ`;
    let statusText = v.status === "INACTIVE"
      ? '<span style="color:#9a9aa3;">Ngừng hoạt động</span>'
      : '<span style="color:#4ade80; font-weight:bold;">Đang hoạt động</span>';

    tbody.innerHTML += `
      <tr>
          <td style="text-align: center; font-weight: bold;">${index + 1}</td>
          <td style="text-align: left;"><span class="mp-badge-code">${v.voucherCode}</span></td>
          <td style="text-align: left;">${v.discountType === "PERCENT" ? "Giảm theo phần trăm (%)" : "Giảm tiền mặt trực tiếp"}</td>
          <td style="text-align: right; font-weight: bold; color: #ff6b6b;">${discountText}</td>
          <td style="text-align: center;">${v.usageLimit} lượt</td>
          <td style="text-align: center;">${expiryDate}</td>
          <td style="text-align: center;">${statusText}</td>
          <td style="text-align: center;">
              <div class="mp-table-actions" style="display:flex; gap:14px; justify-content:center;">
                  <button class="mp-action-btn" onclick="openEditVoucherModal(${v.voucherId})" style="cursor:pointer;" title="Sửa"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button>
                  <button class="mp-action-btn mp-action-btn-danger" onclick="submitDeleteVoucher(${v.voucherId})" style="cursor:pointer;" title="Xóa"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg></button>
              </div>
          </td>
      </tr>
    `;
  });
}

// 5. Xử lý Xóa Voucher qua API tổng
window.submitDeleteVoucher = function(id) {
  if (confirm("Bạn có chắc chắn muốn gỡ bỏ hoàn toàn mã Voucher này khỏi hệ thống không?")) {
    API.deleteVoucher(id)
      .then(() => {
        alert("Đã gỡ chiến dịch khuyến mãi thành công!");
        loadManagerVouchers();
      })
      .catch(err => alert("Lỗi khi xóa voucher: " + err.message));
  }
};
/* =========================================================
   CHUÔNG THÔNG BÁO MANAGER
   Chỉ dùng F&B, Voucher và Audit.
   Không gọi lại Dashboard Overview.
   ========================================================= */

let MP_MANAGER_NOTIFICATIONS = [];
let mpNotificationRefreshTimer = null;

const MP_SEEN_NOTIFICATION_KEY =
  "mp_seen_manager_notifications";

function mpEscapeHtml(value) {
  const element = document.createElement("div");
  element.textContent = String(value ?? "");
  return element.innerHTML;
}

function mpGetSeenNotifications() {
  try {
    const value = JSON.parse(
      localStorage.getItem(MP_SEEN_NOTIFICATION_KEY) || "[]"
    );

    return new Set(Array.isArray(value) ? value : []);
  } catch (error) {
    return new Set();
  }
}

function mpSaveSeenNotifications(seen) {
  localStorage.setItem(
    MP_SEEN_NOTIFICATION_KEY,
    JSON.stringify(Array.from(seen))
  );
}

function mpGetTodayString() {
  const date = new Date();

  return (
    date.getFullYear() +
    "-" +
    String(date.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(date.getDate()).padStart(2, "0")
  );
}

window.loadManagerNotifications = async function () {
  const listElement = document.getElementById("mp-notif-list");

  if (listElement) {
    listElement.innerHTML = `
      <div class="mp-notif-item">
        Đang kiểm tra vận hành rạp...
      </div>
    `;
  }

  /*
   * Không gọi API.getDashboardOverviewData() tại đây.
   * Dashboard đã tự gọi API đó trong manager-dashboard.js.
   */
  const results = await Promise.allSettled([
    API.getFnbItems(),
    API.getManagerVouchers(),
    API.getAuditReportData(mpGetTodayString())
  ]);

  const notifications = [];

  // 1. Cảnh báo F&B
  if (results[0].status === "fulfilled") {
    const items = Array.isArray(results[0].value)
      ? results[0].value
      : [];

    items.forEach((item) => {
      const stock = Number(item.stockQuantity || 0);

      if (stock <= 0) {
        notifications.push({
          id: `fnb-${item.foodItemId}-out`,
          level: "error",
          title: `${item.itemName} đã hết hàng`,
          detail: "Cần nhập thêm hàng.",
          tab: "fnb"
        });
      } else if (stock <= 30) {
        notifications.push({
          id: `fnb-${item.foodItemId}-low`,
          level: "warning",
          title: `${item.itemName} sắp hết hàng`,
          detail: `Số lượng tồn hiện tại: ${stock}.`,
          tab: "fnb"
        });
      }
    });
  }

  // 2. Cảnh báo Voucher
  if (results[1].status === "fulfilled") {
    const vouchers = Array.isArray(results[1].value)
      ? results[1].value
      : [];

    const now = new Date();
    const threeDays = 3 * 24 * 60 * 60 * 1000;

    vouchers.forEach((voucher) => {
      if (
        String(voucher.status || "ACTIVE").toUpperCase() !==
        "ACTIVE"
      ) {
        return;
      }

      if (!voucher.expiredDate) return;

      const expiredDate = new Date(voucher.expiredDate);
      const remainingTime =
        expiredDate.getTime() - now.getTime();

      if (Number.isNaN(remainingTime)) return;

      if (remainingTime <= 0) {
        notifications.push({
          id: `voucher-${voucher.voucherId}-expired`,
          level: "error",
          title: `Voucher ${voucher.voucherCode} đã hết hạn`,
          detail: "Voucher vẫn đang ở trạng thái hoạt động.",
          tab: "promo"
        });
      } else if (remainingTime <= threeDays) {
        const hours = Math.ceil(
          remainingTime / (60 * 60 * 1000)
        );

        notifications.push({
          id: `voucher-${voucher.voucherId}-soon`,
          level: "warning",
          title: `Voucher ${voucher.voucherCode} sắp hết hạn`,
          detail: `Còn khoảng ${hours} giờ.`,
          tab: "promo"
        });
      }
    });
  }

  // 3. Cảnh báo đối soát
  if (results[2].status === "fulfilled") {
    const rows = results[2].value?.auditRows || [];

    const mismatchRows = rows.filter(
      (row) => Number(row.deviation || 0) !== 0
    );

    if (mismatchRows.length > 0) {
      const totalDeviation = mismatchRows.reduce(
        (total, row) =>
          total + Math.abs(Number(row.deviation || 0)),
        0
      );

      notifications.push({
        id:
          "audit-" +
          mismatchRows
            .map(
              (row) =>
                `${row.labelDate}-${row.deviation}`
            )
            .join("_"),
        level: "error",
        title: "Phát hiện chênh lệch doanh thu",
        detail:
          `${mismatchRows.length} ngày bị lệch, tổng ` +
          `${totalDeviation.toLocaleString("vi-VN")}đ.`,
        tab: "audit"
      });
    }
  }

  const priority = {
    error: 1,
    warning: 2,
    info: 3
  };

  MP_MANAGER_NOTIFICATIONS = notifications
    .sort(
      (first, second) =>
        priority[first.level] - priority[second.level]
    )
    .slice(0, 10);

  renderManagerNotifications();
};

function renderManagerNotifications() {
  const listElement = document.getElementById("mp-notif-list");
  const badge = document.getElementById("mp-notif-count");
  const unreadLabel = document.getElementById(
    "mp-notif-unread-label"
  );

if (!listElement) {
  console.error("Thiếu phần tử #mp-notif-list");
  return;
}

  const seen = mpGetSeenNotifications();

  const unreadCount = MP_MANAGER_NOTIFICATIONS.filter(
    (item) => !seen.has(item.id)
  ).length;

 if (badge) {
  if (unreadCount > 0) {
    badge.textContent = unreadCount > 99
      ? "99+"
      : unreadCount;

    badge.style.display = "flex";
  } else {
    badge.style.display = "none";
  }
}

  if (unreadLabel) {
    unreadLabel.textContent = unreadCount > 0
      ? `${unreadCount} chưa xem`
      : "Đã xem hết";
  }

  if (MP_MANAGER_NOTIFICATIONS.length === 0) {
    listElement.innerHTML = `
      <div class="mp-notif-item">
        Không có cảnh báo vận hành mới.
      </div>
    `;
    return;
  }

  listElement.innerHTML = MP_MANAGER_NOTIFICATIONS
    .map((item) => {
      const icon =
        item.level === "error" ? "!" : "⚠";

      const color =
        item.level === "error"
          ? "#ef4444"
          : "#f59e0b";

      return `
        <div
          class="mp-notif-item"
          onclick="openManagerNotificationTab('${item.tab}')"
        >
          <span
            class="mp-notif-icon"
            style="color:${color}; font-weight:800;"
          >
            ${icon}
          </span>

          <div>
            <strong>${mpEscapeHtml(item.title)}</strong>

            <div style="
              margin-top:4px;
              color:#9a9aa3;
              font-size:12px;
              line-height:1.4;
            ">
              ${mpEscapeHtml(item.detail)}
            </div>
          </div>
        </div>
      `;
    })
    .join("");
}

window.markManagerNotificationsRead = function () {
  const seen = mpGetSeenNotifications();

  MP_MANAGER_NOTIFICATIONS.forEach((item) => {
    seen.add(item.id);
  });

  mpSaveSeenNotifications(seen);
  renderManagerNotifications();
};

window.openManagerNotificationTab = function (tabId) {
  markManagerNotificationsRead();

  const dropdown = document.getElementById(
    "mp-notif-dropdown"
  );

  if (dropdown) {
    dropdown.classList.remove("open");
  }

  if (typeof switchMpTab === "function") {
    switchMpTab(tabId);
  }
};

document.addEventListener("DOMContentLoaded", function () {
  loadManagerNotifications();

  if (!mpNotificationRefreshTimer) {
    mpNotificationRefreshTimer = setInterval(
      loadManagerNotifications,
      60000
    );
  }
});