// js/state.js
let serverData = { masterSeatStore: {}, movies: [], showtimes: [] };
window.fnbMenu = [
  {
    id: "fnb1",
    name: "LAS Combo Thần Thánh",
    price: 85000,
    icon: "🍿",
    qty: 0,
    desc: "1 Bắp lớn + 2 Nước ngọt vừa",
    items: ["Bắp rang bơ (cỡ lớn)", "2x Nước ngọt vừa"],
    popular: true,
  },
  {
    id: "fnb2",
    name: "My Combo (1 Bắp + 1 Nước)",
    price: 65000,
    icon: "🥤",
    qty: 0,
    desc: "1 Bắp vừa + 1 Nước ngọt vừa",
    items: ["Bắp rang muối (cỡ vừa)", "1x Nước ngọt vừa"],
    popular: false,
  },
  {
    id: "fnb3",
    name: "Snack Khoai Tây Phô Mai",
    price: 35000,
    icon: "🍟",
    qty: 0,
    desc: "Khoai tây chiên phủ sốt phô mai",
    items: ["Khoai tây chiên giòn", "Sốt phô mai đặc biệt"],
    popular: false,
  },
];
// 🔒 "Lính gác" F&B: tự phát hiện khi người dùng chuyển sang phim/suất chiếu KHÁC
// so với lần chọn F&B trước đó, và tự xóa sạch số lượng cũ trước khi hiển thị.
// Đặt ở state.js (load đầu tiên) để MỌI file sau đều dùng chung được, bất kể
// có bao nhiêu bản trùng của quickBookMovie/calculateCgvCart đang "giành nhau" chạy.
window.fnbCartOwnerKey = null;

// 🔒 "Lính gác" F&B + Voucher: dùng cờ tường minh thay vì đoán qua DOM
// (đoán qua DOM bị lỗi do window.currentSelectedShowtimeId có thể chưa
// kịp có giá trị lúc render lần đầu, gây xóa nhầm dữ liệu vừa chọn).
window.fnbNeedsReset = false;

// Gọi hàm này ở đúng lúc BẮT ĐẦU một đơn đặt vé mới (bấm nút Đặt vé)
window.markNewBookingSession = function () {
  window.fnbNeedsReset = true;
};

// Gọi hàm này ngay trước khi VẼ màn hình F&B — chỉ xóa nếu cờ đang bật,
// và tự tắt cờ ngay sau đó nên không xóa lặp lại trong cùng một đơn.
window.resetFnbIfNewBooking = function () {
  if (window.fnbNeedsReset) {
    if (Array.isArray(window.fnbMenu)) {
      window.fnbMenu.forEach((item) => { item.qty = 0; });
    }
    const voucherInput = document.getElementById("voucher-input");
    if (voucherInput) voucherInput.value = "";
    window.currentVoucher = null;
    if (typeof appliedVoucherDiscount !== "undefined") {
      appliedVoucherDiscount = 0;
    }
    window.fnbNeedsReset = false;
  }
};
let appliedVoucherDiscount = 0;
let userPastInvoices = [];
let selectedSeats = [];
let selectedShowtime = "";
let currentMovieFilter = "now_showing";
let currentPriceTotal = 0;
let isHoldingState = false;
let timerInterval = null;
let isUserLoggedInState = false;
let cgvNavigationHistory = ["panel-movies"];
let activeSearchKeyword = "";
let selectedDateStr = "";
let currentBannerIndex = 0;
let totalBanners = 0;
let temporaryRegisterEmail = "";
let fnbMenu = window.fnbMenu;