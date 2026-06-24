// ==========================================================================
// MÃ NGUỒN XỬ LÝ GIAO DIỆN QUẢN LÝ RẠP (MANAGER)
// File: js/manager.js
// ==========================================================================
window.addEventListener("DOMContentLoaded", () => {
  const isLoggedIn = sessionStorage.getItem("isLoggedIn");
  const roleId = sessionStorage.getItem("roleId");

  // Nếu chưa đăng nhập hoặc không phải Manager -> Đuổi về trang chủ
  if (!isLoggedIn || parseInt(roleId) !== 1) {
    alert("CẢNH BÁO: Khu vực nội bộ! Bạn không có quyền truy cập.");
    window.location.href = "index.html";
    return;
  }

  // Nếu hợp lệ, tự động load danh sách phim
  const titleEl = document.getElementById("mp-dynamic-title");
  if (titleEl)
    titleEl.innerText = `Xin chào Manager: ${sessionStorage.getItem("fullName")}`;
  loadManagerMovies();
});

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

  movies.forEach((m) => {
    let ageBadgeClass =
      m.ageRating >= 18 ? "c18" : m.ageRating >= 13 ? "c13" : "p";
    let ageText = m.ageRating === 0 ? "P" : `T${m.ageRating}`;
    let statusClass = m.status === "now_showing" ? "active" : "inactive";
    let statusText =
      m.status === "now_showing"
        ? "Đang chiếu"
        : m.status === "coming_soon"
          ? "Sắp chiếu"
          : "Ngưng chiếu";
    let rowClass = m.status !== "now_showing" ? 'class="mp-row-inactive"' : "";
    let posterUrl = m.mainposter_url
      ? m.mainposter_url
      : "img/default-poster.jpg";

    tbody.innerHTML += `
        <tr ${rowClass}>
            <td style="text-align: center;">${m.movieId}</td>
            <td>
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

  // 🌟 ĐÃ SỬA: Dùng chuẩn xác hàm API.getMovies() của em để không bị lỗi biến mất phim
  API.getMovies()
    .then((movies) => {
      tbody.innerHTML = "";
      window.moviesList = movies; // Lưu tạm danh sách phim vào biến toàn cục để dùng cho việc sửa phim
      movies.forEach((m) => {
        let ageBadgeClass =
          m.ageRating >= 18 ? "c18" : m.ageRating >= 13 ? "c13" : "p";
        let ageText = m.ageRating === 0 ? "P" : `T${m.ageRating}`;

        let statusClass = m.status === "now_showing" ? "active" : "inactive";
        let statusText =
          m.status === "now_showing"
            ? "Đang chiếu"
            : m.status === "coming_soon"
              ? "Sắp chiếu"
              : "Ngưng chiếu";
        let rowClass =
          m.status !== "now_showing" ? 'class="mp-row-inactive"' : "";

        let posterUrl = m.mainposter_url
          ? m.mainposter_url
          : "img/default-poster.jpg";

        // CHÚ Ý: Chỗ onClick nút Sửa phim đã được chuẩn hóa
        tbody.innerHTML += `
            <tr ${rowClass}>
                <td style="text-align: center;">${m.movieId}</td>
                <td>
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
