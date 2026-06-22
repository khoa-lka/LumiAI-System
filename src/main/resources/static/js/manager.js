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
  document.getElementById("mp-dynamic-title").innerText =
    `Xin chào Manager: ${sessionStorage.getItem("fullName")}`;
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

// --- 2. QUẢN LÝ MODAL & POPUP ---
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

function openAddMovie() {
  const el = document.getElementById("mp-add-movie-modal");
  if (el) el.classList.add("open");
}
function closeAddMovie() {
  const el = document.getElementById("mp-add-movie-modal");
  if (el) el.classList.remove("open");
}

function openEditMovie() {
  const el = document.getElementById("mp-edit-movie-modal");
  if (el) {
    // Điền dữ liệu vào form
    document.getElementById("edit-movie-id").value = movieObj.id;
    document.getElementById("edit-movie-title").value = movieObj.title;
    document.getElementById("edit-movie-status").value = movieObj.status;

    el.classList.add("open");
  }
}
function closeEditMovie() {
  const el = document.getElementById("mp-edit-movie-modal");
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

// Lắng nghe sự kiện click toàn trang để đóng dropdown nếu bấm ra ngoài
window.addEventListener("click", function (event) {
  const userDropdown = document.getElementById("mp-user-dropdown");
  const userProfile = document.querySelector(".mp-profile");
  const notifDropdown = document.getElementById("mp-notif-dropdown");
  const bellIcon = document.querySelector(".mp-bell");

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
});

// ==========================================================================
// --- 4. GIAO TIẾP DATABASE (GỌI QUA api.js) ---
// ==========================================================================

// Hàm tải danh sách phim cho bảng Quản lý
function loadManagerMovies() {
  const tbody = document.getElementById("mp-movies-tbody");
  if (!tbody) return;

  // Hiện chữ Đang tải...
  tbody.innerHTML =
    '<tr><td colspan="8" style="text-align:center;">Đang tải danh sách phim từ Database...</td></tr>';

  API.getMovies()
    .then((movies) => {
      tbody.innerHTML = ""; // Xóa chữ đang tải

      movies.forEach((m) => {
        // Xử lý huy hiệu độ tuổi (P, C13, C16, C18)
        let ageBadgeClass =
          m.ageRating >= 18 ? "c18" : m.ageRating >= 13 ? "c13" : "p";
        let ageText = m.ageRating === 0 ? "P" : `T${m.ageRating}`;

        // Xử lý trạng thái (now_showing, coming_soon, end_showing)
        let statusClass = m.status === "now_showing" ? "active" : "inactive";
        let statusText =
          m.status === "now_showing"
            ? "Đang chiếu"
            : m.status === "coming_soon"
              ? "Sắp chiếu"
              : "Ngưng chiếu";
        let rowClass =
          m.status !== "now_showing" ? 'class="mp-row-inactive"' : "";

        // Xử lý ảnh rỗng
        let posterUrl = m.mainposterUrl
          ? m.mainposterUrl
          : "img/default-poster.jpg";

        // Đổ HTML động
        tbody.innerHTML += `
                    <tr ${rowClass}>
                        <td style="text-align: center;">${m.movieId}</td>
                        <td>
                            <div class="mp-movie-info">
                                <img src="${posterUrl}" class="mp-movie-poster" alt="${m.title}">
                                <div>
                                    <div class="mp-movie-title-vn">${m.title}</div>
                                    <div class="mp-movie-title-en">${m.genre || "Đang cập nhật"}</div>
                                </div>
                            </div>
                        </td>
                        <td>${m.durationMinutes} phút</td>
                        <td>
                            <div class="mp-age-badges">
                                <span class="mp-badge ${ageBadgeClass}">${ageText}</span>
                            </div>
                        </td>
                        <td>${m.country || "N/A"}</td>
                        <td><span class="mp-status ${statusClass}">${statusText}</span></td>
                        <td>${m.releaseDate || "N/A"}</td>
                        <td>
                            <div class="mp-table-actions">
                                <button class="mp-action-btn" title="Xem chi tiết">👁️</button>
                                <button class="mp-action-btn" onclick='openEditMovie(${JSON.stringify(m)})' title="Sửa">✏️</button>
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

// Hàm gửi dữ liệu Cập nhật phim (Gọi khi bấm nút LƯU trong Modal Sửa Phim)
function submitEditMovieAction(event) {
  if (event) event.preventDefault();

  // Giả định em có form với các ID tương ứng
  // const title = document.getElementById("edit-movie-title").value;

  // Payload mẫu gửi xuống backend
  const updatedMovieData = {
    // title: title
  };

  if (typeof API !== "undefined") {
    API.updateMovie(updatedMovieData)
      .then((data) => {
        alert("Cập nhật phim thành công: " + (data.message || ""));
        closeEditMovie();
        loadManagerMovies(); // Tải lại bảng ngay lập tức
      })
      .catch((err) => {
        alert("Sự cố cập nhật phim: " + err.message);
      });
  } else {
    alert("Lỗi: Không tìm thấy api.js");
  }
}
