/* ==========================================================================
   THANH ĐIỀU HƯỚNG (BREADCRUMB) - BỘ ĐIỀU KHIỂN THỐNG NHẤT
   --------------------------------------------------------------------------
   File này nạp SAU CÙNG. Nó "bọc" (wrap) các hàm điều hướng sẵn có
   (switchCgvTab, goToBookingStep, goHomeFromBc) để:
     1. Luôn cập nhật đúng vị trí người dùng đang đứng.
     2. Quản lý một ngăn xếp điều hướng (nav stack) sạch, không lệch.
     3. Cho nút "Quay lại" hoạt động chính xác ở mọi trang.
   KHÔNG đổi tên hàm/ID nào => không ảnh hưởng kết nối Back-end.
   ========================================================================== */
(function () {
  "use strict";

  // Bản đồ nhãn: mỗi panel -> { parent, current }
  var LABELS = {
    "panel-movies": { parent: "Phim", current: "Danh Sách Phim" },
    "panel-movie-detail": { parent: "Phim", current: "Chi Tiết Phim" },
    "panel-booking": { parent: "Đặt Vé Trực Tuyến", current: "Chọn Ghế Ngồi" },
    "panel-news": { parent: "Ưu Đãi", current: "Sự kiện & Ưu đãi" },
    "panel-news-detail": { parent: "Ưu Đãi", current: "Chi Tiết Ưu Đãi" },
    "panel-profile": { parent: "Thành Viên", current: "Tài Khoản LAS" },
    "panel-about": { parent: "Giới Thiệu", current: "Về LAS Cinemas" },
    "panel-terms": { parent: "Hỗ Trợ", current: "Điều Khoản Chung" },
    "panel-transaction-terms": { parent: "Hỗ Trợ", current: "Điều Khoản Giao Dịch" },
    "panel-privacy-policy": { parent: "Hỗ Trợ", current: "Chính Sách Bảo Mật" },
    "panel-cinema-rules": { parent: "Hỗ Trợ", current: "Nội Quy Rạp" },
    "panel-faq": { parent: "Hỗ Trợ", current: "Câu Hỏi Thường Gặp" },
  };

  // Nhãn cho từng bước trong luồng đặt vé
  var BOOKING_STEP_LABELS = {
    1: "Chọn Ghế Ngồi",
    2: "Chọn Combo & Bắp Nước",
    3: "Thanh Toán",
    4: "Hoàn Tất Đặt Vé",
  };

  // Ngăn xếp điều hướng riêng (đáng tin cậy). Bắt đầu ở trang chủ.
  var navStack = ["panel-movies"];
  var isBackNavigating = false; // cờ báo đang bấm "Quay lại" để không đẩy trùng
  var currentPanel = "panel-movies";

  function el(id) {
    return document.getElementById(id);
  }

  // Cập nhật giao diện thanh điều hướng theo panel hiện tại
  function renderBreadcrumb(panelId, filterType) {
    var map = LABELS[panelId];
    var parentEl = el("bc-parent-text");
    var currentEl = el("bc-current-text");
    var backBtn = el("bc-back-btn");

    if (map) {
      var currentLabel = map.current;

      // Trang phim: phản ánh bộ lọc Đang chiếu / Sắp chiếu
      if (panelId === "panel-movies") {
        var f = filterType || window.currentMovieFilter || "now_showing";
        currentLabel = f === "coming_soon" ? "Phim Sắp Chiếu" : "Phim Đang Chiếu";
      }

      if (parentEl) parentEl.textContent = map.parent;
      if (currentEl) currentEl.textContent = currentLabel;
    }

    // Nút "Quay lại" chỉ hiện khi có trang trước để lùi về
    if (backBtn) {
      backBtn.style.display = navStack.length > 1 ? "inline-flex" : "none";
    }
  }

  // Đưa nav stack + breadcrumb về trạng thái trang chủ
  function resetToHome() {
    navStack = ["panel-movies"];
    currentPanel = "panel-movies";
    isBackNavigating = false;
    renderBreadcrumb("panel-movies");
  }

  // ---- BỌC switchCgvTab: chạy hàm gốc rồi cập nhật điều hướng ----
  var _origSwitch = window.switchCgvTab;
  if (typeof _origSwitch === "function") {
    window.switchCgvTab = function (panelId, filterType) {
      var result = _origSwitch.apply(this, arguments);

      currentPanel = panelId;

      if (!isBackNavigating) {
        // Điều hướng tiến: đẩy vào stack nếu khác trang hiện tại trên đỉnh
        if (navStack[navStack.length - 1] !== panelId) {
          navStack.push(panelId);
        }
      }
      isBackNavigating = false;

      renderBreadcrumb(panelId, filterType);
      return result;
    };
  }

  // ---- BỌC goToBookingStep: hiển thị đúng bước đặt vé trên breadcrumb ----
  var _origStep = window.goToBookingStep;
  if (typeof _origStep === "function") {
    window.goToBookingStep = function (step) {
      var result = _origStep.apply(this, arguments);
      if (currentPanel === "panel-booking") {
        var currentEl = el("bc-current-text");
        var parentEl = el("bc-parent-text");
        if (parentEl) parentEl.textContent = "Đặt Vé Trực Tuyến";
        if (currentEl && BOOKING_STEP_LABELS[step]) {
          currentEl.textContent = BOOKING_STEP_LABELS[step];
        }
      }
      return result;
    };
  }

  // ---- BỌC goHomeFromBc: giữ nguyên phần dọn dẹp cũ, reset stack ----
  var _origHome = window.goHomeFromBc;
  window.goHomeFromBc = function () {
    isBackNavigating = true; // tránh switchCgv('panel-movies') đẩy thêm vào stack
    if (typeof _origHome === "function") {
      _origHome.apply(this, arguments);
    }
    resetToHome();
  };

  // ---- Nút "Quay lại": lùi đúng một bước theo stack ----
  window.handleBreadcrumbBack = function () {
    if (navStack.length <= 1) return;
    navStack.pop(); // bỏ trang hiện tại
    var prev = navStack[navStack.length - 1]; // trang đích để lùi về
    isBackNavigating = true;
    window.switchCgvTab(prev);
    // renderBreadcrumb đã chạy trong switchCgvTab; đảm bảo nút back đúng
    renderBreadcrumb(prev);
  };

  // Cập nhật lần đầu khi tải trang
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      renderBreadcrumb(currentPanel);
    });
  } else {
    renderBreadcrumb(currentPanel);
  }
})();