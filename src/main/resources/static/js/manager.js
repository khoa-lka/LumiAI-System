// ==========================================================================
// MÃ NGUỒN XỬ LÝ GIAO DIỆN QUẢN LÝ RẠP (MANAGER)
// File: js/manager.js
// ==========================================================================
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
    window.location.href = "index.html";
    return;
  }

  // Nếu hợp lệ, tự động load danh sách phim
  const titleEl = document.getElementById("mp-dynamic-title");
  if (titleEl) titleEl.innerText = `Xin chào Manager: ${info.fullName}`;
  loadManagerMovies();
});

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
function switchMpTab(tabId) {
  // Ẩn tất cả tab section
  document.querySelectorAll(".mp-tab-section").forEach((tab) => {
    tab.style.display = "none";
    tab.classList.remove("active");
  });

  // Gỡ active trên thanh điều hướng sidebar
  document.querySelectorAll(".mp-nav-item").forEach((nav) => {
    nav.classList.remove("active");
  });

  // Bật tab được chọn
  const targetTab = document.getElementById("mp-tab-" + tabId);
  const targetNav = document.getElementById("mp-nav-" + tabId);

  if (targetTab) {
    targetTab.style.display = "block";
    targetTab.classList.add("active");
  }
  if (targetNav) targetNav.classList.add("active");

  // Cập nhật tiêu đề trang
  const titleElement = document.getElementById("mp-dynamic-title");
  if (titleElement) {
    const titles = {
      dashboard: "Tổng quan hoạt động rạp",
      movies: "Quản lý Danh mục Phim",
      matrix: "Ma trận Lịch chiếu",
      fnb: "Quản lý Kho F&B",
      promo: "Quản lý Chiến dịch Khuyến mãi",
      audit: "Báo cáo và Kiểm toán Tài chính",
    };
    titleElement.innerText = titles[tabId] || "Chức năng đang phát triển...";
  }

  // Nếu chuyển sang tab phim, tự động gọi API load danh sách phim
  if (tabId === "movies") {
    loadManagerMovies();
  }
  // Bổ sung vào cuối hàm switchMpTab của em:
  if (tabId === "fnb") {
    loadManagerFnb();
  }
}

// --- 2. QUẢN LÝ MODAL & POPUP (CÁC MODAL KHÁC) ---
function openMpDeleteModal() {
  const el = document.getElementById("mp-delete-modal");
  if (el) el.classList.add("open");
}
function closeMpDeleteModal() {
  const el = document.getElementById("mp-delete-modal");
  if (el) el.classList.remove("open");
}

function openCreatePromoModal() {
  const el = document.getElementById("mp-create-promo-modal");
  if (el) el.classList.add("open");
}
function closeCreatePromoModal() {
  const el = document.getElementById("mp-create-promo-modal");
  if (el) el.classList.remove("open");
}

// --- 3. ĐIỀU KHIỂN DROPDOWN (USER & NOTIFICATION) ---
function toggleUserDropdown() {
  const dropdown = document.getElementById("mp-user-dropdown");
  if (dropdown) dropdown.classList.toggle("open");
}

function toggleNotifDropdown() {
  const dropdown = document.getElementById("mp-notif-dropdown");
  if (dropdown) dropdown.classList.toggle("open");

  const bell = document.querySelector(".mp-bell");
  if (bell) bell.classList.remove("has-new"); // Xóa chấm đỏ khi xem thông báo
}

// LẮNG NGHE SỰ KIỆN CLICK TOÀN TRANG (GỘP CHUNG ĐÓNG DROPDOWN & MODAL)
window.addEventListener("click", function (event) {
  const userDropdown = document.getElementById("mp-user-dropdown");
  const userProfile = document.querySelector(".mp-profile");
  const notifDropdown = document.getElementById("mp-notif-dropdown");
  const bellIcon = document.querySelector(".mp-bell");
  const editMovieModal = document.getElementById("mp-edit-movie-modal");

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
    let statusClass = m.status === "now_showing" ? "active" : "inactive";
    let statusText = m.status === "now_showing" ? "Đang chiếu" : m.status === "coming_soon" ? "Sắp chiếu" : "Ngưng chiếu";
    let rowClass = m.status !== "now_showing" ? 'class="mp-row-inactive"' : "";
    let posterUrl = m.mainposter_url ? m.mainposter_url : "img/default-poster.jpg";

    tbody.innerHTML += `
      <tr ${rowClass}>
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
                  <button class="mp-action-btn" onclick="openViewMovie(${m.movieId})" title="Xem chi tiết">👁️</button>
                  <button class="mp-action-btn" onclick="openUpdateMovie(${m.movieId})" title="Sửa">✏️</button>
                  <button class="mp-action-btn" onclick="openMpDeleteModal(${m.movieId})" title="Xóa">🗑️</button>
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

        let statusClass = m.status === "now_showing" ? "active" : "inactive";
        let statusText = m.status === "now_showing" ? "Đang chiếu" : m.status === "coming_soon" ? "Sắp chiếu" : "Ngưng chiếu";
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
                        <button class="mp-action-btn" onclick="openViewMovie(${m.movieId})" title="Xem chi tiết">👁️</button>
                        <button class="mp-action-btn" onclick="openUpdateMovie(${m.movieId})" title="Sửa">✏️</button>
                        <button class="mp-action-btn" onclick="openMpDeleteModal(${m.movieId})" title="Xóa">🗑️</button>
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
      alert("✅ Thêm phim thành công!");
      closeAddMovie();
      loadManagerMovies();
    })
    .catch((err) => alert("Lỗi khi thêm phim: " + err));
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
      alert("✅ Cập nhật phim thành công!");
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
      alert("✅ Hệ thống đã gỡ phim thành công!");
      closeMpDeleteModal();
      loadManagerMovies();
    })
    .catch((err) => alert("Lỗi khi thực hiện xóa phim: " + err));
};

// ==========================================================================
// --- LOGIC XỬ LÝ XEM CHI TIẾT PHIM (CON MẮT 👁️) ---
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

  document.getElementById("view-status").innerText =
    movie.status === "now_showing" ? "Đang chiếu" : "Sắp chiếu";
  document.getElementById("view-status").style.color =
    movie.status === "now_showing" ? "#2e7d32" : "#f57c00";

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
  const dateBadge = document.getElementById("mp-current-date");
  if (dateBadge) {
    dateBadge.innerText = formattedDate;
  }
}

document.addEventListener("DOMContentLoaded", displayCurrentDate);

// ==========================================================================
// --- 7. BỘ CHỨC NĂNG QUẢN LÝ KHO F&B CHUYÊN NGHIỆP ---
// ==========================================================================

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

      items.forEach((item) => {
        // Tự động phân loại dựa theo từ khóa trong tên để hiển thị lên UI khớp thiết kế của em
        const nameLower = item.itemName.toLowerCase();
        let typeText = "Bắp rang";
        let icon = "🍿";
        if (nameLower.includes("combo")) { typeText = "Combo"; icon = "🎁"; }
        else if (nameLower.includes("nuoc") || nameLower.includes("coca")) { typeText = "Nước ngọt"; icon = "🥤"; }
        else if (nameLower.includes("khoai") || nameLower.includes("chien")) { typeText = "Đồ ăn vặt"; icon = "🍟"; }

        // Logic kiểm tra cảnh báo tồn kho thấp (Low Stock < 30 đơn vị)
        let stockHTML = `${item.stockQuantity} ly`;
        let rowStyle = "";
        if (item.stockQuantity <= 30) {
          rowStyle = 'style="background-color: #fff8f8;"';
          stockHTML = `<strong>${item.stockQuantity}</strong> <span class="mp-badge-lowstock" style="background:#fff3e0; color:#e65100; font-size:10px; padding:2px 4px; border-radius:3px; margin-left:5px;">Tồn thấp</span>`;
        }

        tbody.innerHTML += `
          <tr ${rowStyle}>
              <td style="text-align: center;"><input type="checkbox" value="${item.foodItemId}" /></td>
              <td style="text-align: center;"><div style="font-size: 22px">${icon}</div></td>
              <td><strong>${item.itemName}</strong></td>
              <td>${typeText}</td>
              <td style="text-align: right; font-weight: bold; color:#b71c1c;">${item.price.toLocaleString("vi-VN")} đ</td>
              <td style="text-align: center;">${stockHTML}</td>
              <td style="text-align: center;">
                  <div class="mp-table-actions" style="display:flex; gap:5px; justify-content:center;">
                      <button class="mp-action-btn" onclick="openEditFnbModal(${item.foodItemId})" style="cursor:pointer;" title="Sửa thông tin">✏️ Sửa</button>
                      <button class="mp-action-btn" onclick="submitDeleteFnb(${item.foodItemId})" style="cursor:pointer; background:#fff0f0; color:#d32f2f;" title="Xóa">🗑️ Xóa</button>
                  </div>
              </td>
          </tr>
        `;
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
        alert("✅ Đã cập nhật sản phẩm F&B thành công!");
        closeFnbModal();
        loadManagerFnb();
      })
      .catch(err => alert("Lỗi khi sửa bắp nước: " + err.message));
  } else {
    // Nếu ID trống -> Gọi API thêm sản phẩm mới vào DB
    API.addFnbItem(fnbData)
      .then(() => {
        alert("✅ Đã thêm sản phẩm mới vào kho thành công!");
        closeFnbModal();
        loadManagerFnb();
      })
      .catch(err => alert("Lỗi khi thêm bắp nước: " + err.message));
  }
};

// Hàm xử lý kích hoạt xóa sản phẩm
window.submitDeleteFnb = function(id) {
  if (confirm("⚠️ Bạn có chắc chắn muốn gỡ sản phẩm bắp nước này ra khỏi kho hệ thống không?")) {
    API.deleteFnbItem(id)
      .then(() => {
        alert("✅ Đã xóa sản phẩm khỏi kho thành công!");
        loadManagerFnb();
      })
      .catch(err => alert("Thất bại! Sản phẩm này đang dính vào lịch sử hóa đơn đặt vé cũ nên không thể xóa vật lý."));
  }
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
    const nameLower = (item.itemName || "").toLowerCase();
    let currentType = "bap";
    if (nameLower.includes("combo")) currentType = "combo";
    else if (nameLower.includes("nuoc") || nameLower.includes("coca")) currentType = "nuoc";
    else if (nameLower.includes("khoai") || nameLower.includes("chien")) currentType = "anvat";

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

// Hàm tái render bảng dữ liệu sau khi lọc (Đảm bảo giữ nguyên cấu trúc icon, tồn kho thấp của em)
function renderFilteredFnbTable(items) {
  const tbody = document.getElementById("mp-fnb-tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (!items || items.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:#888; padding:15px;">Không tìm thấy sản phẩm bắp nước nào khớp với bộ lọc!</td></tr>';
    return;
  }

  items.forEach((item) => {
    const nameLower = item.itemName.toLowerCase();
    let typeText = "Bắp rang";
    let icon = "🍿";
    if (nameLower.includes("combo")) { typeText = "Combo"; icon = "🎁"; }
    else if (nameLower.includes("nuoc") || nameLower.includes("coca")) { typeText = "Nước ngọt"; icon = "🥤"; }
    else if (nameLower.includes("khoai") || nameLower.includes("chien")) { typeText = "Đồ ăn vặt"; icon = "🍟"; }

    let stockHTML = `${item.stockQuantity} ly`;
    let rowStyle = "";
    if (item.stockQuantity <= 30) {
      rowStyle = 'style="background-color: #fff8f8;"';
      stockHTML = `<strong>${item.stockQuantity}</strong> <span class="mp-badge-lowstock" style="background:#fff3e0; color:#e65100; font-size:10px; padding:2px 4px; border-radius:3px; margin-left:5px;">Tồn thấp</span>`;
    }

    tbody.innerHTML += `
      <tr ${rowStyle}>
          <td style="text-align: center;"><input type="checkbox" value="${item.foodItemId}" /></td>
          <td style="text-align: center;"><div style="font-size: 22px">${icon}</div></td>
          <td><strong>${item.itemName}</strong></td>
          <td>${typeText}</td>
          <td style="text-align: right; font-weight: bold; color:#b71c1c;">${item.price.toLocaleString("vi-VN")} đ</td>
          <td style="text-align: center;">${stockHTML}</td>
          <td style="text-align: center;">
              <div class="mp-table-actions" style="display:flex; gap:5px; justify-content:center;">
                  <button class="mp-action-btn" onclick="openEditFnbModal(${item.foodItemId})" style="cursor:pointer;" title="Sửa thông tin">✏️ Sửa</button>
                  <button class="mp-action-btn" onclick="submitDeleteFnb(${item.foodItemId})" style="cursor:pointer; background:#fff0f0; color:#d32f2f;" title="Xóa">🗑️ Xóa</button>
              </div>
          </td>
      </tr>
    `;
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
    alert("✨ Tất cả sản phẩm trong kho đều đang ở mức an toàn (>30 ly). Không cần tái cung ứng!");
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
        alert("✅ Chiến dịch tái cung ứng hoàn tất! Toàn bộ sản phẩm tồn thấp đã được đưa về mức an toàn.");
        loadManagerFnb(); // Tải lại bảng để cập nhật số lượng mới
      })
      .catch(err => {
        console.error("Lỗi tái cung ứng:", err);
        alert("🚨 Có lỗi xảy ra trong quá trình cập nhật kho hàng: " + err.message);
      });
  }
};

// --- CHỨC NĂNG 2: NHẬP HÀNG NHANH (QUICK RESTOCK) ---
window.openQuickRestockModal = function() {
  if (!window.fnbItemsList || window.fnbItemsList.length === 0) {
    alert("Kho hàng trống, vui lòng thêm sản phẩm mới trước!");
    return;
  }

  // Tận dụng Modal Form điền dữ liệu có sẵn của Khoa để làm form nhập nhanh
  // Tìm một sản phẩm bất kỳ hoặc mở modal chỉnh số lượng tồn kho
  const itemId = prompt("Nhập mã ID sản phẩm F&B bạn muốn nhập thêm hàng vào kho:", "");
  if (!itemId) return;

  const item = window.fnbItemsList.find(x => String(x.foodItemId) === String(itemId).trim());
  if (!item) {
    alert("❌ Không tìm thấy sản phẩm nào mang ID #" + itemId);
    return;
  }

  const addQtyStr = prompt(`Sản phẩm: ${item.itemName}\nTồn kho hiện tại: ${item.stockQuantity} ly\n\nNhập số lượng bạn muốn CỘNG THÊM vào kho:`, "50");
  if (!addQtyStr) return;

  const addQty = parseInt(addQtyStr) || 0;
  if (addQty <= 0) {
    alert("Số lượng nhập kho phải lớn hơn 0!");
    return;
  }

  const fnbData = {
    itemName: item.itemName,
    price: item.price,
    stockQuantity: item.stockQuantity + addQty // Cộng dồn số lượng mới vào số lượng cũ
  };

  // Gửi request cập nhật lên Spring Boot
  API.updateFnbItem(item.foodItemId, fnbData)
    .then(() => {
      alert(`✅ Nhập hàng thành công! Đã cộng thêm ${addQty} đơn vị vào sản phẩm ${item.itemName}.`);
      loadManagerFnb();
    })
    .catch(err => alert("Lỗi khi nhập hàng: " + err.message));
};

// ==========================================================================
// 🚀 ENGINE XỬ LÝ MA TRẬN LỊCH CHIẾU ĐỘNG & CHECK CONFLICT TỰ ĐỘNG
// ==========================================================================

window.loadManagerMatrix = function() {
  const dateInput = document.getElementById("mp-matrix-date-input");
  const trackRoom1 = document.getElementById("matrix-track-room-1");
  const trackRoom2 = document.getElementById("matrix-track-room-2");

  if (!trackRoom1 || !trackRoom2) return;

  // 1. Tự động mồi ngày hôm nay nếu Manager chưa chọn ngày cụ thể
  if (dateInput && !dateInput.value) {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    dateInput.value = `${y}-${m}-${d}`;
  }

  const selectedDate = dateInput.value;
  trackRoom1.innerHTML = '<p style="color:#777;font-size:12px;padding:15px;">Đang quét phòng 1...</p>';
  trackRoom2.innerHTML = '<p style="color:#777;font-size:12px;padding:15px;">Đang quét phòng 2...</p>';

  // 2. Chặn lỗi: Nếu danh sách phim trống, gọi nạp phim trước rồi chạy lại
  if (!window.moviesList || window.moviesList.length === 0) {
    API.getMovies()
      .then((movies) => {
        window.moviesList = movies;
        window.loadManagerMatrix();
      })
      .catch((err) => {
        trackRoom1.innerHTML = trackRoom2.innerHTML = `<span style="color:red;">Lỗi tải phim: ${err.message}</span>`;
      });
    return;
  }

  // 3. THUẬT TOÁN QUÉT ĐA LUỒNG PROMISE: Gom suất chiếu của TẤT CẢ các phim trong ngày
  const fetchPromises = window.moviesList.map((movie) => {
    return API.getShowtimes(movie.movieId, selectedDate)
      .then((resData) => {
        const rawShowtimes = resData.showtimes || [];
        // Đính kèm tên phim vào từng suất chiếu để UI hiển thị được tiêu đề
        return rawShowtimes.map(st => ({
          ...st,
          movieTitle: movie.title
        }));
      })
      .catch(() => []); // Bọc lỗi phòng trường hợp có phim chưa được xếp lịch
  });

  Promise.all(fetchPromises)
    .then((allResults) => {
      // Gộp tất cả các mảng suất chiếu riêng lẻ thành 1 mảng tổng duy nhất
      let globalShowtimes = allResults.flat();

      // 4. THUẬT TOÁN TỰ ĐỘNG KIỂM TRA XUNG ĐỘT (CONFLICT DETECTOR)
      // Hàm chuyển đổi chuỗi "HH:mm" ra số phút tuyệt đối trong ngày để so sánh toán học
      const timeToMinutes = (timeStr) => {
        const [h, m] = timeStr.split(":").map(Number);
        return h * 60 + m;
      };

      globalShowtimes.forEach((currentSt) => {
        currentSt.isConflict = false; // Mặc định ban đầu là không trùng
        
        const currentStart = timeToMinutes(currentSt.startTime);
        const currentEnd = timeToMinutes(currentSt.endTime);

        globalShowtimes.forEach((otherSt) => {
          // Chỉ check nếu trùng phòng chiếu công vật lý và không phải là chính nó
          if (currentSt.showtimeId !== otherSt.showtimeId && currentSt.roomId === otherSt.roomId) {
            const otherStart = timeToMinutes(otherSt.startTime);
            const otherEnd = timeToMinutes(otherSt.endTime);

            // Công thức kiểm tra khoảng thời gian giao nhau đè lên nhau
            if (currentStart < otherEnd && currentEnd > otherStart) {
              currentSt.isConflict = true;
            }
          }
        });
      });

      // 5. TIẾN HÀNH VẼ GIAO DIỆN (RENDER TRACK BLOCKS)
      trackRoom1.innerHTML = "";
      trackRoom2.innerHTML = "";

      if (globalShowtimes.length === 0) {
        trackRoom1.innerHTML = trackRoom2.innerHTML = '<div class="mp-gap-text" style="position:static;padding:15px;color:#999;font-size:12px;text-align:center;">Trống lịch. Chưa xếp suất chiếu nào trong ngày này!</div>';
        return;
      }

      // Tổng số phút từ 08:00 đến 23:00 là 15 tiếng = 900 phút (Mốc 100% chiều rộng)
      const TIMELINE_START_MINUTES = 8 * 60; // 480 phút
      const TIMELINE_TOTAL_MINUTES = 15 * 60; // 900 phút

      globalShowtimes.forEach((st) => {
        const startMin = timeToMinutes(st.startTime);
        const endMin = timeToMinutes(st.endTime);
        const durationMin = endMin - startMin;

        // Tính tọa độ vị trí bắt đầu (Left) và độ dài khối phim (Width) theo tỉ lệ %
        let leftPercent = ((startMin - TIMELINE_START_MINUTES) / TIMELINE_TOTAL_MINUTES) * 100;
        let widthPercent = (durationMin / TIMELINE_TOTAL_MINUTES) * 100;

        // Bọc lót an toàn nếu suất chiếu nằm ngoài khung 08:00 - 23:00
        if (leftPercent < 0) leftPercent = 0;
        if (leftPercent + widthPercent > 100) widthPercent = 100 - leftPercent;

        // Xác định màu sắc: Nếu conflict -> đỏ lòm, phòng 2 IMAX -> vàng, phòng 1 Standard -> xanh dương
        let blockClass = st.roomId === 2 ? "mp-bg-yellow" : "mp-bg-blue";
        let conflictHTML = "";

        if (st.isConflict) {
          blockClass = "mp-bg-red mp-conflict-box";
          conflictHTML = `
            <div class="mp-conflict-tooltip">
                <div class="mp-icon-error">!</div>
                <div>
                  <strong>Xung đột lịch chiếu!</strong><br />
                  <span style="font-weight: normal; color: #ffcdd2">Trùng giờ với suất khác trong phòng!</span>
                </div>
            </div>
          `;
        }

        const blockHTML = `
          <div class="mp-track-block ${blockClass}" style="left: ${leftPercent}%; width: ${widthPercent}%; min-width: 50px;" title="${st.movieTitle} (${st.startTime} - ${st.endTime})">
              ${conflictHTML}
              <strong>${st.movieTitle}</strong><br />
              <span style="font-size:10px;">${st.startTime} - ${st.endTime}</span>
          </div>
        `;

        // Phân phối khối HTML về đúng hàng phòng chiếu
        if (st.roomId === 2) {
          trackRoom2.innerHTML += blockHTML;
        } else {
          trackRoom1.innerHTML += blockHTML;
        }
      });

      // Nếu có hàng nào trống sau khi phân phối thì ghi chữ trống lịch cho đẹp
      if (trackRoom1.innerHTML === "") trackRoom1.innerHTML = '<div class="mp-gap-text" style="position:static;padding:15px;color:#bbb;">Trống lịch phòng 1</div>';
      if (trackRoom2.innerHTML === "") trackRoom2.innerHTML = '<div class="mp-gap-text" style="position:static;padding:15px;color:#bbb;">Trống lịch phòng 2</div>';
    })
    .catch((err) => {
      console.error("🚨 Lỗi vẽ ma trận lịch chiếu:", err);
      trackRoom1.innerHTML = trackRoom2.innerHTML = `<span style="color:red;padding:10px;display:block;">Lỗi đồng bộ lịch chiếu: ${err.message}</span>`;
    });
};

// ==========================================================================
// 🚀 LOGIC ĐIỀU KHIỂN FORM TẠO MỚI SUẤT CHIẾU ĐỘNG
// ==========================================================================

// Hàm mở Modal và tự động cào danh sách phim thật từ DB đổ vào ô Dropdown chọn phim
window.openAddShowtimeModal = function() {
  const movieSelect = document.getElementById("st-movie-select");
  if (!movieSelect) return;

  movieSelect.innerHTML = "";
  
  // Kiểm tra mảng phim toàn cục đã lưu từ database
  if (!window.moviesList || window.moviesList.length === 0) {
    alert("Không tìm thấy danh sách phim trong bộ nhớ! Đang tải lại...");
    return;
  }

  // Duyệt qua danh sách phim động để nạp vào Form
  window.moviesList.forEach(m => {
    movieSelect.innerHTML += `<option value="${m.movieId}">${m.title} (${m.duration || m.durationMinutes || 0} phút)</option>`;
  });

  // Reset các ô nhập liệu về trạng thái trống sạch sẽ
  document.getElementById("st-start-time").value = "";
  document.getElementById("st-ticket-price").value = "90000";

  document.getElementById("mp-add-showtime-modal").style.display = "flex";
};

window.closeAddShowtimeModal = function() {
  document.getElementById("mp-add-showtime-modal").style.display = "none";
};

// Hàm đóng gói dữ liệu và đẩy xuống SQL Server thông qua Spring Boot
window.submitAddShowtimeForm = function() {
  const movieId = document.getElementById("st-movie-select").value;
  const roomId = parseInt(document.getElementById("st-room-select").value) || 1;
  const startTimeRaw = document.getElementById("st-start-time").value; // Định dạng "HH:mm"
  const ticketPrice = parseFloat(document.getElementById("st-ticket-price").value) || 0;
  
  // Bốc lấy ngày mà Manager đang xem ở ô input date ngoài ma trận lịch chiếu
  const selectedDate = document.getElementById("mp-matrix-date-input").value;

  if (!startTimeRaw) {
    alert("Vui lòng chọn Giờ bắt đầu chiếu phim!");
    return;
  }
  if (ticketPrice <= 0) {
    alert("Giá vé cơ bản phải lớn hơn 0 đ!");
    return;
  }

  // Định dạng lại mốc thời gian ISO chuẩn LocalDateTime gửi cho Java nhận diện: "YYYY-MM-DDTHH:mm:00"
  const formattedStartTime = `${selectedDate}T${startTimeRaw}:00`;

  // Tìm phim tương ứng để lấy thời lượng tự động tính toán giờ kết thúc (endTime) cho Java
  const targetMovie = window.moviesList.find(m => String(m.movieId) === String(movieId));
  const duration = targetMovie ? (targetMovie.duration || targetMovie.durationMinutes || 120) : 120;
  
  // Tính toán thời điểm kết thúc dựa trên giờ bắt đầu và thời lượng phim bằng Javascript
  const startDateTime = new Date(`${selectedDate} ${startTimeRaw}`);
  const endDateTime = new Date(startDateTime.getTime() + duration * 60000);
  
  const endH = String(endDateTime.getHours()).padStart(2, "0");
  const endM = String(endDateTime.getMinutes()).padStart(2, "0");
  const formattedEndTime = `${selectedDate}T${endH}:${endM}:00`;

  // Đóng gói Dữ liệu JSON khớp chuẩn 100% với Entity Showtime.java của nhóm em
  const payload = {
    movie: { movieId: parseInt(movieId) }, // Khớp cấu trúc @ManyToOne Private Movie movie
    roomId: roomId,
    startTime: formattedStartTime, // "2026-06-20T19:00:00"
    endTime: formattedEndTime,     // "2026-06-20T21:00:00"
    ticketPrice: ticketPrice,
    createdBy: 1
  };

  console.log("🚀 Payload gửi lên Spring Boot tạo suất chiếu:", payload);

  // ==========================================================================
  // 🚨 POPUP CHẶN TRÙNG LỊCH (BẰNG DATA ĐỘNG - KHÔNG XÀI DOM - GIỮ NGUYÊN CẤU TRÚC CỦA KHOA)
  // ==========================================================================
  const timeToMinutes = (timeStr) => {
    const [h, m] = timeStr.split(":").map(Number);
    return h * 60 + m;
  };

  const newStartMin = timeToMinutes(startTimeRaw);
  const newEndMin = newStartMin + duration;

  // Gọi nhanh API gom lại danh sách để so sánh chéo, đảm bảo không lệch một phút nào với DB
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
        // Chỉ check nếu trùng phòng chiếu
        if (st.roomId === roomId) {
          const existStart = timeToMinutes(st.startTime);
          const existEnd = timeToMinutes(st.endTime);

          // Công thức giao thoa: Start1 < End2 AND End1 > Start2
          if (newStartMin < existEnd && newEndMin > existStart) {
            isTimeConflict = true;
            conflictMovieTitle = st.movieTitle;
            break;
          }
        }
      }

      if (isTimeConflict) {
        alert(`❌ KHÔNG THỂ XẾP LỊCH!\n\nThời gian bạn chọn (${startTimeRaw} - ${endH}:${endM}) đã bị trùng/giao thoa với phim "${conflictMovieTitle}" trong cùng Phòng ${roomId}.\nVui lòng chọn khung giờ khác!`);
        return; // Chặn đứng tại đây, không cho gọi API add
      }

      // Nếu an toàn, thực hiện gọi API lưu xuống database y như cũ của em
      API.addShowtime(payload)
        .then(() => {
          alert("✅ Xếp lịch chiếu mới thành công! Suất chiếu đã được lưu xuống SQL Server.");
          closeAddShowtimeModal();
          loadManagerMatrix();
        })
        .catch((err) => {
          console.error(err);
          alert("🚨 Thêm suất chiếu thất bại: " + err.message);
        });
    })
    .catch((err) => {
      console.error("Lỗi khi kiểm tra trùng lịch:", err);
      alert("🚨 Không thể xác thực trùng lịch do lỗi kết nối!");
    });
};