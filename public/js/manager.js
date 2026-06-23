// ==========================================================================
// MÃ NGUỒN XỬ LÝ GIAO DIỆN QUẢN LÝ RẠP (MANAGER)
// ==========================================================================

// --- CHUYỂN TAB TRONG MANAGER DASHBOARD ---
function switchMpTab(tabId) {
    // 1. Ẩn tất cả nội dung tab
    document.querySelectorAll('.mp-tab-section').forEach(tab => {
        tab.style.display = 'none';
        tab.classList.remove('active');
    });
    
    // 2. Gỡ highlight tất cả item trên sidebar
    document.querySelectorAll('.mp-nav-item').forEach(nav => {
        nav.classList.remove('active');
    });

    // 3. Kích hoạt tab và menu tương ứng được chọn
    const targetTab = document.getElementById('mp-tab-' + tabId);
    const targetNav = document.getElementById('mp-nav-' + tabId);
    
    if (targetTab) {
        targetTab.style.display = 'block';
        targetTab.classList.add('active');
    }
    if (targetNav) targetNav.classList.add('active');

    // 4. Cập nhật động Tiêu đề header trên cùng
    const titleElement = document.getElementById('mp-dynamic-title');
    if (titleElement) {
        if (tabId === 'dashboard') titleElement.innerText = "Tổng quan hoạt động rạp";
        else if (tabId === 'movies') titleElement.innerText = "Quản lý Danh mục Phim";
        else if (tabId === 'matrix') titleElement.innerText = "Ma trận Lịch chiếu";
        else if (tabId === 'fnb') titleElement.innerText = "Quản lý Kho F&B"; 
        else if (tabId === 'promo') titleElement.innerText = "Quản lý Chiến dịch Khuyến mãi";
        else if (tabId === 'audit') titleElement.innerText = "Báo cáo và Kiểm toán Tài chính";
        else titleElement.innerText = "Chức năng đang phát triển...";
    }
}

// --- XỬ LÝ MODAL XÓA PHIM CỦA MANAGER ---
function openMpDeleteModal() {
    const deleteModal = document.getElementById('mp-delete-modal');
    if (deleteModal) deleteModal.classList.add('open');
}

function closeMpDeleteModal() {
    const deleteModal = document.getElementById('mp-delete-modal');
    if (deleteModal) deleteModal.classList.remove('open');
}
// --- XỬ LÝ MODAL THÊM VOUCHER CỦA MANAGER ---

function openCreatePromoModal() { document.getElementById('mp-create-promo-modal').classList.add('open'); }
    function closeCreatePromoModal() { document.getElementById('mp-create-promo-modal').classList.remove('open'); }

    //---POP UP NOTIFICATION---
function toggleNotifDropdown() {
    const dropdown = document.getElementById('mp-notif-dropdown');
    dropdown.classList.toggle('open');
    
    // Nếu mở lên thì xóa chấm đỏ (nếu bạn có thêm class chấm đỏ)
    const bell = document.querySelector('.mp-bell');
    bell.classList.remove('has-new'); 
}

    // --- ĐIỀU KHIỂN MENU TÀI KHOẢN (USER DROPDOWN) ---
function toggleUserDropdown() {
    const dropdown = document.getElementById('mp-user-dropdown');
    if (dropdown) {
        dropdown.classList.toggle('open');
    }
}

// Đóng menu nếu click ra ngoài
window.addEventListener('click', function(e) {
    const dropdown = document.getElementById('mp-user-dropdown');
    const profile = document.querySelector('.mp-profile');
    if (dropdown && !profile.contains(e.target)) {
        dropdown.classList.remove('open');
    }
});
// --- ĐIỀU KHIỂN POPUP THÊM PHIM ---
function openAddMovie() { document.getElementById('mp-add-movie-modal').classList.add('open'); }
function closeAddMovie() { document.getElementById('mp-add-movie-modal').classList.remove('open'); }

// --- ĐIỀU KHIỂN DROPDOWN TÀI KHOẢN (CẢNH 3) ---
function toggleUserDropdown() {
    const dropdown = document.getElementById('mp-user-dropdown');
    dropdown.classList.toggle('open');
}

// Đóng popup khi bấm ra ngoài
window.onclick = function(event) {
    const userModal = document.getElementById('mp-user-dropdown');
    if (userModal && !event.target.matches('.mp-profile') && !event.target.closest('.mp-profile')) {
        userModal.classList.remove('open');
    }
}
// --- ĐIỀU KHIỂN POPUP CHỈNH SỬA PHIM ---
function openEditMovie() { 
    document.getElementById('mp-edit-movie-modal').classList.add('open'); 
}
function closeEditMovie() { 
    document.getElementById('mp-edit-movie-modal').classList.remove('open'); 
}

// --- LOGIC GỌI TỪ DÒNG PHIM (Cần sửa lại nút Edit trong HTML cũ) ---
// Bạn nhớ thêm onclick="openEditMovie()" vào thẻ button icon cây bút trong bảng Phim nhé!
function toggleNotifDropdown() {
    const dropdown = document.getElementById('mp-notif-dropdown');
    dropdown.classList.toggle('open');
    
    // Khi mở thông báo, ta xóa cái chấm đỏ (nếu bạn gắn class 'has-new')
    const bell = document.querySelector('.mp-bell');
    if(bell) bell.classList.remove('has-new');
}

// Thêm logic đóng dropdown khi click ra ngoài
document.addEventListener('click', function(event) {
    const dropdown = document.getElementById('mp-notif-dropdown');
    const bell = document.querySelector('.mp-bell');
    if (dropdown && !bell.contains(event.target) && !dropdown.contains(event.target)) {
        dropdown.classList.remove('open');
    }
});